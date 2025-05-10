import { Router } from 'express';
const router = Router();
import { gachaData } from '../data/index.js';
import * as helpers from '../helpers.js';
import { ObjectId } from 'mongodb';

router
    .route('/')
    .get(async (req, res) => {
        // render a partial for a script that runs the phaser scene for the gacha compnent
        res.render('gacha', { title: "Gacha System", script_partial: 'gacha' })
    });

// this route is used so the game can get user's ticket information
router
    .route('/tickets')
    .get(async (req, res) => {
        let userId = req.session.user.userId; // get user's id
        // error handling
        try {
            userId = helpers.validateString(userId, "User ID");
            helpers.validateObjectId(userId, "User ID");
        } catch (e) {
            res.status(404).render('error', { title: "Error: 404", error: e });
        }
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
    .route('/normal/bulk')
    .get(async (req, res) => {
        // a bulk, normal pull
    });

router
    .route('/normal')
    .get(async (req, res) => {
        // a single, normal pull
    });

// router
//     .route('/golden')
//     .get(async (req, res) => {
//         // a single, golden pull
//     });

// router
//     .route('/golden/bulk')
//     .get(async (req, res) => {
//         // a bulk, golden pull
//     });
export default router;