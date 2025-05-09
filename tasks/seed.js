import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import { gachaData } from "../data/index.js";

const db = await dbConnection();
// await db.dropDatabase();

await gachaData.addCharacterToGacha("Leomon", 0.2387, 745);
await gachaData.addCharacterToGacha("Elecmon", 0.6721, 212);
await gachaData.addCharacterToGacha("Witchmon", 0.0953, 891);
await gachaData.addCharacterToGacha("Igamon", 0.8412, 673);
await gachaData.addCharacterToGacha("Troopmon", 0.4198, 304);
await gachaData.addCharacterToGacha("Pteranomon", 0.3875, 158);
await gachaData.addCharacterToGacha("Sagittarimon", 0.7124, 996);
await gachaData.addCharacterToGacha("Chibickmon", 0.0037, 587);
await gachaData.addCharacterToGacha("Hanumon", 0.5609, 423);
await gachaData.addCharacterToGacha("Shoutmon", 0.9981, 339);

console.log("Done seeding gacha collection.");
await closeConnection();