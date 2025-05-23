import * as helpers from "../helpers.js";
import { users, collectionIndex, collectionInventory, gacha } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import weighted from "weighted";
import { getEntryById, markCollected, getAllIndexEntries } from "./collectionIndex.js";
import { addCharacterToInventory, levelUpPlayer } from "./collectionInventory.js";

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
    if (typeof (pullCount) !== "number"
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

    if (ticketType === "normal") {
        // otherwise, check if the user has enough normal tickets
        if (user.metadata.ticket_count.normal < pullCount) {
            throw "Player doesn't have enough normal tickets."
        }
        return true; // player has enough tickets to pull
    } else if (ticketType === "golden") {
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
    characterId = helpers.validateString(characterId, "Character ID");
    // verify that characterId is a valid ObjectID
    if (!ObjectId.isValid(characterId)) {
        throw "Invalid character ID.";
    }
    // get character from gacha collection
    const gachaCollection = await gacha();
    const gachaCharacter = await gachaCollection.findOne({ _id: ObjectId.createFromHexString(characterId) });

    // if there's no character, throw
    if (gachaCharacter === null) throw `No gacha character with id of ${characterId}.`;
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
 * Updates the pull history of the user with the given id.
 */
const updatePullHistory = async (userId, characters) => {
    // verify thatt userId is a valid string and ObjectId
    userId = helpers.validateObjectId(userId, "User ID");
    // verify that characters was passed in
    if (!characters) throw "Missing array of pulled characters.";
    // verify that characters is a valid array
    if (!Array.isArray(characters) || characters.length === 0) throw "Pulled characters must be in an array of at least one character.";
    // check if user exists with that id
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });

    if (!user) throw `No user with id ${userId}.`;
    // check pull type
    let pull_type = "single"
    if (characters.length > 1) {
        pull_type = "bulk";
    }

    // compute the array for the 'pulled' field for the user's pull history
    let pulled = [];
    for (let i = 0; i < characters.length; i++) {
        // get the character's id from the index
        // let charId = await helpers.getCharacterIdByName(charName);
        let charId = characters[i];
        let character = await getEntryById(charId);
        // let charName = characters[i];
        let charName = character.name;
        // get the character's rarity from the index
        let rarity = character.rarity;
        // get the image from index 
        let image = character.image;
        // get the current time as MM/DD/YY HH:MM:SS to reflect the pull date
        let currDate = helpers.getCurrentDateAndTime();
        let pullChar = {
            _id: ObjectId.createFromHexString(charId),
            name: charName,
            rarity: rarity,
            timestamp: currDate,
            image: image
        };
        pulled.push(pullChar);
    }
    // construct new pull object for pull history
    const newPull = {
        pull_type: pull_type,
        pulled: pulled
    }

    // add new pull object to the current pull history
    user.pull_history.unshift(newPull)
    const MAX_HISTORY_LENGTH = 10;
    // if the new pull history has more than the fixed amount of pulls specified, we pop the oldest pull 
    if (user.pull_history.length > MAX_HISTORY_LENGTH) {
        user.pull_history.pop();
    }
    const updateInfo = await userCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "pull_history": user.pull_history } });
    if (updateInfo.modifiedCount === 0) throw `Could not update the pull history of user with id: ${userId}`;
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
    if (ticketType === "normal") {
        return user.metadata.ticket_count.normal;
    } else if (ticketType === "golden") {
        return user.metadata.ticket_count.golden;
    } else {
        throw "Invalid ticket type, must either be 'normal' or 'golden'.";
    }

}


/**
 * This function will check if the user can pull and if so, does a pull equal to the given pull count (should only either be 1 or 5) using the odds based on the pull type (normal or golden). 
 * 
 * It will update the user's collection inventory to include the new character(s) assuming they're not duplicates; otherwise, it will update the user’s currency amount to include the duplicate currency. 
 * 
 * Pull type is case-insensitive.
 * 
 * It will update pull history with all pulled characters both new and duplicates.
 * 
 * Returns an object containing an array of all pulled characters and an array of booleans stating whether they're duplicates. Object always has an array even if pullCount was 1.
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
    if (typeof (pullCount) !== "number"
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
    let pulledCharacters = { // object that stores the pulled characters and whether they were duplicates
        pulled: [], // store pulled characters in an array
        duplicates: [], // array of currency amounts corresponding to the pulled character's duplicate currency (if the character is new then its value is 0)
        normal: 0, // counter for how many times the player leveled up and got a normal ticket (in case they level up more than once)
        golden: 0, // counter for how many times the player leveled up and got a golden ticket (in case they level up more than once)
    };

    // check if user exists and if so, can they do this specific gacha pull
    if (await canPull(userId, pullCount, pullType)) {
        // get array of all characters in gacha collection
        let gachaCharacters = await getAllGachaCharacters();

        if (pullType === 'normal') {
            // setup an object of (characterId, pull_rate) pairs considering normal pull_rates
            let normalPull = {};
            gachaCharacters.map((character) => {
                normalPull[character._id] = character.pull_rate;
            });

            // do the given amount of pulls
            for (let i = 0; i < pullCount; i++) {
                pulledCharacters.pulled.push(weighted.select(normalPull, { normal: false }));
            }

        } else if (pullType === "golden") {
            const GOLDEN_RATE = 3; // weight multiplier applied to rare character's pull_rate
            const RARE_THRESHOLD = 0.2;// weight multiplier is applied to characters whose pull_rate is no more than this threshold 
            // setup an object of character-pull_rate pairs considering golden pull_rates, i.e. increase odds of pulling rarer characters
            let goldenPull = {};
            gachaCharacters.map((character) => {
                // checks if character is rare enough based on RARE_THRESHOLD
                if (character.pull_rate <= RARE_THRESHOLD) {
                    goldenPull[character._id] = character.pull_rate * GOLDEN_RATE; // increase chance of being pulled with weight multiplier
                } else {
                    goldenPull[character._id] = character.pull_rate;
                }
            });

            // do the given amount of pulls
            for (let i = 0; i < pullCount; i++) {
                pulledCharacters.pulled.push(weighted.select(goldenPull, { normal: false })); // normal is an option for whether or not the weights for the characters are normalized, we set this to false so the function normalizes for us
            }
        } else {
            throw "Pull type must either be 'normal' or 'golden'.";
        }

        // Check if any pulls are duplicates and if so, increase user's currency with the corresponding duplicate currency
        for (let i = 0; i < pulledCharacters.pulled.length; i++) {
            let characterId = pulledCharacters.pulled[i];
            let collected = await markCollected(characterId); // update 'collected' field in collection index to true for each of the new pulled characters
            let character = await getGachaCharacterById(characterId); // get gacha document of character with corresponding character id 
            if (collected) {
                // update the user's collection inventory to include the new character(s) assuming they're not duplicates
                try {
                    await addCharacterToInventory(userId, characterId);
                } catch (e) {
                    console.log(e)
                }
                pulledCharacters.duplicates.push(0); // this character isn't a duplicate so push 0
            } else {
                // Give user the corresponding duplicate currency
                pulledCharacters.duplicates.push(character.duplicate_currency); // push character's duplicate currency amount
                console.log(await helpers.updateCurrencyCount(userId, character.duplicate_currency));
            }
        }

        // Give user experience for pulling character(s)
        const EXP_GAIN = 50; // amount of experience points earned per pull
        const metadata = await helpers.getUserMetadata(userId);
        let curr_level = metadata.experience.level; // keep track of current level
        // update exp per pull to keep track how many times the user leveled up per pull in case it was more than once
        for (let i = 0; i < pullCount; i++) {
            let leveledUp = await levelUpPlayer(userId, EXP_GAIN);
            // check if user leveled up as a result of the exp gain
            if (leveledUp) {
                curr_level += 1; // increment level counter
                // if user's current level is a multiple of 10, give them a golden ticket
                if (curr_level % 10 === 0) {
                    pulledCharacters.golden++;
                } else {
                    // otherwise, give them a normal ticket
                    pulledCharacters.normal++;
                }
            }
        }

        // Update pull history with pulled character(s). Include the character's name, rarity, timestamp of pull, and image
        await updatePullHistory(userId, pulledCharacters.pulled);

        // decrement user's corresponding ticket count 
        await helpers.updateTicketCount(userId, pullType, -pullCount);
    }
    return pulledCharacters;
}

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
    if (typeof (pull_rate) !== "number"
        || pull_rate < 0
        || pull_rate > 1
        || Number.isNaN(pull_rate)) {
        throw "Pull rate must be a valid number in the range of 0 to 1.";
    }

    // verify that duplicate currency is at least 1
    if (typeof (duplicate_currency) !== "number"
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
    // check if character is already in the gacha
    const character = await gachaCollection.findOne({ _id: ObjectId.createFromHexString(character_id) });
    if (character) throw `${name} is already in the gacha with id: ${character_id}.`;

    const insertInfo = await gachaCollection.insertOne(newGachaCharacter); // insert new character into gacha system
    // if character wasn't created, throw
    if (!insertInfo.acknowledged || !insertInfo.insertedId)
        throw "Could not add " + name + " to the gacha system.";

    const newId = insertInfo.insertedId.toString(); // get new character's id 
    const gachaCharacter = await getGachaCharacterById(newId);     // get character object from gacha

    gachaCharacter._id = gachaCharacter._id.toString();     // convert new character id to string before returning object

    return gachaCharacter; // return object of new gacha character
}

/**
 * Checks if the user with given id has already achieved endgame and has the endgame character in their inventory
 */
export const hasEndgame = async (userId) => {
    const endgameCharacterId = new ObjectId("656f0000000000000000ed9a");
    userId = helpers.validateObjectId(userId, "User ID");
    const inventoryCollection = await collectionInventory();
    const inventory = await inventoryCollection.findOne({ user_id: ObjectId.createFromHexString(userId) });
    if (!inventory) throw `No inventory with that id `;

    let endgameAchieved = false;

    for (let char of inventory.obtained) {
        if (char._id.toString() === endgameCharacterId.toString()) {
            endgameAchieved = true;
        }
    }

    return endgameAchieved;
}


/**
 * Checks if the user with the given id has collected all the characters and has not yet gained the endgame character, returns false if either the character already has the endgame character or if they don't have all the characters and returns true only if they have all the characters except the endgame character.
 */
export const collectedAll = async (userId) => {
    // verify that user id is valid object id 
    userId = helpers.validateObjectId(userId, "User ID");
    // verify that a user exists with that id
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    if (!user) throw `No user with that id: ${userId}.`;

    const indexEntries = await getAllIndexEntries();
    const metadata = await helpers.getUserMetadata(userId);
    const endgameAchieved = await hasEndgame(userId);

    if (indexEntries.length === metadata.obtained_count) {
        if (!endgameAchieved) {
            return true;
        }
        else {
            return false;
        }
    } else {
        return false;
    }
}

/**
 * 
 */
export const grantEndgameCharacter = async (userId) => {
    userId = helpers.validateObjectId(userId, "User ID");
    const userCollection = await users();
    const inventoryCollection = await collectionInventory();
    // const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });

    // check if endgame character already exists in inventory 
    const endgameCharacterId = new ObjectId("656f0000000000000000ed9a");
    const endgameCharacterExists = await inventoryCollection.findOne({
        user_id: ObjectId.createFromHexString(userId),
        "obtained._id": endgameCharacterId
    });

    if (endgameCharacterExists) {
        return false;
    }
    // create endgame character for inventory 
    let endgameCharacter = {
        _id: endgameCharacterId,
        name: "Patrick Hill",
        nickname: "Patrick Hill",
        rarity: "legendary",
        image: "https://media-hosting.imagekit.io/30287ac28ebb45af/professorHill.png?Expires=1841793798&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=3Edl6ppSbtYPaVh1Lmaq-IL6PVMgOGQWsMZcXA4gEjWwxdwm9RckbzuQhYxxlVNf~jHQFRGa1WorVgcsNBx70X4B7IW6sPcMr9ttPAMcgO4sHR9J7Nwxok2ggRNlAvekZfzFaUvIddoy9tHCBevv8AyfRMdocbLlmysA~7~B2prp0FIjemw71KI0Za08SuMfaLjlNbUpS7RTWMyXa4PlCGFFBnt4XczfVUQcMbK-JmfPs05WOC11dbxZpZr8GzYK9SdUORNWGKO6MaAVIUKhOf4WuWk1qIo7xTHiA8ikWrwzgReIQQJLInv1Fd0YFpoy~UNRMhbPOGA0OsgZIraUcA__",
        experience: {
            curr_exp: 0,
            exp_capacity: 999,
            level: 1,
            income: 500
        }
    };

    let result = await inventoryCollection.updateOne(
        { user_id: new ObjectId(String(userId)) },
        { $push: { obtained: endgameCharacter } },
    );

    if (result.modifiedCount === 0) {
        throw new Error("Grant endgame character has failed");
    }

    // create endgame character for index
    let endgameIndexEntry = {
        _id: endgameCharacterId,
        name: "Patrick Hill",
        rarity: "legendary",
        image: "https://media-hosting.imagekit.io/30287ac28ebb45af/professorHill.png?Expires=1841793798&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=3Edl6ppSbtYPaVh1Lmaq-IL6PVMgOGQWsMZcXA4gEjWwxdwm9RckbzuQhYxxlVNf~jHQFRGa1WorVgcsNBx70X4B7IW6sPcMr9ttPAMcgO4sHR9J7Nwxok2ggRNlAvekZfzFaUvIddoy9tHCBevv8AyfRMdocbLlmysA~7~B2prp0FIjemw71KI0Za08SuMfaLjlNbUpS7RTWMyXa4PlCGFFBnt4XczfVUQcMbK-JmfPs05WOC11dbxZpZr8GzYK9SdUORNWGKO6MaAVIUKhOf4WuWk1qIo7xTHiA8ikWrwzgReIQQJLInv1Fd0YFpoy~UNRMhbPOGA0OsgZIraUcA__",
        description: "Patrick Hill has worked as a professional software developer since 1998. He holds an Associate in Applied Science in Computer Programming and Systems from LaGuardia Community College, a Bachelor of Business Administration with a concentration in Computer Information Systems and a minor in Psychology from Baruch College, and a Master of Science in Computer Science from Stevens Institute of Technology. He is very proud that he graduated with a 4.0 GPA from his studies at Stevens.",
        collected: true
    }

    const indexCollection = await collectionIndex();
    const entry = await indexCollection.findOne({ _id: endgameCharacterId });
    if (entry) throw `User with id: ${userId} already has the endgame character.`;
    const insertInfo = await indexCollection.insertOne(endgameIndexEntry);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw `Could not insert the endgame character into the index.`;
    }

    return true;
}



