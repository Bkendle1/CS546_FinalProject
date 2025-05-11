import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import { gachaData, shopData, userData, collectionInventoryData } from "../data/index.js";
import { collectionInventory } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
const db = await dbConnection();
// await db.dropDatabase();


try {
    await userData.register("TestUser", "test@email.com", "ValidPass1!");
    console.log("Test user created.");
} catch {
    console.log("Test user already exists.");
}

const { userId } = await userData.login("test@email.com", "ValidPass1!");

// Add test inventory directly to the collection
const inventoryCollection = await collectionInventory();
// await collectionInventoryData.addCharacterToInventory(userId, {
//     name: "Test Character",
//     nickname: "Test Nickname",
//     rarity: "common",
//     image: "/public/images/veemon.jpg",
//     experience: {
//       curr_exp: 50,
//       exp_capacity: 100,
//       level: 1,
//       income: 50
//     }
//   });

await inventoryCollection.updateOne(
    { user_id: new ObjectId(userId) },
    {
        $push: {
            obtained: {
                _id: new ObjectId(), // This generates a new ObjectId
                name: "Test Character",
                nickname: "Test Nickname",
                rarity: "common",
                image: "/public/images/veemon.jpg",
                experience: {
                    curr_exp: 50,
                    exp_capacity: 100,
                    level: 1,
                    income: 50
                }
            }
        }
    },
    { upsert: true }
);
  

console.log("Done seeding test inventory.");


// // characters
// await gachaData.addCharacterToGacha("Leomon", 0.2387, 745);
// await gachaData.addCharacterToGacha("Elecmon", 0.6721, 212);
// await gachaData.addCharacterToGacha("Witchmon", 0.0953, 891);
// await gachaData.addCharacterToGacha("Igamon", 0.8412, 673);
// await gachaData.addCharacterToGacha("Troopmon", 0.4198, 304);
// await gachaData.addCharacterToGacha("Pteranomon", 0.3875, 158);
// await gachaData.addCharacterToGacha("Sagittarimon", 0.7124, 996);
// await gachaData.addCharacterToGacha("Chibickmon", 0.0037, 587);
// await gachaData.addCharacterToGacha("Hanumon", 0.5609, 423);
// await gachaData.addCharacterToGacha("Shoutmon", 0.9981, 339);

// console.log("Done seeding gacha collection.");

// // shop items 
// await shopData.addItemToShop(
//     "normal ticket",
//     10,
//     "A basic ticket good for one Gacha pull.",
//     // normal_ticket image link
// );
// await shopData.addItemToShop(
//     "golden ticket",
//     100,
//     "A golden ticket with higher odds for rare characters.",
//     // golden_ticket image link
// );
// await shopData.addItemToShop(
//     "food",
//     50,
//     "Food to feed your characters and boost their experience.",
//     // food image link
// );

// console.log("Done seeding shop collection.");

await closeConnection();
