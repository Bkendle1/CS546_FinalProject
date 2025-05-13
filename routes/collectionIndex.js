import { Router } from "express";
const router = Router();
import {
    getAllIndexEntries,
    getEntryById
} from "../data/collectionIndex.js";
import { validateObjectId } from "../helpers.js";

// GET /collectionIndex
router.get("/", async (req, res) => {
    try {
        const entries = await getAllIndexEntries();
        res.status(200).render("collectionIndex", {
            title: "Collection Index",
            entries,
            user: req.session.user,
        });
    } catch (e) {
        res.status(500).render("error", {
            error: e
        });
    }
});

// GET /collectionIndex/entries 
router.get("/entries", async (req, res) => {
    try {
        const entries = await getAllIndexEntries();
        res.status(200).json(entries);
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

// GET /collectionIndex/entries/:id
router.get("/entries/:id", async (req, res) => {
    try {
        req.params.id = validateObjectId(req.params.id, "Entry ID");
    } catch (e) {
        return res.status(400).json({ error: e.toString() });
    }
    try {
        const entry = await getEntryById(req.params.id);
        res.status(200).json(entry);
    } catch (e) {
        res.status(404).json({ error: e.toString() });
    }
});

export default router;
