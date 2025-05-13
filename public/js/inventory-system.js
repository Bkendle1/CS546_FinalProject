import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

// initialize game 
kaplay({
    width: 1380,  // width of canvas 
    height: 1580, // height of canvas
    font: "sans-serif", // in-game font
    crisp: false, // makes pixels sharp
    canvas: document.querySelector("#inventory-canvas"),
    loadingScreen: true,
    background: "#000000" // default background color
});

// styling 
const BUTTON_COLOR = "#DDFFF7" // hexcolor for buttons
const BUTTON_HOVER_COLOR = "#93E1D8" // hexcolor for buttons on hover
const BUTTON_TEXT_COLOR = "#28262C" // hexcolor for text of buttons
const TEXT_COLOR = "#BB00E6" // hexcolor for general text
const CHARACTER_PROFILE_WIDTH = 200;
const CHARACTER_PROFILE_HEIGHT = 300;


// initialize 
let inventoryData = window.inventoryData;
let userData = window.userData;

// load background image and character images
loadSprite("inventoryBG", "/public/images/digimonInventory.jpg");
loadMusic("digimonTamersOP4", "/public/music/digimonTamersOP4.mp3")
const bgMusic = play("digimonTamersOP4", {
    volume: 0.2,
    speed: 1,
    loop: true,
    paused: true,
})
inventoryData.obtained.forEach((charac) => loadSprite(charac._id.toString(), charac.image));

// Helper Function: color for rarity
function getRarityColor(rarity) {
    let hexCode = "#DB042F"; // default common color 
    if (rarity === "common") {
        hexCode = "#DB042F";

    }
    else if (rarity === "uncommon") {
        hexCode = "#63AB5E";
    }
    else if (rarity === "rare") {
        hexCode = "#3672E0";
    }
    else { // rarity === "legendary"
        hexCode = "#F3AF19";
    }

    return hexCode;
}

// Helper Function: verify string 
function validateString(str, varName) {
    if (str === undefined) throw `${varName || "One of the inputs"} is missing.`;
    if (typeof (str) !== "string") throw `${varName || "Input"} must be a string.`;
    if (str.trim().length === 0) throw `${varName || "Input"} can not be empty or just whitespaces.`;
    return str.trim(); // return trimmed string
}

// Helper Function: verify nickname and have max length 
function validateNickName(str) {
    str = validateString(str, "Nickname");
    if (str.length > 20) {
        throw new Error("Nicknames can be a max of 20 characters");
    }

    return str;
}

// Function: create a button 
function addBtn(str, position, callback, fontSize = 16) {
    // create button
    const btn = add([
        rect(200, 80, { radius: 4 }), // set button size
        pos(position), // button's position
        area(), // add collider area so it can be clicked on
        scale(1), // size of button
        anchor("center"),
        outline(2), // outline of button
        color(BUTTON_COLOR) // button color
    ]);

    // add a child object that displays the text
    btn.add([
        text(str, { size: fontSize }),
        anchor("center"),
        color(BUTTON_TEXT_COLOR), // color of text
    ]);

    // runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
        btn.color = Color.fromHex(BUTTON_HOVER_COLOR);
        btn.scale = vec2(1.2); // make button slightly larger
        setCursor("pointer"); // change cursor into pointer
    });

    // runs once the object stopped being hovered
    btn.onHoverEnd(() => {
        btn.scale = vec2(1); // reset scale of button
        btn.color = Color.fromHex(BUTTON_COLOR); // reset color
        setCursor("default"); // set cursor back to normal
    });

    // run callback on click
    btn.onClick(() => {
        callback();
    });
    return btn;
}

// Function: create a character profile
function createCharacterProfile(character, position) {
    // create the element for profile
    let profile = add([
        rect(CHARACTER_PROFILE_WIDTH, CHARACTER_PROFILE_HEIGHT, { radius: 8 }),
        pos(position),
        area(),
        scale(1),
        anchor("center"),
        outline(2),
        color(BUTTON_COLOR)
    ]);

    // add the name
    let charName = profile.add([
        text(character.nickname || character.name, { size: 16 }),
        pos(vec2(0, -CHARACTER_PROFILE_HEIGHT / 2 + 20)),
        anchor("center"),
        color(BUTTON_TEXT_COLOR)
    ]);

    // load the image for the specific character 
    // loadSprite(character._id, character.image);
    let charImage = profile.add([
        sprite(character._id.toString()),
        scale(0.3),
        pos(0, -20),
        anchor("center"),
        z(3) // image will be in front of profile element
    ]);

    // add the level
    let charLevel = profile.add([
        text(`Level: ${character.experience.level}`, { size: 13 }),
        pos(vec2(0, CHARACTER_PROFILE_HEIGHT / 2 - 40)),
        anchor("center"),
        color(TEXT_COLOR),
        z(3)
    ]);

    // add the experience bar
    let charExpBar = profile.add([
        rect(140, 12),
        pos(vec2(0, CHARACTER_PROFILE_HEIGHT / 2 - 70)),
        anchor("center"),
        color("#303E47")
    ]);

    // fill up the bar 
    let FILL = Math.min(1, character.experience.curr_exp / character.experience.exp_capacity);
    let charExp = charExpBar.add([
        rect(140 * FILL, 12),
        pos(vec2(-70, 0)),
        color("#9EE57E"),
        anchor("left"),
        z(3)
    ]);

    // add income rate
    let charIncome = profile.add([
        text(`Income: ${character.experience.income}`, { size: 12 }),
        pos(0, CHARACTER_PROFILE_HEIGHT / 2 - 20),
        anchor("center"),
        color(TEXT_COLOR),
        z(3)
    ]);

    // add rarity
    let charRarity = profile.add([
        text(character.rarity.toUpperCase(), { size: 16 }),
        pos(vec2(0, CHARACTER_PROFILE_HEIGHT / 2 - 100)),
        anchor("center"),
        color(getRarityColor(character.rarity))
    ]);

    // to be used later on for modifying nickname and leveling up
    profile.onClick(() => {
        go("CharacterInteraction", character);
    });

    return profile;
}

// Function: does the actual rendering of the inventory
function renderInventory() {
    add([
        sprite("inventoryBG"),
        pos(width() / 2, height() / 2),
        scale(vec2(width() / 1280, height() / 720)),
        anchor("center"),
        z(0)
    ]);

    if (!inventoryData) {
        return;
    }

    let characters = inventoryData.obtained;
    let profPerRow = 5;
    let spaceRows = CHARACTER_PROFILE_WIDTH + 65;
    let spaceColumns = CHARACTER_PROFILE_WIDTH + 150;

    characters.forEach((charac, index) => {
        let posX = 150 + (index % profPerRow) * spaceRows;
        let posY = 300 + Math.floor(index / profPerRow) * spaceColumns;
        createCharacterProfile(charac, vec2(posX, posY));
    });

    if (!userData) {
        return;
    }

    let foodCount = userData.metadata.food_count;
    add([
        text(`Food Counter: ${foodCount}`, { size: 25 }),
        pos(1200, 100),
        anchor("center"),
        color("#FF8A1C")
    ])
}

// for the main inventory 
scene("Inventory", () => {
    bgMusic.volume = 0.05;
    bgMusic.paused = false;
    // ensure get most up to date metadata and then render 
    $.ajax({
        method: 'GET',
        url: `/metadata`
    })
        .then(function (updatedMetaData) {
            userData.metadata = updatedMetaData;
            renderInventory();
        })
        .fail(function (e) {
            let msg = e.responseJSON.error || "Refreshing user metadata has failed";
            alert(msg);
            renderInventory();
        });
});

// for user interaction -- nickname and leveling up 
scene("CharacterInteraction", (character) => {
    // render inventory's banner
    add([
        sprite("inventoryBG"),
        pos(width() / 2, height() / 2),
        scale(vec2(width() / 1280, height() / 720)),
        anchor("center"),
        z(0)
    ]);

    // add a back button to go back to main inventory
    addBtn("Back", vec2(width() / 2, height() - 60), () => {
        $.ajax({
            method: 'GET',
            url: `/metadata`
        })
            .then(function (updatedMetaData) {
                userData.metadata = updatedMetaData;
                go("Inventory");
            })
            .fail(function (e) {
                let msg = e.responseJSON.error || "Refreshing user metadata has failed";
                alert(msg);
                go("Inventory");
            });
    }, 25);

    // add the name
    add([
        text(character.nickname || character.name, { size: 60 }),
        pos(vec2(width() / 2, 100)),
        anchor("center"),
        color(getRarityColor(character.rarity))
    ]);

    // update nickname
    let nicknameInputShown = false;
    addBtn("Edit Nickname", vec2(width() - 200, 200), () => {
        if (!nicknameInputShown) {
            let nicknameInput = document.getElementById('nickname-input');
            let nicknameLabel = document.getElementById('nickname-label');
            nicknameInput.value = character.nickname || character.name;

            // make input box visible
            nicknameInput.style.display = "block";
            nicknameLabel.style.display = "block";
            nicknameInputShown = true;


            // have a save nickname button
            addBtn("Save Nickname", vec2(width() - 200, 280), () => {
                let newNickname = nicknameInput.value.trim();
                try {
                    newNickname = validateNickName(newNickname);
                } catch (e) { // simply alert the player instead of error page
                    alert(e.toString() || "Nickname is max length of 20 characters");
                    return;
                }

                nicknameInput.style.display = "none"; // hide after saving
                nicknameLabel.style.display = "none";

                if (!newNickname) {
                    return;
                }

                $.ajax({
                    method: 'POST',
                    url: `/collectionInventory/${character._id}/nickname`,
                    data: { nickname: newNickname }
                })
                    .then(function () {
                        // refresh character after renaming
                        return $.ajax({
                            method: 'GET',
                            url: `/collectionInventory/${character._id}`
                        });
                    })
                    .then(function (updatedCharacter) {
                        // refresh when we go back to inventory page 
                        let charIndex = inventoryData.obtained.findIndex((charac) => charac._id === updatedCharacter._id);
                        inventoryData.obtained[charIndex].nickname = updatedCharacter.nickname;
                        go("CharacterInteraction", updatedCharacter);
                    })
                    .fail(function (e) {
                        let msg = e.responseJSON.error || "Updating Nickname has failed";
                        alert(msg);
                    });
            }, 20);
        }
    }, 20);

    // load for the specific character 
    add([
        sprite(character._id.toString()),
        scale(1),
        pos(vec2(width() / 2, 500)),
        anchor("center"),
        z(4)
    ]);

    // addBtn("Level Up",vec2(width()/2,1100), () => {
    //     $.ajax({
    //         method: 'POST',
    //         url: `/collectionInventory/${character._id}/levelup`,
    //         data: {gainedExperience: 100} // default 100 for feeding 
    //     })
    //     .then(function () { // refresh the data after leveling up 
    //         return $.ajax({
    //             method: 'GET',
    //             url: `/collectionInventory/${character._id}`
    //         });
    //     })
    //     .then(function (updatedCharacter) {
    //         // refresh when we go back to inventory page 
    //         let charIndex = inventoryData.obtained.findIndex((charac) => charac._id === updatedCharacter._id);
    //         inventoryData.obtained[charIndex] = updatedCharacter;
    //         go("CharacterInteraction",updatedCharacter);
    //     });
    // },20);

    add([
        text(`Level: ${character.experience.level}`, { size: 25 }),
        pos(vec2(width() / 2, 800)),
        anchor("center"),
        color(TEXT_COLOR)
    ]);

    add([
        text(`Income: ${character.experience.income}`, { size: 25 }),
        pos(vec2(width() / 2, 900)),
        anchor("center"),
        color(TEXT_COLOR),
    ]);

    addBtn("Feed to Level Up", vec2(width() / 2, 1200), () => {
        $.ajax({
            method: 'POST',
            url: `/collectionInventory/${character._id}/feed`,
        })
            .then(function (response) {
                if (response.playerLeveledUp === true) {
                    alert("Player has leveled up! You have earned a ticket!");
                }
                // need to refresh the character and the food counter 
                return $.when(
                    // for character
                    $.ajax({
                        method: 'GET',
                        url: `/collectionInventory/${character._id}`
                    }),
                    // for food counter
                    $.ajax({
                        method: 'GET',
                        url: `/metadata`
                    })
                );
            })
            .then(function (characterResult, metadataResult) {
                let updatedCharacter = characterResult[0];
                let updatedMetaData = metadataResult[0];
                let charIndex = inventoryData.obtained.findIndex((charac) => charac._id === updatedCharacter._id);
                inventoryData.obtained[charIndex] = updatedCharacter;
                userData.metadata = updatedMetaData;
                go("CharacterInteraction", updatedCharacter);
            })
            .fail(function (e) {
                let msg = e.responseJSON.error || "Feeding has failed";
                alert(msg);
            });
    }, 16);

    let foodCount = userData.metadata.food_count;
    add([
        text(`Food Counter: ${foodCount}`, { size: 25 }),
        pos(1200, 100),
        anchor("center"),
        color("#FF8A1C")
    ])
});

go("Inventory");

