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

export function validateObjectId(id, varName) {
    id = validateString(id, varName);
    if (!ObjectId.isValid(id)) {
        throw `${varName} is not a valid ObjectId.`;
    }
    return id;
}
  
export function validatePositiveInteger(num, varName) {
    if (typeof num !== "number" || !Number.isInteger(num) || num <= 0) {
        throw `${varName} must be a positive integer.`;
    }
    return num;
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
/**
 * Given a username, verify that it is valid 
 */
export function validateUsername(str) {
    str = validateString(str,"Username");

    // A-Z: 65 to 90
    // a-z: 97 to 122
    // 0-9: 48 to 57
    for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);

        if (!(charCode >= 65 && charCode <= 90) && !(charCode >= 97 && charCode <= 122) && !(charCode >= 48 && charCode <= 57)) {
            throw new Error("Username should only contain letters or positive whole numbers");
        }
    }

    // minimum length = 5 characters, maximum length = 10 characters
    if ((str.length < 5) || (str.length > 10)) {
        throw new Error("Username must have at least 5 characters and at max of 10 characters");
    }

    // return as lowercase version to store in database 
    return str.toLowerCase();
}

/**
 * Given a email, verify that it is valid 
 */
export function validateEmail(str) {
    str = validateString(str,"Email");
    let isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!isValidEmail.test(str)) {
        throw new Error("Email must be a valid: no spaces, contains an @ and .<domain>");
    }

    if (str.length > 254) {
        throw new Error("Email maximum length is 254 characters");
    }

    // return as lowercase version to store in database 
    return str.toLowerCase();
}

/**
 * Given a password, verify that it is valid 
 */
export function validatePassword(str) {
    // dont trim passwords !! 
    if (!str) {
        throw new Error(`Password needed`);
    }
    if (typeof str !== "string") {
        throw new Error(`Password must be a string`);
    }
    if (str.length === 0) {
        throw new Error(`Password cannot be an empty string or with only spaces`);
    }

    // check if contains a space
    if (str.includes(" ")) {
        throw new Error("Password can not contain spaces, but can include any other character, including special characters");
    }

    // minimum length = 8 characters
    if (str.length < 8 || str.length > 25) {
        throw new Error("Password must have at least 8 characters (max of 25 characters)");
    }

    // constraints: at least one uppercase character, at least one number, at least one special character
    let hasUpper = /[A-Z]/.test(str);
    let hasNumber = /[0-9]/.test(str);
    let hasSpecial = /[^a-zA-Z0-9 ]/.test(str); // special character is defined as anything that is not a number, letter, or space

    if (!hasUpper || !hasNumber || !hasSpecial) {
        throw new Error("Password must contain at least one uppercase character, at least one number, at least one special character (special character is defined as anything that is not a number, letter, or space)");
    }

    return str;
}

/**
 * Given experience number, verify that it is valid
 */
export function validateExperience(exp) {
    if (exp === undefined || exp === null) {
        throw new Error("Experience missing!");
    }
    if (typeof exp !== "number" || isNaN(exp) || exp == Infinity || exp == -Infinity || !Number.isInteger(exp)) {
        throw new Error("Experience must be a finite whole number!");
    }
    if (exp <= 0) {
        throw new Error("Experience must be a positive non-zero number");
    }

    return exp;
}


/**
 * Given rarity and level, return the income rate 
 */
export function calculateIncome(rarity,level = 1) {
    // default values for now, we can change it later
    let baseIncome = 0;
    rarity = rarity.toLowerCase().trim();

    if (rarity === "common") {
        baseIncome = 50;
    }
    else if (rarity === "uncommon") {
        baseIncome = 100;
    }
    else if (rarity === "rare") {
        baseIncome = 200;
    }
    else if (rarity === "legendary") {
        baseIncome = 500;
    } 
    else {
        throw new Error("Invalid rarity given");
    }
    
    // increase by 10% after level 1
    let income = Math.floor(baseIncome*Math.pow(1.1,level - 1));

    return income;
}



