import { collectionIndex } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { 
    validateString,
    validateObjectId 
} from "../helpers.js";

/**
 * Inserts a new character into the collection-index.
 */
export async function addIndexEntry(name, rarity, image, description) {
    name = validateString(name, "Name");
    rarity = validateString(rarity, "Rarity");
    image = validateString(image, "Image URL");
    description = validateString(description, "Description");

    const indexCol = await collectionIndex();
    const newEntry = {
        name,
        rarity,
        image,
        description,
        collected: false
    };
    const result = await indexCol.insertOne(newEntry);
    if (!result.acknowledged) {
        throw "Error: Could not add index entry for '" + name + "'.";
    }
    return result.insertedId.toString();
}

/**
 * Get every character entry in the collection‑index.
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
 * Fetch a single character entry by its ID.
 */
export async function getEntryById(id) {
    id = validateObjectId(id, "Index Entry ID");
    const indexCol = await collectionIndex();
    const entry = await indexCol.findOne({ _id: new ObjectId(id) });
    if (!entry) {
        throw "Error: No index entry with id '" + id + "' found.";
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
 * Mark a character’s 'collected' flag to true.
 */
export async function markCollected(id) {
    id = validateObjectId(id, "Character Index Id");
    const indexCol = await collectionIndex();
    const result = await indexCol.updateOne(
        { _id: new ObjectId(id) },
        { $set: { collected: true } }
    );
    if (result.modifiedCount == 0) {
        throw "Error: Could not mark character " + id + " as collected.";
    }
    return true;
}
