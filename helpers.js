import { users, collectionIndex, gacha } from "./config/mongoCollections.js";

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
 * Given a character's name, retrieve their character_id from the collection index collection (i.e. the collection for our character index) basedon that name.
 */
export const getCharacterId = async (name) => {
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