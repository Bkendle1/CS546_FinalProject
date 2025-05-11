//import mongo collections, bcrypt and implement the following data functions

import { users } from '../config/mongoCollections.js';
import bcrypt from 'bcrypt';
import { validateUsername, validatePassword, validateEmail } from '../helpers.js';
import { ExpressHandlebars } from 'express-handlebars';
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
      currency: 0,
      food_count: 0,
      ticket_count: {
        golden: 0,
        normal: 3, // default starting ticket, could be changed later 
        timestamp: null,
        cooldown: null,
      },
      experience: {
        curr_exp: 0,
        exp_capacity: 100, // default capacity, could be changed later 
        level: 1
      },
      obtained_count: 0
    },
    pull_history: []
  };

  // insert into database
  const insertNewUser = await usersCollection.insertOne(newUser);
  if (!insertNewUser.acknowledged || !insertNewUser.insertedId) {
    throw new Error("Could not add user");
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
    pull_history: targetUser.pull_history
  }

  return returnUser;
};
