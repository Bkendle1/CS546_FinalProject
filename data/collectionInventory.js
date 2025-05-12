import { collectionInventory, collectionIndex, users } from '../config/mongoCollections.js';
import * as helpers from "../helpers.js";
import { ObjectId } from "mongodb";

// Function: Takes in a userId and characterId and returns the newCharacter if added 
// and returns false if not added (meaning it is a duplicate)
export const addCharacterToInventory = async (userId,characterId) => {
    // validation 
    userId = helpers.validateObjectId(userId,"User ID");
    characterId = helpers.validateObjectId(characterId,"Character ID");

    // get character info from collection index
    let indexCollection = await collectionIndex();
    let character = await indexCollection.findOne({_id: new ObjectId(String(characterId))});

    if (!character) {
        throw new Error("No character with that id is found in the collection index");
    }

    // check for duplicates
    let inventoryCollection = await collectionInventory();
    let inventoryWithCharacter = await inventoryCollection.findOne({
        user_id: new ObjectId(String(userId)),
        "obtained._id": new ObjectId(String(characterId))
    });

    // if we get back the inventory then there exists a duplicate, return false 
    if (inventoryWithCharacter) {
        return false;
    }

    let newCharacter = {
        _id: new ObjectId(String(characterId)),
        name: character.name,
        nickname: character.name,
        rarity: character.rarity,
        image: character.image,
        experience: {
            curr_exp: 0,
            exp_capacity: 100, // default capacity, could be changed later 
            level: 1,
            income: calculateIncome(character.rarity,1)
        }   
    };

    let result = await inventoryCollection.updateOne (
        {user_id: new ObjectId(String(userId))},
        {$push: {obtained: newCharacter}},
        {upsert: true} // create new document if does not exist
    );

    if (result.modifiedCount === 0) {
        throw new Error("Character could not be added");
    }

    return newCharacter;
}

// Function: Update character nickname if entered and return true if successful
export const updateCharacterNickname = async (userId,characterId,nickname) => {
    // validation
    userId = helpers.validateObjectId(userId,"User ID");
    characterId = helpers.validateObjectId(characterId,"Character ID");
    nickname = helpers.validateNickName(nickname);

    // update nickname (default = character name)
    let inventoryCollection = await collectionInventory();
    let result = await inventoryCollection.updateOne(
        { user_id: new ObjectId(String(userId)),
          "obtained._id": new ObjectId(String(characterId))
        },
        {$set: {"obtained.$.nickname": nickname}}
    );

    if (result.modifiedCount === 0) {
        throw new Error("Nickname could not be updated");
    }

    return true;
}

// Function: Level up a character in the user's inventory if enough experience was gained, returns true if successful
export const levelUpCharacter = async (userId,characterId,gainedExperience) => {
    // validation
    userId = helpers.validateObjectId(userId,"User ID");
    characterId = helpers.validateObjectId(characterId,"Character ID");
    gainedExperience = helpers.validateNumber(gainedExperience,"Experience");

    // check if character is in inventory 
    let inventoryCollection = await collectionInventory();
    let inventoryWithCharacter = await inventoryCollection.findOne({
        user_id: new ObjectId(String(userId)),
        "obtained._id": new ObjectId(String(characterId))
    });

    if (!inventoryWithCharacter) {
        throw new Error("Character is not found in inventory");
    }

    // retrieve just the character 
    let character = inventoryWithCharacter.obtained.find(charac => charac._id.toString() === characterId);
    if (!character) {
      throw new Error("Character could not be found in inventory");
    } 

    let currentExpAmount = character.experience.curr_exp + gainedExperience;
    let currentLevel = character.experience.level;
    let currentExpCapacity = character.experience.exp_capacity;

    // level up when we have enough experience
    while (currentExpAmount >= currentExpCapacity) {
        currentExpAmount -= currentExpCapacity;
        currentLevel++;
        currentExpCapacity = Math.floor(currentExpCapacity * 1.1); // increment capacity by 10% each level up
    }

    // update character experience information
    let result = await inventoryCollection.updateOne(
        { user_id: new ObjectId(String(userId)),
          "obtained._id": new ObjectId(String(characterId))
        },
        {$set: {
                 "obtained.$.experience.curr_exp": currentExpAmount,
                 "obtained.$.experience.exp_capacity": currentExpCapacity,
                 "obtained.$.experience.level": currentLevel,
                 "obtained.$.experience.income": helpers.calculateIncome(character.rarity,currentLevel)
               }
        }
    );

    if (result.modifiedCount === 0) {
        throw new Error("Character could not level up");
    }

    return true;
}

// Function: Given userId, return the user's inventory (or empty [])
export const getUserInventory = async (userId) => {
  // validation
  userId = helpers.validateObjectId(userId,"User ID");

  let inventoryCollection = await collectionInventory();
  
  let inventory = await inventoryCollection.findOne({
    user_id: new ObjectId(String(userId))
  });

  if (!inventory) {
    return {obtained: []};
  }

  return inventory;
}

// Function: Given userId and characterId, return the character from user's inventory
export const getCharacterFromInventory = async (userId,characterId) => {
  // validation 
  userId = helpers.validateObjectId(userId,"User ID");
  characterId = helpers.validateObjectId(characterId,"Character ID");

  let inventoryCollection = await collectionInventory();
  let inventoryWithCharacter = await inventoryCollection.findOne({
    user_id: new ObjectId(String(userId)),
    "obtained._id": new ObjectId(String(characterId))
  });

  if (!inventoryWithCharacter) {
    throw new Error("Character is not found in inventory");
  }

  // retrieve just the character 
  let character = inventoryWithCharacter.obtained.find(charac => charac._id.toString() === characterId);
  if (!character) {
    throw new Error("Character could not be found in inventory");
  } 

  return character;
}

// Function: Given userId and characterId, call levelUpCharacter everytime a piece of food is consumed
export const feedCharacter = async (userId,characterId) => {
  // validation 
  userId = helpers.validateObjectId(userId,"User ID");
  characterId = helpers.validateObjectId(characterId,"Character ID");

  // get the user
  let userCollection = await users();
  let user = await userCollection.findOne({_id: new ObjectId(String(userId))});
  
  if (!user) {
    throw new Error("User not found");
  }
  
  // get the food count 
  let currentFoodAmount = 0;
  currentFoodAmount = user.metadata.food_count;
  if (currentFoodAmount < 1) {
    throw new Error("Minimum of amount of food to feed character is 1");
  }

  // update the food count by decrementing by 1
  let updateUserFoodCount = await userCollection.updateOne(
    {_id: new ObjectId(String(userId))},
    {$inc: {"metadata.food_count": -1}}
  );

  if (updateUserFoodCount.modifiedCount === 0) {
        throw new Error("Food count could not be updated after consumtion");
  }
  
  // fixed amount of exp per food
  let gainedExperiencePerFood = 30; 

  // call levelUpCharacter
  let result = await levelUpCharacter(userId,characterId,gainedExperiencePerFood);
  return result;
}

