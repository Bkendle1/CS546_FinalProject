import { users, collectionIndex, gacha, collectionInventory } from "./config/mongoCollections.js";
import { ObjectId } from "mongodb";
import random from 'simple-random-number-generator';
import moment from 'moment';
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
    const rareRates = { max: 0.45, min: 0.40 };
    const legendaryRates = { max: 0.35, min: 0.3 };
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
export function validateNumber(number, parameterName) {
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
        baseIncome = 5;
    }
    else if (rarity === "uncommon") {
        baseIncome = 20;
    }
    else if (rarity === "rare") {
        baseIncome = 35;
    }
    else if (rarity === "legendary") {
        baseIncome = 50;
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
    // validate userID
    userId = validateObjectId(userId, "User ID");
    // get reference to user
    let userCollection = await users();
    let user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    // if user doesn't exist, throw
    if (!user) {
        throw "User does not exist."
    }

    return user.metadata;
}
/**
 * Given the array of characters, calculate the total passive income based on rarity and level
 */
export function calculatePassiveIncome(characters, minutes) { 
  let totalIncome = 0;

  for (let char of characters) {
    let incomeRate = calculateIncome(char.rarity,char.experience.level);
    totalIncome += incomeRate * minutes;
  }

  return Math.floor(totalIncome);
}

/**
 * Returns an array storing the pull history of the user with the given ID. 
 */
export const getPullHistory = async (userId) => {
    // verify user id is a valid Object ID
    userId = validateObjectId(userId, "User ID");
    // get reference to user
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    if (!user) throw `No user with id: ${userId}.`;
    return user.pull_history;
}

/**
 * Sets the user's 'cooldown' field with a given number of hours. Supports decimals. Returns the cooldown time as an ISOString.
 */
export const setTicketCooldownTime = async (userId, hours) => {
    // verify that user id is a valid Object ID and string
    userId = validateObjectId(userId, "User ID");
    // verify that hours is a valid number
    if (!hours) throw "Must supply an amount of time in hours.";
    if (typeof (hours) !== 'number'
        || Number.isNaN(hours)
        || hours <= 0) {
        throw "Hours must be a positive number greater than 0.";
    }

    // check if user exists
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    if (!user) throw `No user with id: ${userId}.`;

    // update cooldown time with given hours
    const newCooldownTime = moment().add(hours, 'hours').toISOString();
    const updateInfo = await userCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "metadata.ticket_count.cooldown": newCooldownTime } });
    if (updateInfo.modifiedCount === 0) {
        throw `Could not update the cooldown time for user with id: ${userId}.`;
    }

    return newCooldownTime // returns the cooldown time

}

/**
 * Check if the cooldown time for the user with the given id has been reached. 
 * 
 * If so, it updates the user's normal ticket count by 1 and updates the cooldown time to be 24 hours from the current time. 
 * 
 * It also updates the timestamp that stores the last time the user received a free ticket this way.
 * 
 * It returns the difference between the cooldown time and the last time the user received a free ticket. If the cooldown time is up, then the return value is how many milliseconds it has been since the cooldown time expired (which should be <= 0). Otherwise, the return result is how many milliseconds until the cooldown time expires.
 */
export const checkTicketCooldownTime = async (userId) => {
    // verify that user id is a valid Object ID and string
    userId = validateObjectId(userId, "User ID");
    // check if user exists with that id
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    if (!user) throw `No user with id: ${userId}.`;

    // check if cooldown time has passed and, if so, give user their free ticket and update their cooldown time with a new time 
    const cooldownTime = moment(user.metadata.ticket_count.cooldown); // get cooldown time as a moment instance
    const currentTime = moment(); // get current time
    const difference = cooldownTime.diff(currentTime); // compute difference between the two times
    // check if 24 hours have passed since the cooldown time
    if (difference <= 0) {
        console.log(await updateTicketCount(userId, 'normal', 1)); // give user 1 normal ticket
        await setTicketCooldownTime(userId, 24); // update cooldown time to be another 24 hours from now
        const updateInfo = await userCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "metadata.ticket_count.timestamp": new Date().toISOString() } }) // update the timestamp for when the user received a last free ticket with the current time 
        if (updateInfo.modifiedCount === 0) throw `Can't update the ticket timestamp for user with id: ${userId}.`;
        return difference; // return the time since the cooldown expired
    } else {
        return difference; // return the time left before cooldown expires
    }
}

