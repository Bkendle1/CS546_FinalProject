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
 * Inserts a new character into the collection-index. Name and rarity are case-insensitive.
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
        throw `${name} is already in the index collection.`;
    }

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
    const pull_rate = rarityToPullRate(rarity);     // get pull rate
    const dupCurrency = rarityToDupCurrency(rarity); // get duplicate currency amount
    // after a character is added to the index, it should also be added to the gacha system
    await addCharacterToGacha(name, pull_rate, dupCurrency);

    return result.insertedId.toString();
}
try {
    console.log(await addIndexEntry("KOROMON", "RARE", "https://static.wikia.nocookie.net/digimon/images/3/33/Koromon_b.jpg/revision/latest/thumbnail/width/360/height/360?cb=20090128045819", "Koromon has shed its fur and grown one size bigger. It can move a bit faster, but fighting is still too much for it. It threatens enemies with bubbles from its mouth."))
} catch (e) {
    console.log(e);
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
