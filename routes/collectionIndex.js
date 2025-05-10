import { Router } from "express";
const router = Router();
import { 
    getAllIndexEntries,
    getEntryById
} from "../data/collectionIndex.js";

// GET /collectionIndex
router.get("/collectionIndex", async (req, res) => {
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
router.get("/collectionIndex/entries", async (req, res) => {
    try {
        const entries = await getAllIndexEntries();
        res.status(200).json(entries);
    } catch (e) {
        res.status(500).json({ error: e.toString() });
    }
});

// GET /collectionIndex/entries/:id
router.get("/collectionIndex/entries/:id", async (req, res) => {
    try {
        const entry = await getEntryById(req.params.id);
        res.status(200).json(entry);
    } catch (e) {
        res.status(404).json({ error: e.toString() });
    }
});

export default router;
