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

// router
//     .route('/normal')
//     .get(async (req, res) => {
//         // a single, normal pull
//     });
// router
//     .route('/normal/bulk')
//     .get(async (req, res) => {
//         // a bulk, normal pull
//     });


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