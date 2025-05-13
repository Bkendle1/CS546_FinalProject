import { collectionIndex } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import {
    validateString,
    validateObjectId,
    rarityToPullRate,
    rarityToDupCurrency
} from "../helpers.js";
import { addCharacterToGacha } from "./gacha-system.js";

/**
 * Inserts a new character into the collection index. Name and rarity are case-insensitive.
 */
export async function addIndexEntry(name, rarity, image, description) {
    name = validateString(name, "Name");
    name = name.toLowerCase(); // name is case-insensitive
    rarity = validateString(rarity, "Rarity");
    rarity = rarity.toLowerCase(); // rarity is case-insensitive
    image = validateString(image, "Image URL");
    description = validateString(description, "Description");

    const indexCol = await collectionIndex();
    // check if character is already in index
    const character = await indexCol.findOne({ name });
    if (character) {
        throw "Error: " + name + " is already in the index collection.";
    }

    // create new entry
    const newEntry = {
        name,
        rarity,
        image,
        description,
        collected: false
    };
    const result = await indexCol.insertOne(newEntry);
    if (!result.acknowledged) {
        throw "Error: Could not add index entry for " + name + ".";
    }
    const pull_rate = rarityToPullRate(rarity);     // get pull rate
    const dupCurrency = rarityToDupCurrency(rarity); // get duplicate currency amount
    // after a character is added to the index, it should also be added to the gacha system
    await addCharacterToGacha(name, pull_rate, dupCurrency);

    return result.insertedId.toString();
}

/**
 * Get every character entry in the collection index.
 */
export async function getAllIndexEntries() {
    const indexCol = await collectionIndex();
    const entries = await indexCol.find({}).toArray();
    return entries.map((e) => ({
        _id: e._id.toString(),
        name: e.name,
        rarity: e.rarity,
        image: e.image,
        description: e.description,
        collected: e.collected
    }));
}

/**
 * Get a single character entry by its ID.
 */
export async function getEntryById(id) {
    id = validateObjectId(id, "Index Entry ID");
    const indexCol = await collectionIndex();
    const entry = await indexCol.findOne({ _id: ObjectId.createFromHexString(id) });
    if (!entry) {
        throw "Error: No index entry with id " + id + " found.";
    }
    return {
        _id: entry._id.toString(),
        name: entry.name,
        rarity: entry.rarity,
        image: entry.image,
        description: entry.description,
        collected: entry.collected
    };
}

/**
 * Mark a character’s 'collected' flag to true. If the character has already been collected before, return false. Otherwise, return true.
 */
export async function markCollected(id) {
    id = validateObjectId(id, "Character Index Id");
    const indexCol = await collectionIndex();
    // check if character exists with the id
    const character = await indexCol.findOne({ _id: ObjectId.createFromHexString(id) });
    if (!character) {
        throw "Error: No character in the index has the id of: " + id + ".";
    }
    // check if character is already marked as collected
    if (character.collected) {
        return false; // character is already marked as collected so we return false
    }

    const result = await indexCol.updateOne(
        { _id: ObjectId.createFromHexString(id) },
        { $set: { collected: true } } // update collected flag
    );
    console.log(result);
    if (result.modifiedCount == 0) {
        throw "Error: Could not mark character " + id + " as collected.";
    }
    return true; // character has been successfully marked as collected
}
