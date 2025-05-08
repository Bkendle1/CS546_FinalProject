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
