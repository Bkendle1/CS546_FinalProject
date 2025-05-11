import { Router } from "express";
const router = Router();
import {
    getAllItems,
    purchaseItem
} from "../data/shop.js";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

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
        const userId = req.session.user._id;
        const { itemName, quantity } = req.body;
        await purchaseItem(userId, itemName, parseInt(quantity, 10));
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
