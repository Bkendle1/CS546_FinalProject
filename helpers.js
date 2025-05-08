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