import multer from "multer";
import path from "path";
import { users, collectionIndex, gacha, collectionInventory } from "./config/mongoCollections.js";
import { ObjectId } from "mongodb";
import * as helpers from "./helpers.js";

export const ensureLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
}

export const redirectToGachaIfLoggedIn = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/gacha');
  }
  next();
}

// middleware for uploading profile pic
const uploadDir = path.join(process.cwd(), "public", "uploads");
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
export const uploadPic = multer({ storage }).single("profilePic");

// Function: auto update currency counter based on passive from the characters
export const passiveIncome = async (req, res, next) => {
  // ensure update only takes place when user is logged in (not signed out!!)
    if (!req.session.user || req.path === '/signout') {
      return next();
    }

    let userId = helpers.validateObjectId(req.session.user.userId,"User ID");
    let userCollection = await users();
    let inventoryCollection = await collectionInventory();
    let user = await userCollection.findOne({_id: new ObjectId(String(userId))});
    let inventory = await inventoryCollection.findOne({user_id: new ObjectId(String(userId))});

    if (!user || ! inventory) {
      return next();
    }

    // calculations 
    let currentTime = new Date();
    let previousTime = new Date(); // default to current time
    // if there was a previous timestamp, retrieve it 
    if (user.metadata.timestampOfLastPassiveIncome) {
      previousTime = new Date(user.metadata.timestampOfLastPassiveIncome);
    }

    // get the amount of time since the latest passive income update
    let differenceInMilliseconds = (currentTime-previousTime);
    let minutesSinceThen = Math.floor(differenceInMilliseconds/60000); // 60000 milliseconds = 60 seconds = 1 minute

    // only get income based on minutes
    if (minutesSinceThen > 0) {
        let characters = inventory.obtained || []; // [] if not already created
        let income = helpers.calculatePassiveIncome(characters,minutesSinceThen);

        // update currency
        if (income > 0) {
          let updateCurrency = await helpers.updateCurrencyCount(userId,income);
          let updateTime = await userCollection.updateOne(
            {_id: new ObjectId(String(userId))},
            {$set: {"metadata.timestampOfLastPassiveIncome": currentTime.toISOString()}}
          );

          // update when in session
          req.session.user.metadata.currency += income;
          req.session.user.metadata.timestampOfLastPassiveIncome = currentTime.toISOString();
        }
    }

    next();
}
