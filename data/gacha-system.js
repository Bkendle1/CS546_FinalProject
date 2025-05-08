// Check if player can pull given their id Object ID field

export const canPull = async (userId) => { }

// Normal Gacha pull function. Checks if the user can pull and if so, does a pull equal to the given pull count (should only either be 1 or 5) using the odds of a normal ticket. Update user's collection inventory to include new character assuming its not a duplicate.
export const normalPull = async (userId, pullCount) => {
    // check if userId is a valid string
    // check if userId is a valid ObjectID
}

// Golden Gacha pull function. Checks if the user can pull and if so, do a pull using the odds of a golden ticket. (Probability of higher rarity characters is higher). Update user's collection inventory to include new character assuming its not a duplicate.

// Check if pull is a duplicate. If so, give the user currency in exchange which varies depending on the rarity of the pulled character

// Given a name, duplicate currency, and pull rate, add a character to the gacha system.


// Update pull history with pulled character assuming its not a duplicate. Include the character's name, rarity, timestamp of pull, and image