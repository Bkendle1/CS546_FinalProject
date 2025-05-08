import * as helpers from "../helpers.js";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

/*  Given the user's id, the size of the pull (should be either 1 or 5), and ticket type. Check if player has enough tickets to pull with. */
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
try {
    console.log(await canPull("67fbccf7bedaaf5edc00dae7", 50, "normal"));
} catch (e) {
    console.log(e);
}
// Normal Gacha pull function. Checks if the user can pull and if so, does a pull equal to the given pull count (should only either be 1 or 5) using the odds of a normal ticket. Update user's collection inventory to include new character assuming its not a duplicate.
export const normalPull = async (userId, pullCount) => {
    // check if userId is a valid string
    // check if userId is a valid ObjectID
}

// Golden Gacha pull function. Checks if the user can pull and if so, do a pull using the odds of a golden ticket. (Probability of higher rarity characters is higher). Update user's collection inventory to include new character assuming its not a duplicate.

// Check if pull is a duplicate. If so, give the user currency in exchange which varies depending on the rarity of the pulled character

// Given a name, duplicate currency, and pull rate, add a character to the gacha system.


// Update pull history with pulled character assuming its not a duplicate. Include the character's name, rarity, timestamp of pull, and image