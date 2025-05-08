import * as helpers from "../helpers.js";
import { users, collectionIndex, gacha } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

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
 * This function will check if the user can pull and if so, does a pull equal to the given pull count (should only either be 1 or 5) using the odds based on the pull type (normal or golden). It will also update the user's collection inventory to include the new character assuming its not a duplicate; otherwise, it will update the user’s currency amount to include the duplicate currency. Pull type is case-insensitive.
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
    if (pullType !== "normal" || pullType !== "golden") {
        throw "Pull type can only be either 'normal' or 'golden'.";
    }

    // check if user has enough tickets for this pull type (either golden or normal)
    if (canPull(userId, pullCount, pullType)) {
        // decrement user's corresponding ticket count 
        helpers.updateTicketCount(userId, pullType, -pullCount);
        // store pulled characters in an array
        let pulledCharacters = [];
        // do the given amount of pulls
        for (let i = 0; i < pullCount; i++) {

        }
    }

    // update 'collected' field in collection index to true 
}

// Golden Gacha pull function. Checks if the user can pull and if so, do a pull using the odds of a golden ticket. (Probability of higher rarity characters is higher). Update user's collection inventory to include new character assuming its not a duplicate.

// Check if pull is a duplicate. If so, give the user currency in exchange which varies depending on the rarity of the pulled character

// Update pull history with pulled character assuming its not a duplicate. Include the character's name, rarity, timestamp of pull, and image


/**
 * Given a name, pull_rate, and duplicate currency, add a new character to the gacha system.
 * IMPORTANT: Since characters will share the same _id across different collections, the new character must already exist in the collection index collection as that's where we copy the _id field from.
 * Name is also case-insensitive
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

// try {
//     console.log(await addCharacterToGacha("Leomon", 0.5, 400));
// } catch (e) {
//     console.log(e);
// }


// try {
//     console.log(await addCharacterToGacha("deeznuts", 0.5, 1.));
// } catch (e) {
//     console.log(e);
// }


// try {
//     console.log(await helpers.getCharacterId("Leomon"));
// } catch (e) {
//     console.log(e);
// }

// try {
//     console.log(await canPull("67fbccf7bedaaf5edc00dae7", 1, "normal"));
// } catch (e) {
//     console.log(e);
// }