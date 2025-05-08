import { users, collectionIndex, gacha } from "./config/mongoCollections.js";
import { ObjectId } from "mongodb";
/**
 * Verifies that the given string is not undefined, empty, not of type string, nor just whitespace, and also returns the string trimmed with trim().
 */
export const validateString = (str, varName) => {
    // check if string is undefined
    if (str === undefined) throw `${varName || "One of the inputs"} is missing.`;
    // check if string is of type string
    if (typeof (str) !== "string") throw `${varName || "Input"} must be a string.`;
    // check if string is empty string or whitespaces
    if (str.trim().length === 0) throw `${varName || "Input"} can not be empty or just whitespaces.`;

    return str.trim(); // return trimmed string
}

/**
 * Given a character's name, returns their character_id as a string from the collection index collection (i.e. the collection for our character index) based on that name.
 */
export const getCharacterIdByName = async (name) => {
    // verify that name is valid string
    name = validateString(name, "Character name");

    const collIndexCollection = await collectionIndex(); // get reference to the collection index collection (i.e. the collection where our character index)
    const character = await collIndexCollection.findOne({ name: name }); // get character with 'name'
    // if no character with that name is found, throw
    if (!character) {
        throw "No character with that name.";
    }
    return character._id.toString(); // return string of character id
}

/**
 * Given a user's id, increment or decrement their current count of the given ticketType by a given amount. Decrements should be negative. Ticket type is case insensitive. If the decremented value would bring the ticket count to be smaller than 0, the count stays 0.
 */
export const updateTicketCount = async (userId, ticketType, amount) => {
    // verify that userId is a valid string
    userId = validateString(userId, "User ID");
    // verify that userId is a valid ObjectId
    if (!ObjectId.isValid(userId)) {
        throw "Invalid user ID.";
    }
    // verify that ticketType is a valid string
    ticketType = validateString(ticketType, "Ticket type");
    ticketType = ticketType.toLowerCase(); // ticket type should be case-insensitive
    // verify that amount was provided
    if (amount === undefined) {
        throw "Missing ticket amount.";
    }
    // verify that amount is a valid whole number 
    if (typeof (amount) !== 'number'
        || !Number.isInteger(amount)
        || Number.isNaN(amount)) {
        throw "Ticket amount must be a valid whole number."
    }

    // get reference to user
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    // if user doesn't exist, throw
    if (!user) {
        throw "User does not exist."
    }

    // otherwise, update the ticketType count by the given amount
    if (ticketType === 'normal') {
        const newCount = Math.max(0, user.metadata.ticket_count.normal += amount); // compute new ticket count 
        await userCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "metadata.ticket_count.normal": newCount } });
        return `${user.username} now has ${newCount} normal tickets.`
    } else if (ticketType === 'golden') {
        const newCount = Math.max(0, user.metadata.ticket_count.golden += amount); // compute new ticket count
        await userCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "metadata.ticket_count.golden": newCount } });
        return `${user.username} now has ${newCount} golden tickets.`
    } else {
        throw "Ticket type must be 'normal' or 'golden'.";
    }
}