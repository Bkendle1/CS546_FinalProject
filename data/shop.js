import { shop, users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { 
    validateString, 
    validateObjectId,
    validatePositiveInteger
} from "../helpers.js";

/**
 * Fetches all shop items.
 */
export async function getAllItems() {
    const shopCollection = await shop();
    return await shopCollection.find({}).toArray();
}

/**
 * Fetches a single item by its name.
 */
export async function getItemByName(name) {
    name = validateString(name, "Item name");
    const shopCollection = await shop();
    const item = await shopCollection.findOne({ name });
    if (!item) {
        throw `No item with name '${name}' found.`;
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
    const item = await getItemByName(itemName);
    const totalCost = item.cost * quantity;

    // Load user
    if (!ObjectId.isValid(userId)) {
        throw "Invalid user ID.";
    }
    const userCollection = await users();
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
        throw "User not found.";
    }

    // Check funds
    const currentCurrency = user.metadata.currency;
    if (currentCurrency < totalCost) {
        throw "Insufficient currency for purchase.";
    }

    // Build the $inc update
    const updateOps = { $inc: { "metadata.currency": -totalCost } };
    const lower = itemName.toLowerCase();
    if (lower.includes("golden ticket")) {
        updateOps.$inc["metadata.ticket_count.golden"] = quantity;
    } else if (lower.includes("ticket")) {
        updateOps.$inc["metadata.ticket_count.normal"] = quantity;
    } else if (lower.includes("food")) {
        updateOps.$inc["metadata.food_count"] = quantity;
    } 

    const result = await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        updateOps
    );
    if (result.modifiedCount === 0) {
        throw "Purchase failed.";
    }

    return { itemPurchased: itemName, quantity, totalCost };
}

/*
export default {
    getAllItems,
    getItemByName,
    purchaseItem,
};
*/
