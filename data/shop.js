import { shop, users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import {
    validateString,
    validateObjectId,
    validatePositiveInteger
} from "../helpers.js";

/**
 * Adds a new shop item document. Name is case-insentitive. Doesn't allow duplicate items.
 */
export async function addItemToShop(name, cost, description, image) {
    name = validateString(name, "Item name");
    name = name.toLowerCase(); 
    cost = validatePositiveInteger(cost, "Cost");
    description = validateString(description, "Description");
    image = validateString(image, "Image URL");

    // check if new item is already in the shop collection
    const shopCol = await shop();
    const item = await shopCol.findOne({ name });
    if (item) {
        throw "Error: " + name + " is already in the shop.";
    }

    // insert new item into shop collection
    const newItem = { name, cost, description, image };
    const result = await shopCol.insertOne(newItem);
    if (!result.acknowledged) {
        throw "Error: Could not add shop item.";
    }
    return result.insertedId.toString();
}

/**
 * Gets all shop items.
 */
export async function getAllItems() {
    const shopCol = await shop();
    const items = await shopCol.find({}).toArray();
    return items.map((i) => ({
        _id: i._id.toString(),
        name: i.name,
        cost: i.cost,
        description: i.description,
        image: i.image
    }))
}

/**
 * Gets a single item by its name. Name is case-insensitive.
 */
export async function getOneItem(name) {
    name = validateString(name, "Item name");
    name = name.toLowerCase();
    const shopCol = await shop();
    const item = await shopCol.findOne({ name });
    if (!item) {
        throw "Error: No item with name " + name + " found.";
    } 
    return {
        _id: item._id.toString(),
        name: item.name,
        cost: item.cost,
        description: item.description,
        image: item.image
    };
}

/**
 * Purchases “quantity” of itemName for the given user, deducting currency
 * and incrementing the appropriate field (tickets or food).
 */
export async function purchaseItem(userId, itemName, quantity = 1) {
    userId = validateObjectId(userId, "User ID");
    itemName = validateString(itemName, "Item name");
    itemName = itemName.toLowerCase();
    quantity = validatePositiveInteger(quantity, "Quantity");

    // Load item and compute cost
    const item = await getOneItem(itemName);
    const totalCost = item.cost * quantity;

    // Load user
    const userCol = await users();
    const user = await userCol.findOne({ _id: ObjectId.createFromHexString(userId) });
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
    if (itemName == "golden ticket") {
        updateShop.$inc["metadata.ticket_count.golden"] = quantity;
    } else if (itemName == "normal ticket") {
        updateShop.$inc["metadata.ticket_count.normal"] = quantity;
    } else if (itemName == "food") {
        updateShop.$inc["metadata.food_count"] = quantity;
    } else {
        throw "Error: " + itemName + " is an unhandled shop item."
    }

    const result = await userCol.updateOne(
        { _id: ObjectId.createFromHexString(userId) },
        updateShop
    );
    if (result.modifiedCount == 0) {
        throw "Error: Purchase failed.";
    }

    return { itemPurchased: itemName, quantity, totalCost };
}
