import { shop, users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { 
    validateString, 
    validateObjectId,
    validatePositiveInteger
} from "../helpers.js";

/**
 * Adds a new shop item document.
 */
export async function addItemToShop(name, cost, description, image) {
    name = validateString(name, "Item name");
    cost = validatePositiveInteger(cost, "Cost");
    description = validateString(description, "Description");
    image = validateString(image, "Image URL");

    const shopCollection = await shop();
    const newItem = { name, cost, description, image };
    const result = await shopCollection.insertOne(newItem);
    if (!result.acknowledged) {
        throw "Error: Could not add shop item.";
    }
    return result.insertedId.toString();
}

/**
 * Fetches all shop items.
 */
export async function getAllItems() {
    const shopCol = await shop();
    return await shopCol.find({}).toArray();
}

/**
 * Fetches a single item by its name.
 */
export async function getOneItem(name) {
    name = validateString(name, "Item name");
    const shopCol = await shop();
    const item = await shopCol.findOne({ name });
    if (!item) {
        throw "Error: No item with name " + name + " found.";
    }
    return item;
}

/**
 * Purchases “quantity” of itemName for the given user, deducting currency
 * and incrementing the appropriate field (tickets or food).
 */
export async function purchaseItem(userId, itemName, quantity = 1) {
    userId = validateObjectId(userId, "User ID");
    itemName = validateString(itemName, "Item name");
    quantity = validatePositiveInteger(quantity, "Quantity");

    // Load item and compute cost
    const item = await getOneItem(itemName);
    const totalCost = item.cost * quantity;

    // Load user
    const userCol = await users();
    const user = await userCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
        throw "Error: User not found.";
    }

    // Check funds
    const userFunds = user.metadata.currency;
    if (userFunds < totalCost) {
        throw "Error: Insufficient currency for purchase.";
    }

    // Update shop
    const updateShop = { $inc: { "metadata.currency": -totalCost } };
    const lowItem = itemName.toLowerCase();
    if (lowItem.includes("golden ticket")) {
        updateShop.$inc["metadata.ticket_count.golden"] = quantity;
    } else if (lowItem.includes("ticket")) {
        updateShop.$inc["metadata.ticket_count.normal"] = quantity;
    } else if (lowItem.includes("food")) {
        updateShop.$inc["metadata.food_count"] = quantity;
    } else {
        throw "Error: " + lowItem + " is an unhandled shop item."
    }

    const result = await userCol.updateOne(
        { _id: new ObjectId(userId) },
        updateShop
    );
    if (result.modifiedCount == 0) {
        throw "Error: Purchase failed.";
    }

    return { itemPurchased: itemName, quantity, totalCost };
}
