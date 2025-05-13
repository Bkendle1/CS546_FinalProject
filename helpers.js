import { users, collectionIndex, gacha } from "./config/mongoCollections.js";
import { ObjectId } from "mongodb";
import random from 'simple-random-number-generator';

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
        throw "Error: " + varName + " is not a valid ObjectId.";
    }
    return id;
}

export function validatePositiveInteger(num, varName) {
    if (typeof num != "number" || !Number.isInteger(num) || num <= 0 || Number.isNaN(num)) {
        throw "Error: " + varName + " must be a positive integer.";
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
        const updateInfo = await userCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "metadata.ticket_count.normal": newCount } });
        if (updateInfo.matchedCount === 0) {
            throw `Could not update user's normal ticket count.`
        }

        return `${user.username} now has ${newCount} normal tickets.`
    } else if (ticketType === 'golden') {
        const newCount = Math.max(0, user.metadata.ticket_count.golden += amount); // compute new ticket count
        const updateInfo = await userCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "metadata.ticket_count.golden": newCount } });
        if (updateInfo.matchedCount === 0) {
            throw `Could not update user's golden ticket count.`
        }

        return `${user.username} now has ${newCount} golden tickets.`
    } else {
        throw "Ticket type must be 'normal' or 'golden'.";
    }
}

/**
 * Update user's currency count by a given amount. Note: You can pass negatives to decrement currency count.
 */
export const updateCurrencyCount = async (userId, amount) => {
    // verify that userId is a valid string and ObjectId
    userId = validateObjectId(userId);
    // verify that amount is a valid integer
    if (typeof (amount) !== 'number'
        || !Number.isInteger(amount)
        || Number.isNaN(amount)
        || amount === 0) {
        throw "Currency amount must be a valid integer that's not 0.";
    }

    // check if a user with that id exists
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    if (!user) throw `No user with the id of ${userId}`;

    // update user's currency amount
    const newCount = Math.max(0, user.metadata.currency += amount); // currency count can't be less than 0
    const updateInfo = await userCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "metadata.currency": newCount } });
    if (updateInfo.matchedCount === 0) {
        throw "Could not update user's currency count.";
    }
    return `${user.username} now has ${newCount} in in-game currency.`;
}

/**
 * Given a username, verify that it is valid 
 */
export function validateUsername(str) {
    str = validateString(str, "Username");

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
    str = validateString(str, "Email");
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
 * Return a pull rate that's between 0 and 1 (both exclusive) that fits the given rarity.
 */
export const rarityToPullRate = (rarity) => {
    // verify that rarity is a valid string
    rarity = validateString(rarity, "Rarity");
    // set the rates of all rarities
    const commonRates = { max: 0.99, min: 0.80 };
    const uncommonRates = { max: 0.64, min: 0.50 };
    const rareRates = { max: 0.30, min: 0.20 };
    const legendaryRates = { max: 0.1, min: 0.01 };
    const PRECISION = 4; // how many significant digits to keep from the pull rate
    let pullRate = 0;
    // return a pull rate within the range of the corresponding rarities
    if (rarity === 'common') {
        pullRate = random(commonRates);
    } else if (rarity === 'uncommon') {
        pullRate = random(uncommonRates);
    } else if (rarity === 'rare') {
        pullRate = random(rareRates);
    } else if (rarity === 'legendary') {
        pullRate = random(legendaryRates)
    } else {
        throw "Invalid rarity. It must be: 'common', 'uncommon', 'rare', or 'legendary'."
    }
    return parseFloat(pullRate.toPrecision(PRECISION)); // toPrecision returns a string representation of the float so we convert it back into a float before returning it
};

/**
 * Returns a duplicate currency based on the given rarity.
 */
export const rarityToDupCurrency = (rarity) => {
    // make sure rarity is a valid string
    rarity = validateString(rarity, "Rarity");

    // set the currency ranges based on rarities
    const commonCurrency = { max: 200, min: 100, integer: true };
    const uncommonCurrency = { max: 400, min: 300, integer: true };
    const rareCurrency = { max: 800, min: 600, integer: true };
    const legendaryCurrency = { max: 1200, min: 1000, integer: true };

    // return a currency amount within the range of the corresponding rarities
    if (rarity === 'common') {
        return random(commonCurrency);
    } else if (rarity === 'uncommon') {
        return random(uncommonCurrency);
    } else if (rarity === 'rare') {
        return random(rareCurrency);
    } else if (rarity === 'legendary') {
        return random(legendaryCurrency)
    } else {
        throw "Invalid rarity. It must be: 'common', 'uncommon', 'rare', or 'legendary'."
    }
}


/**
 * Returns the current date and time in the format of MM/DD/YY HH:MM:SSAM/PM and pads the month/day with a 0 if its 1 digit.
 */
export const getCurrentDateAndTime = () => {
    let currDate = new Date();
    // get month
    let month = currDate.getMonth() + 1; // getMonth() returns month as a 0 index
    if (month.toString().length < 2) {
        month = '0' + month
    }

    // get day
    let day = currDate.getDate();
    if (day.toString().length < 2) {
        day = '0' + day;
    }
    // get year
    let year = currDate.getFullYear().toString().substring(2);

    // get hours
    let hours = currDate.getHours() % 12;
    // edge case: if its 12pm then currDate.getHours() % 12 = 0 which isn't correct so we do the following
    if (currDate.getHours() === 12) {
        hours = 12;
    }

    if (hours.toString().length < 2) {
        hours = '0' + hours;
    }
    // get minutes
    let minutes = currDate.getMinutes();
    if (minutes.toString().length < 2) {
        minutes = '0' + minutes;
    }
    // get seconds
    let seconds = currDate.getSeconds();
    if (seconds.toString().length < 2) {
        seconds = '0' + seconds;
    }

    // get meridiem (AM/PM)
    let meridiem = "AM";
    if (currDate.getHours() >= 12) {
        meridiem = "PM";
    }

    // combine to get current date
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}${meridiem}`;
}
/**
 * Given a number, verify that it is valid (positive whole number)
 */
export function validateNumber(number,parameterName) {
    if (number === undefined || number === null) {
        throw new Error(`${parameterName} missing!`);
    }
    if (typeof number !== "number" || isNaN(number) || number == Infinity || number == -Infinity || !Number.isInteger(number)) {
        throw new Error(`${parameterName} must be a finite whole number!`);
    }
    if (number <= 0) {
        throw new Error(`${parameterName} must be a positive non-zero number!`);
    }

    return number;
}

/**
 * Given nickname, verify that it is valid 
 */
export function validateNickName(str) {
    str = validateString(str, "Nickname");
    if (str.length > 20) {
        throw new Error("Nicknames can be a max of 20 characters");
    }

    return str;
}

/**
 * Given rarity and level, return the income rate 
 */
export function calculateIncome(rarity, level = 1) {
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
    let income = Math.floor(baseIncome * Math.pow(1.1, level - 1));

    return income;
}

/**
 * Given userId, return metadata of user 
 */
export const getUserMetadata = async (userId) => { 
    // get reference to user
    let userCollection = await users();
    let user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    // if user doesn't exist, throw
    if (!user) {
        throw "User does not exist."
    }

    return user.metadata;
}



