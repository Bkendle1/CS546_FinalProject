import * as helpers from "../helpers.js";
import { users, collectionIndex, gacha } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import weighted from "weighted";

/**  Given the user's id, the size of the pull (should be either 1 or 5), and ticket type. Check if player has enough tickets to pull with. Ticket type is case-insensitive.
*/
const canPull = async (userId, pullCount, ticketType) => {
    // check if userId is a valid string
    userId = helpers.validateString(userId, "User ID");
    // check if userId is a valid objectId
    if (!ObjectId.isValid(userId)) {
        throw "Invalid user ID.";
    }
    // check that pull count is not undefined
    if (pullCount === undefined) {
        throw "Missing pull count.";
    }
    // check that pull count is not 0, negative, or a NaN
    if (typeof (pullCount) !== 'number'
        || Number.isNaN(pullCount)
        || pullCount <= 0
        || !Number.isInteger(pullCount)) {
        throw "Pull count must be a positive whole number that's at least 1.";
    }

    // verify that ticketType is a valid string
    ticketType = helpers.validateString(ticketType, "Ticket type");
    ticketType = ticketType.toLowerCase();

    // check if user has enough normal tickets for pull
    const userCollection = await users();
    // get user from collection with given id
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });

    // if no user exists with the given id, throw 
    if (user === null) throw "No user with that id.";

    if (ticketType === 'normal') {
        // otherwise, check if the user has enough normal tickets
        if (user.metadata.ticket_count.normal < pullCount) {
            throw "Player doesn't have enough normal tickets."
        }
        return true; // player has enough tickets to pull
    } else if (ticketType === 'golden') {
        if (user.metadata.ticket_count.golden < pullCount) {
            throw "Player doesn't have enough golden tickets."
        }
        return true; // player has enough tickets to pull
    } else {
        throw "Ticket type must be 'normal' or 'golden'";
    }

}

/** 
 * Return the object whose id is the given characterId from the gacha collection. 
 */
const getGachaCharacterById = async (characterId) => {
    // verify that characterId is a valid string
    characterId = helpers.validateString(characterId, "Character IDd");
    // verify that characterId is a valid ObjectID
    if (!ObjectId.isValid(characterId)) {
        throw "Invalid character ID.";
    }
    // get character from gacha collection
    const gachaCollection = await gacha();
    const gachaCharacter = await gachaCollection.findOne({ _id: ObjectId.createFromHexString(characterId) });

    // if there's no character, throw
    if (gachaCharacter === null) throw "No gacha character with that id.";
    // return character object with its id as a string
    gachaCharacter._id = gachaCharacter._id.toString();
    return gachaCharacter;
}

/**
 * Returns an array of all character documents in the gacha collection with their _id field as a string. If no characters are in the gacha database, return an empty array. 
 */
const getAllGachaCharacters = async () => {
    let gachaCharacters = [];
    const gachaCollection = await gacha();
    gachaCharacters = await gachaCollection.find({}).toArray();
    if (!gachaCharacters) {
        throw "Could not get all characters from gacha.";
    }
    // convert all gacha characters's _id field into a string
    gachaCharacters = gachaCharacters.map((character) => {
        character._id = character._id.toString();
        return character;
    });
    return gachaCharacters;
}

/**
 * Given a user's id, return the number of tickets they have of the given ticket type. Ticket type is case-insensitive
 */
export const getTicketCount = async (userId, ticketType) => {
    // verify that userId is a valid string
    userId = helpers.validateString(userId, "User ID");
    // verify that userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
        throw "Invalid user id.";
    }
    // verify that ticket type is a valid string 
    ticketType = helpers.validateString(ticketType, "Ticket type");
    ticketType = ticketType.toLowerCase();

    // get user object from user collection
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    // if user doesn't exist, throw
    if (!user) throw "No user with that id.";

    // return the corresponding ticket type
    if (ticketType === 'normal') {
        return user.metadata.ticket_count.normal;
    } else if (ticketType === 'golden') {
        return user.metadata.ticket_count.golden;
    } else {
        throw "Invalid ticket type, must either be 'normal' or 'golden'.";
    }

}

// try {
//     console.log(await getTicketCount("681e470761eacb4e94201ee6", "NORMAL"));
// } catch (e) {
//     console.log(e);
// }

/**
 * This function will check if the user can pull and if so, does a pull equal to the given pull count (should only either be 1 or 5) using the odds based on the pull type (normal or golden). It will also update the user's collection inventory to include the new character(s) assuming they're not duplicates; otherwise, it will update the user’s currency amount to include the duplicate currency. 
 * 
 * Pull type is case-insensitive.
 * 
 * Returns all pulled characters as an array even if pullCount was 1.
 */
export const gachaPull = async (userId, pullCount, pullType) => {
    // check if userId is a valid string
    userId = helpers.validateString(userId, "User ID");
    // check if userId is a valid ObjectID
    if (!ObjectId.isValid(userId)) {
        throw "Invalid user ID.";
    }
    // check if pull count was provided
    if (pullCount === undefined) {
        throw "Pull count is missing.";
    }
    // check that pullCount is a whole number of at least 1
    if (typeof (pullCount) !== 'number'
        || pullCount < 1
        || Number.isNaN(pullCount)
        || !Number.isInteger(pullCount)) {
        throw "Pull count has to be a positive whole number that's at least 1."
    }
    // check that pullType is valid string 
    pullType = helpers.validateString(pullType, "Pull type");
    // check if the pull type is a valid option
    pullType = pullType.toLowerCase();
    if (pullType !== "normal" && pullType !== "golden") {
        throw "Pull type can only be either 'normal' or 'golden'.";
    }

    // check if user has enough tickets for this pull type (either golden or normal)
    let pulledCharacters = []; // store pulled characters in an array
    if (await canPull(userId, pullCount, pullType)) {
        // get array of all characters in gacha collection
        let gachaCharacters = await getAllGachaCharacters();

        if (pullType === 'normal') {
            // setup an object of character-pull_rate pairs considering normal pull_rates
            let normalPull = {};
            gachaCharacters.map((character) => {
                normalPull[character.name] = character.pull_rate;
            });

            // do the given amount of pulls
            for (let i = 0; i < pullCount; i++) {
                pulledCharacters.push(weighted.select(normalPull, { normal: false }));
            }

        } else if (pullType === 'golden') {
            const GOLDEN_RATE = 3; // weight multiplier applied to rare character's pull_rate
            const RARE_THRESHOLD = 0.2;// weight multiplier is applied to characters whose pull_rate is no more than this threshold 
            // setup an object of character-pull_rate pairs considering golden pull_rates, i.e. increase odds of pulling rarer characters
            let goldenPull = {};
            gachaCharacters.map((character) => {
                // checks if character is rare enough based on RARE_THRESHOLD
                if (character.pull_rate <= RARE_THRESHOLD) {
                    goldenPull[character.name] = character.pull_rate * GOLDEN_RATE; // increase chance of being pulled with weight multiplier
                } else {
                    goldenPull[character.name] = character.pull_rate;
                }
            });
            // do the given amount of pulls
            for (let i = 0; i < pullCount; i++) {
                pulledCharacters.push(weighted.select(goldenPull, { normal: false })); // normal is an option for whether or not the weights for the characters are normalized, we set this to false so the function normalizes for us
            }
        } else {
            throw "Pull type must either be 'normal' or 'golden'.";
        }

        // TODO: using a collectionInventory.js data function, check if any pulls are duplicates and if so, increase user's currency with the corresponding duplicate currency

        // TODO: using a collectionInventory.js data function, update the user's collection inventory to include the new character(s) assuming they're not duplicates

        // decrement user's corresponding ticket count 
        helpers.updateTicketCount(userId, pullType, -pullCount);
    }

    // TODO: update 'collected' field in collection index to true (call function from collectionIndex.js data function) for each of the pulled characters

    // TODO: Update pull history with pulled character assuming its not a duplicate. Include the character's name, rarity, timestamp of pull, and image

    console.log(`DEBUG-DATA: ${pulledCharacters}`);
    return pulledCharacters;
}


// try {
//     console.log(await gachaPull("67fbccf7bedaaf5edc00dae7", 2, "GOLDEN"));
// } catch (e) {
//     console.log(e);
// }


/**
 * Given a name, pull_rate, and duplicate currency, add a new character to the gacha system.
 * IMPORTANT: Since characters will share the same _id across different collections, the new character must already exist in the collection index collection as that's where we copy the _id field from.
 * Name is also case-insensitive. 
*/
export const addCharacterToGacha = async (name, pull_rate, duplicate_currency) => {
    // verify that name is a valid string
    name = helpers.validateString(name, "Character name");
    name = name.toLowerCase(); // name is case-insensitive
    // verify that pull rate is between 0 and 1
    if (typeof (pull_rate) !== 'number'
        || pull_rate < 0
        || pull_rate > 1
        || Number.isNaN(pull_rate)) {
        throw "Pull rate must be a valid number in the range of 0 to 1.";
    }

    // verify that duplicate currency is at least 1
    if (typeof (duplicate_currency) !== 'number'
        || duplicate_currency < 1
        || Number.isNaN(duplicate_currency)
        || !Number.isInteger(duplicate_currency)) {
        throw "Duplicate currency has to be a positive whole number that's at least 1."
    }

    // create new character entry for the gacha collection 
    // NOTE: the new gacha character must already be in the collection index so we can copy over the ObjectId
    const character_id = await helpers.getCharacterIdByName(name);
    const newGachaCharacter = {
        _id: ObjectId.createFromHexString(character_id),
        name: name,
        pull_rate: pull_rate,
        duplicate_currency: duplicate_currency
    }

    const gachaCollection = await gacha(); // get reference to gacha collection
    const insertInfo = await gachaCollection.insertOne(newGachaCharacter); // insert new character into gacha system
    // if character wasn't created, throw
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw `Could not add ${name} to the gacha system.`;

    const newId = insertInfo.insertedId.toString(); // get new character's id 
    const gachaCharacter = await getGachaCharacterById(newId);     // get character object from gacha

    gachaCharacter._id = gachaCharacter._id.toString();     // convert new character id to string before returning object

    return gachaCharacter; // return object of new gacha character
}