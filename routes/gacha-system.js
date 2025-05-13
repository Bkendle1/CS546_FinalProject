import { Router } from 'express';
const router = Router();
import { gachaData } from '../data/index.js';
import * as helpers from '../helpers.js';
import { ObjectId } from 'mongodb';

const BULK_PULL_COUNT = 5; // number of pulls for a bulk pull. IF YOU CHANGE THIS VALUE THEN MAKE SURE TO ALSO CHANGE THIS CONSTANT IN THE CORRESPONDING CLIENT-SIDE JS FILE

router
    .route('/')
    .get(async (req, res) => {
        // render the gacha template 
        res.render('gacha', { title: "Gacha System", user_id: req.session.user.userId })
    });

// this route is used so the game can get user's ticket information
router
    .route('/tickets')
    .get(async (req, res) => {
        const userId = req.session.user.userId; // get user's id

        // attempt to get ticket counts
        try {
            const normalTicketCount = await gachaData.getTicketCount(userId, "normal"); // get the current count of normal tickets from the user
            const goldenTicketCount = await gachaData.getTicketCount(userId, "golden");// get the current count of golden tickets from the user
            res.json({ normalTicketCount: normalTicketCount, goldenTicketCount: goldenTicketCount }); // return JSON with user's ticket counts
        } catch (e) {
            res.status(500).render('error', { title: "Error: 500", error: e });
        }
    });


router
    .route('/normal')
    .get(async (req, res) => {
        // makes a single, normal pull
        const userId = req.session.user.userId;
        // attempt to make a single normal pull
        try {
            const character = await gachaData.gachaPull(userId, 1, "normal");
            res.json({ pulled: character.pulled[0], duplicates: character.duplicates[0], normal: character.normal, golden: character.golden }); // gachaPull returns an object containing an array for pulled characters (even if its 1), an array for duplicates, and how many of each ticket the user got for because of this pull
        } catch (e) {
            // user doesn't have enough tickets (this shouldn't happen as the button that makes this request should've been disabled)
            console.log(e);
            res.status(500).render('error', {
                title: "Error: 500",
                error: e.toString()
            });
        }
    });

router
    .route('/normal/bulk')
    .get(async (req, res) => {
        // makes a bulk, normal pull
        const userId = req.session.user.userId;
        // attempt to make a bulk normal pull
        try {
            const characters = await gachaData.gachaPull(userId, BULK_PULL_COUNT, "normal");
            res.json({ pulled: characters.pulled, duplicates: characters.duplicates, normal: characters.normal, golden: characters.golden }); // gachaPull returns an object containing an array for pulled characters (even if its 1), an array for duplicates, and how many of each ticket the user got for because of this pull
        } catch (e) {
            // user doesn't have enough tickets (this shouldn't happen as the button that makes this request should've been disabled)
            res.status(500).render("error", { title: "Error: 500", error: e });
        }
    });
router
    .route('/golden')
    .get(async (req, res) => {
        // makes a single, golden pull
        const userId = req.session.user.userId;
        // attempt to make a single, golden pull
        try {
            const character = await gachaData.gachaPull(userId, 1, "golden");
            res.json({ pulled: character.pulled[0], duplicates: character.duplicates[0], normal: character.normal, golden: character.golden });  // gachaPull returns an object containing an array for pulled characters (even if its 1), an array for duplicates, and how many of each ticket the user got for because of this pull
        } catch (e) {
            // user doesn't have enough tickets (this shouldn't happen as the button that makes this request should've been disabled)
            res.status(500).render('error', { title: "Error: 500", error: e });
        }
    });

router
    .route('/golden/bulk')
    .get(async (req, res) => {
        // makes a bulk, golden pull
        const userId = req.session.user.userId;
        // attempt to make a bulk, golden pull
        try {
            const characters = await gachaData.gachaPull(userId, BULK_PULL_COUNT, "golden");
            res.json({ pulled: characters.pulled, duplicates: characters.duplicates, normal: characters.normal, golden: characters.golden }); // gachaPull returns an object containing an array for pulled characters (even if its 1), an array for duplicates, and how many of each ticket the user got for because of this pull
        } catch (e) {
            // user doesn't have enough tickets (this shouldn't happen as the button that makes this request should've been disabled)
            res.status(500).render('error', { title: "Error: 500", error: e });
        }
    });

router
    .route('/:id/pull_history')
    // Display the user's recent pull history  
    .get(async (req, res) => {
        try {
            req.params.id = helpers.validateObjectId(req.params.id, "ID URL param");
        } catch (e) {
            res.status(404).render('error', { title: "Error 404", error: e });
        }

        // attempt to render user pull history
        try {
            const pull_history = await helpers.getPullHistory(userId);
            res.render('history', { pullHistory: pull_history });
        } catch (e) {
            res.status(404).render('error', { title: "Error 404", error: e });
        }

    })
router
    .route('/free_ticket')
    // checks if user gets a free ticket via an expired cooldown time
    .get(async (req, res) => {
        // checks if ticket cooldown time as been reached, and update ticket count, cooldown time, and ticket timestamp
        try {
            const difference = await helpers.checkTicketCooldownTime(req.session.user.userId);
            if (difference <= 0) {
                res.json({ free_ticket: true, timeRemaining: difference }); // return a bool stating the cooldown time has been reached 
            } else {
                res.json({ free_ticket: false, timeRemaining: difference });// return a bool stating the cooldown time has not been reached 
            }
        } catch (e) {
            res.status(404).render('error', { title: "Error 404", error: e });
        }
    });
export default router;