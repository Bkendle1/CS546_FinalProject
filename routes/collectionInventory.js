import {Router} from 'express';
const router = Router();
import { collectionInventoryData } from '../data/index.js';
import * as helpers from "../helpers.js";

// GET: the user inventory
router.route('/').get(async (req, res) => {
    try {
        let inventory = await collectionInventoryData.getUserInventory(req.session.user.userId);
        res.render('collectionInventory',{title:"My Inventory", inventory: inventory});
    } catch (e) {
        res.status(500).render('error', {
          title: "Error: Inventory can not be viewed",
          error: e.toString()
        });
    }
});

// GET: the character info 
router.route('/:characterId').get(async (req, res) => {
    try {
        let character = await collectionInventoryData.getCharacterFromInventory(req.session.user.userId,req.params.characterId);
        res.status(200).json(character);
    } catch (e) {
        res.status(500).render('error', {
            title: "Error: Character can not be retrieved",
            error: e.toString()
        });
    }
});

// POST: update character nickname
router.route('/:characterId/nickname').post(async (req, res) => {
    try {
        const nickname = req.body.nickname;
        if (!nickname) {
            return res.status(400).json({error: "Nickname is missing"});
        }

        let result = await collectionInventoryData.updateCharacterNickname(req.session.user.userId,req.params.characterId,nickname);
        res.status(200).json({success:true});

    } catch (e) {   
        res.status(500).render('error', {
            title: "Error: Nickname can not be done",
            error: e.toString()
        });
    }
});


// POST: update character levelup
router.route('/:characterId/levelup').post(async (req, res) => {
    try {
        let exp = req.body.gainedExperience;
        if (!exp) {
            return res.status(400).json({error: "Experience amount is missing"});
        }

        let result = await collectionInventoryData.levelUpCharacter(req.session.user.userId,req.params.characterId,exp);
        res.status(200).json({success:true});

    } catch (e) {   
        res.status(500).render('error', {
            title: "Error: Level up can not be done",
            error: e.toString()
        });
    }
});


//export router
export default router;
