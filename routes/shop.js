import { Router } from "express";
const router = Router();
import {
    getAllItems,
    purchaseItem
} from "../data/shop.js";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import xss from "xss";
import * as helpers from '../helpers.js';

/**
 * GET /shop
 */
router.get("/", async (req, res) => {
    try {
        const items = await getAllItems();
        res.status(200).render("shop", {
            title: "Shop",
            items,
            user: req.session.user,
        });
    } catch (e) {
        res.status(500).render("error", {
            error: e
        });
    }
});

/**
 * GET /shop/items
 */
router.get("/items", async (req, res) => {
    try {
        const items = await getAllItems();
        res.status(200).json(items)
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

/**
 * POST /shop/purchase
 */
router.post("/purchase", async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const cleanItemName = helpers.validateString(xss(req.body.itemName), "Item Name");
        const cleanQuantity1 = parseInt(xss(req.body.quantity), 10);
        const cleanQuantity2 = helpers.validatePositiveInteger(cleanQuantity1, "Quantity");
        
        await purchaseItem(userId, cleanItemName, cleanQuantity2);
        res.redirect("/shop");
    } catch (e) {
        const items = await getAllItems();
        res.status(400).render("shop", {
            title: "Shop",
            items,
            user: req.session.user,
            error: e
        });
    }
});

/**
 * GET /shop/balance
 */
router.get("/balance", async (req, res) => {
    try {
        const userCol = await users();
        const user = await userCol.findOne({ _id: ObjectId.createFromHexString(req.session.user.userId) });
        res.json({ balance: user.metadata.currency });
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

export default router;
