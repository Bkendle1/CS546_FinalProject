//import mongo collections, bcrypt and implement the following data functions

import { users, collectionInventory } from "../config/mongoCollections.js";
import bcrypt from "bcrypt";
import { validateUsername, validatePassword, validateEmail, setTicketCooldownTime } from "../helpers.js";
import { ExpressHandlebars } from "express-handlebars";
import * as helpers from "../helpers.js";
import { ObjectId } from "mongodb";
// import { ObjectId } from 'mongodb';

export const register = async (
  username,
  email,
  password
) => {
  // validations 
  username = validateUsername(username).toLowerCase();
  email = validateEmail(email).toLowerCase();
  password = validatePassword(password);

  // check if username and email already exists 
  const usersCollection = await users();
  const existingDuplicateUsername = await usersCollection.findOne({ username: `${username}` });
  const existingDuplicateEmail = await usersCollection.findOne({ email: `${email}` });

  if (existingDuplicateUsername) {
    throw new Error("There already exists a user with that username");
  }
  if (existingDuplicateEmail) {
    throw new Error("There already exists a user with that email");
  }

  // hash password
  const saltRounds = 14;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // create new user 
  let newUser = {
    username: username,
    email: email,
    password: hashedPassword,
    image: null,
    metadata: {
      currency: 200, // default starting curreny amount
      food_count: 10, // default starting food amount
      ticket_count: {
        golden: 0,
        normal: 3, // default starting ticket
        timestamp: null,
        cooldown: null,
      },
      experience: {
        curr_exp: 0,
        exp_capacity: 100, // default capacity
        level: 1
      },
      obtained_count: 0,
      timestampOfLastPassiveIncome: new Date().toISOString()
    },
    pull_history: []
  };

  // insert into database
  const insertNewUser = await usersCollection.insertOne(newUser);
  if (!insertNewUser.acknowledged || !insertNewUser.insertedId) {
    throw new Error("Could not add user");
  }

  // update the user's ticket cooldown timer
  const userId = insertNewUser.insertedId.toString();
  const cooldown = await setTicketCooldownTime(userId, 24); // set cooldown time to be 24 hours from current time
  const updateInfo = usersCollection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { "metadata.ticket_count.cooldown": cooldown } });
  if (updateInfo.modifiedCount === 0) {
    throw `Could not update the cooldown time for user with id: ${insertNewUser.insertedId}.`
  }

  // create the user's inventory document
  let newInventory = {
    user_id: insertNewUser.insertedId,
    obtained: []
  };
  // insert the user's inventory document
  const inventoryCollection = await collectionInventory();
  const insertNewInventory = await inventoryCollection.insertOne(newInventory);
  if (!insertNewInventory.acknowledged || !insertNewInventory.insertedId) {
    throw new Error("Could not add user's inventory.");
  }

  return { registrationCompleted: true };
};

export const login = async (email, password) => {
  // validation
  email = validateEmail(email);
  password = validatePassword(password);

  // search for user by username
  const usersCollection = await users();
  const targetUser = await usersCollection.findOne({ email: `${email}` });

  // if email is not found 
  if (!targetUser) {
    throw new Error("Either the email or password is invalid");
  }

  let compare = false;

  try {
    compare = await bcrypt.compare(password, targetUser.password);
  } catch (e) {
    throw new Error("Error from bcrypt.compare");
  }

  // check if passwords match
  if (!compare) {
    throw new Error("Either the email or password is invalid");
  }

  // return certain user fields
  let returnUser = {
    userId: targetUser._id.toString(),
    username: targetUser.username,
    email: targetUser.email,
    image: targetUser.image,
    metadata: targetUser.metadata,
    pull_history: targetUser.pull_history,
    timestampOfLastPassiveIncome: targetUser.timestampOfLastPassiveIncome
  }

  return returnUser;
};

/**
 * Delete the documents related to the user with the given id. Specifically, delete their documents in the user collection and inventory collection. Returns an object containing both deleted documents and a bool to state that the deletion was successful.
 */
export const removeAccount = async (userId) => {
  // verify that userId is a valid string and ObjectId
  userId = helpers.validateObjectId(userId, "User ID");

  // check that user with that id exists in the user collection
  const userCollection = await users();
  const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
  if (!user) throw `No user with the id of: ${userId}`;
  const deleteInfo1 = await userCollection.findOneAndDelete({ _id: ObjectId.createFromHexString(userId) });
  if (!deleteInfo1) throw `Could not delete user account with id ${userId}.`;

  // check if there's an inventory collection for the user
  const inventoryCollection = await collectionInventory();
  const inventory = await inventoryCollection.findOne({ user_id: ObjectId.createFromHexString(userId) });
  if (!inventory) throw `Could not find the inventory of user with id: ${userId}.`;

  // delete user's inventory document
  const deleteInfo2 = await inventoryCollection.findOneAndDelete({ user_id: ObjectId.createFromHexString(userId) });
  if (!deleteInfo2) throw `Could not delete the inventory fo the user with id ${userId}.`;

  return { ...deleteInfo1, ...deleteInfo2, deleted: true } // remove account was succesful
}

/**
 * Returns an object with the user's name, profile picture, level and collection count.
 */
export const getUserById = async (userId) => {
  // verify that userId is a valid string and object id
  userId = helpers.validateObjectId(userId, "User ID");

  // verify that user exists with that id
  const userCollection = await users();
  const user = await userCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
  if (!user) throw `No user with id: ${userId}.`;

  // get user's info, i.e. their username, profile picture, level and collection count
  const userInfo = {
    username: user.username,
    profilePic: user.image,
    level: user.metadata.experience.level,
    obtained: user.metadata.obtained_count
  }
  return userInfo; // return user info
}

/**
 * Update a user’s profile picture filename in their document.
 */
export const updateProfilePic = async (userId, filename) => {
    userId = helpers.validateObjectId(userId, "User ID");
    filename = helpers.validateString(filename, "Filename");
    const usersCol = await users();
    const result = await usersCol.updateOne(
        { _id: ObjectId.createFromHexString(userId) },
        { $set: { image: `/public/uploads/${filename}` } }
    );
    if (result.modifiedCount == 0) {
        throw "Error: Could not update profile image.";
    }
    return true;
};
