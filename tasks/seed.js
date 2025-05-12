import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import {
    gachaData,
    shopData,
    indexData,
    userData,
    collectionInventoryData
} from "../data/index.js";
import {
    rarityToPullRate,
    rarityToDupCurrency
} from "../helpers.js";

async function main() {
    const db = await dbConnection();
    console.log("Connected to Gacha_Game db:", db.databaseName);

    await db.dropDatabase();
    console.log("Dropped existing database.");

    // 1) create characters
    const characters = [
        // character 1
        {
            // id: 
            name: "Koromon",
            rarity: "rare",
            image: "https://via.placeholder.com",
            description: "Koromon has shed its fur and grown one size bigger. It can move a bit faster, but fighting is still too much for it. It threatens enemies with bubbles from its mouth.",
        },
        // character 2
        {
            // id 
            name: "Tsunomon",
            rarity: "rare",
            image: "https://via.placeholder.com",
            description: "A small Digimon, but with one of the tentacles on its head hardened. It is covered in tufts of bushy hair. Its playful and mischievous personality remains, but it has yet to awaken to its combat ability.",
        },
        // character 3
        {
            // id 
            name: "Tokomon",
            rarity: "uncommon",
            image: "https://via.placeholder.com",
            description: "A small Digimon with strange appendages growing under its body. Don't let its looks fool you, though; carelessly reach out to it and expect a big set of chompers to clamp down on your hand. That being said, it doesn't have an ounce of ill will in its body.",
        },
        // character 4
        {
            // id 
            name: "Tanemon",
            rarity: "common",
            image: "https://via.placeholder.com",
            description: "A bulb Digimon with sprout-like objects budding from its head. When an enemy draws close, this big old coward digs a hole with its four legs and buries its body in the ground.",
        },
        // character 5
        {
            // id 
            name: "Pagumon",
            rarity: "uncommon",
            image: "https://via.placeholder.com",
            description: "This small Digimon can fly at low altitudes with the ear-like protrusions growing out of its head. It can move these ears like a second pair of hands, using them to mock the enemy with all kinds of gestures. It has a malicious streak, often chasing after Digimon and teasing them.",
        },
        // character 6
        {
            // id 
            name: "Motimon",
            rarity: "common",
            image: "https://via.placeholder.com",
            description: "A soft-bodied Digimon possessing an elastic skin. When it gets worked up, its body swells up like a mochi rice cake. It understands human speech and transforms its body to communicate.",
        },
        // character 7
        {
            // id 
            name: "Bukamon",
            rarity: "common",
            image: "https://via.placeholder.com",
            description: "This zany Digimon looks like a baby aquatic dinosaur, and moves like a sprightly seahorse. It tends to run away when others get close. Its exodermis can't withstand deep-sea water pressure or low temperatures, so it can't dive in the ocean depths for long.",
        },
        // character 8
        {
            // id 
            name: "Peti Meramon",
            rarity: "uncommon",
            image: "https://via.placeholder.com",
            description: "Its entire body is ablaze due to how its Digicore burns fiercely in the heart of its small body. It has a fierce, aggressive personality atypical of small Digimon, and will spit out small bullets of fire from its mouth to threaten any enemy it encounters.",
        },
        // character 9
        {
            // id 
            name: "Pyocomon",
            rarity: "common",
            image: "https://via.placeholder.com",
            description: "A Bulb-type Digimon with a large flower blooming from its head. It moves skillfully by operating its root-like tentacles and it can rise into the air, but only to a small height. It has a habit of living together in flocks that can grow from a few to a few hundred.",
        },
        // character 10
        {
            // id 
            name: "Kapurimon",
            rarity: "common",
            image: "https://via.placeholder.com",
            description: "A tiny Digimon wearing a metallic helmet. Within the two horns, it has antennae that are able to receive any radio wave or sound. Kapurimon possess bat-like traits, as it has weak eyesight and produces ultrasonic waves from its mouth, recognizing objects ahead from the rebounding sound wave.",
        },
        // character 11
        {
            // id 
            name: "Nyaromon",
            rarity: "common",
            image: "https://via.placeholder.com",
            description: "A small Digimon with feline characteristics. Its capricious, cat-like behavior earned it the name Nyaromon. While both curious and fickle, it has a lonely side to it as well.",
        },
        // character 12
        {
            // id 
            name: "DemiVeemon",
            rarity: "legendary",
            image: "https://via.placeholder.com",
            description: "Unusually for an In-Training Digimon, it possesses a body, hands, and feet. As it is very voracious, it especially likes sweet foods. Also, as it is very fond of sleeping, if you take your eyes off of it, it will instantly fall asleep.",
        },
        // character 13
        {
            // id 
            name: "Poromon",
            rarity: "Common",
            image: "https://via.placeholder.com",
            description: "A Small Bird Digimon that can fly at low altitudes. It has small feathers and wings. Its most charming feature is the feather ornament attached to its head, so it maintains it intently. It has a fundamentally tidy personality, but because it cannot turn its neck(?), it relies on its comrades.",
        },
        // character 14
        {
            // id 
            name: "Upamon",
            rarity: "common",
            image: "https://via.placeholder.com",
            description: "Upamon is an Amphibian Digimon with ear-like branchia growing from both sides of its head. Although able to live on land or underwater, it is better suited for life on land. Because of its carefree personality, it is frequently bullied by other Digimon, but takes it as being played with.",
        },
        // character 15
        {
            // id 
            name: "Minomon",
            rarity: "common",
            image: "https://via.placeholder.com",
            description: "On days with good weather or when in a good mood, it sticks its face out of its shell. It hangs onto high places and moves by hanging onto large Digimon. Due to its vegetative personality, it has trouble displaying emotion. Its Special Move is throwing a hard, pine cone-shaped substance.",
        },
        // character 16
        {
            // id 
            name: "Gummymon",
            rarity: "uncommon",
            image: "https://via.placeholder.com",
            description: "It has an exceedingly energetic personality, both cheerful and lively. Although it is growing, it's squishy because its body tissue is as unstable as usual but its horn portion is hardened, and it intimidates the opponent with headbutts.",
        },
    ]

    // 2) seed collection index
    console.log("Starting to seed collectionIndex...");
    try {
        for (const c of characters) {
            await indexData.addIndexEntry(
                c.name,
                c.rarity,
                c.image,
                c.description
            );
        }
    } catch (e) {
        console.error("error seeding collectionIndex: ", e);
    }
    console.log("Done seeding collectionIndex & gacha!");

    // 3) create shop items
    const shopItems = [
        {
            name: "normal ticket",
            cost: 10,
            description: "A basic ticket good for one Gacha pull.",
            image: "https://via.placeholder.com",
        },
        {
            name: "golden ticket",
            cost: 100,
            description: "A golden ticket with higher odds for rare characters.",
            image: "https://via.placeholder.com",
        },
        {
            name: "food",
            cost: 50,
            description: "Food to feed your characters and boost their experience.",
            image: "https://via.placeholder.com",
        },
    ]

    // 5) seed shop
    console.log("Starting to seed shop collection...");
    try {
        for (const item of shopItems) {
            await shopData.addItemToShop(
                item.name,
                item.cost,
                item.description,
                item.image
            );
        }
    } catch (e) {
        console.error("error seeding shop: ", e);
    }
    console.log("Done seeding shop!");

    console.log("Done seeding all collections!!");
    await closeConnection();
}

main();
