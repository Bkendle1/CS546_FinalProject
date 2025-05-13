import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

// initialize game with some options
kaplay({
    width: 1280, // width of canvas 
    height: 720, // height of canvas
    font: "sans-serif", // in-game font
    crisp: false, // makes pixels sharp
    canvas: document.querySelector("#canvas"), // canvas element to use
    // letterbox: true, // scales the canvas to maintain aspect ratio
    loadingScreen: true,
    background: "#000000" // default background color
});

let normalTicketCount = 0;
let goldenTicketCount = 0;
// as soon as the webpage loads, send an AJAX request to get the user's ticket counts
//Set up request config
let requestConfig = {
    method: "GET", // send a GET request
    url: "/gacha/tickets", // GET request goes to this route
    // when the AJAX request is successful, update the ticket counts and run the Kaplay scene (we need this because AJAX isx asynchronous and the scene can't start if the request isn't done yet)
    success: (response) => {
        normalTicketCount = response.normalTicketCount; // extact normal ticket count
        goldenTicketCount = response.goldenTicketCount; // extact golden ticket count
        go("Gacha"); // start the gacha game scene
    }
};
$.ajax(requestConfig);

const BUTTON_COLOR = "#DDFFF7" // hexcolor for buttons
const BUTTON_HOVER_COLOR = "#93E1D8" // hexcolor for buttons on hover
const BUTTON_TEXT_COLOR = "#28262C" // hexcolor for text of buttons
const BULK_PULL_COUNT = 5; // number of pulls for a bulk pull. IF YOU CHANGE THIS VALUE THEN MAKE SURE TO ALSO CHANGE THIS CONSTANT IN THE CORRESPONDING ROUTER JS FILE
const DISABLED_BUTTON_COLOR = "#36454F" // hexcolor for a disabled button
const TEXT_COLOR = "#00FFE7" // hexcolor for general text
// Create a button with the given text, at the give position, that executes the given callback function when clicked on
function addBtn(str, position, callback) {
    // create button
    const btn = add([
        rect(240, 80, { radius: 8 }), // set button size
        pos(position), // button's position
        area(), // add collider area so it can be clicked on
        scale(1), // size of button
        anchor("center"),
        outline(2), // outline of button
        color(BUTTON_COLOR) // button color
    ]);

    // add a child object that displays the text
    btn.add([
        text(`${str}`, { font: "digiFont", }),
        anchor("center"),
        pos(vec2(0, -8)),
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

function requestPull(pullType, pullCount) {
    pullType = pullType.toLowerCase(); // make pull type case-insensitive
    let requestConfig = {
        method: "GET",
        success: (response) => {
            // check if it was a single or bulk pull 
            if (pullCount === 1) {
                go("GachaDisplaySingle", { pulled: response.pulled, duplicates: response.duplicates, tickets: { normal: response.normal, golden: response.golden } }); // after the player does a pull, render this new scene that displays their new character
            } else {
                go("GachaDisplayBulk", { pulled: response.pulled, duplicates: response.duplicates, tickets: { normal: response.normal, golden: response.golden } }); // after the player does a pull, render this new scene that displays their new characters
            }
        }
    };
    // request a normal pull
    if (pullType === "normal") {
        // make request to corresponding route
        if (pullCount === 1) {
            requestConfig["url"] = "/gacha/normal"; // request a single, normal pull
            $.ajax(requestConfig).then(function (response) {
                console.log(`Character pulled ${response.pulled}`);
                normalTicketCount -= 1; // decrement ticket count
            });

        } else {
            requestConfig["url"] = "/gacha/normal/bulk"; // request a bulk, normal pull
            $.ajax(requestConfig).then(function (response) {
                console.log(`Character pulled ${response.pulled}`);
                normalTicketCount -= BULK_PULL_COUNT; // decrement ticket count
            });
        }


    }
    else if (pullType === "golden") { // request a golden pull
        // make request to corresponding route
        if (pullCount === 1) {
            requestConfig["url"] = "/gacha/golden"; // request a single, golden pull
            $.ajax(requestConfig).then(function (response) {
                console.log(`Character pulled ${response.pulled}`);
                goldenTicketCount -= 1; // decrement ticket count
            });

        } else {
            requestConfig["url"] = "/gacha/golden/bulk"; // request a bulk, golden pull
            $.ajax(requestConfig).then(function (response) {
                console.log(`Character pulled ${response.pulled}`);
                goldenTicketCount -= BULK_PULL_COUNT; // decrement ticket count
            });
        }


    }
};

async function fetchBalance() {
    const res = await fetch("/shop/balance");
    if (!res.ok) {
        throw "Error: Balance fetch failed- " + res.status;
    }
    const data = await res.json();
    return data.balance;
}

/**
 * Get the data of a single character using a route for the collectionIndex collection. 
 */
async function requestCharacterData(characterId) {
    // Make a GET request to /collectionIndex/entries/:id
    try {
        const url = `/collectionIndex/entries/${characterId}`;
        const response = await fetch(url);
        if (!response.ok) throw response.status.message;
        return await response.json(); // return JSON of response, i.e. character index data
    } catch (e) {
        console.error(e);
    }
}
loadMusic("digimonButterfly", "/public/music/digimonAdventureOST_butterfly.mp3")
loadSprite("banner", "/public/images/gachaBanner.png"); // load banner image as a sprite
loadSprite("blackBG", "/public/images/abstractBlackBG.png");
loadFont("digiFont", "/public/fonts/PixelDigivolve.otf", 8, 8);

const bgMusic = play("digimonButterfly", {
    volume: 0.05,
    speed: 1,
    loop: true,
    paused: true,
})
scene("Gacha", async () => {
    bgMusic.paused = false;
    // add gacha's banner
    add([
        sprite("banner"),
        scale(1.1),
        color(150, 150, 150), // makes the background darker, smaller = darker 
        pos(center()),
        anchor("center"),
    ]);

    // add user's normal ticket count
    const normalCounter = add([
        text(`Normal: ${normalTicketCount}`, { font: "digiFont" }),
        color(TEXT_COLOR),
        pos(vec2(width() - 1100, 90)),
        anchor("center"),
    ]);
    // add user's golden ticket count
    const goldenCounter = add([
        text(`Golden: ${goldenTicketCount}`, { font: "digiFont" }),
        color(TEXT_COLOR),
        pos(vec2(width() - 200, 90)),
        anchor("center"),
    ]);
    let currency = await fetchBalance();
    // add user's currency count
    const currencyCounter = add([
        text(`Currency: ${currency}`, { font: "digiFont" }),
        color(TEXT_COLOR),
        pos(vec2(width() / 2, 90)),
        anchor("center"),
    ])

    // add button for single normal pull
    const normalSingleBtn = addBtn("Normal x1", vec2(width() - 1000, height() - 500), () => {
        requestPull("normal", 1)
    });
    // add button for bulk normal pull
    const normalBulkBtn = addBtn("Normal x5", vec2(width() - 1000, height() - 250), () => {
        requestPull("normal", BULK_PULL_COUNT)
    });

    // add button for single golden pull
    const goldenSingleBtn = addBtn("Golden x1", vec2(width() - 300, height() - 500), () => {
        requestPull("golden", 1); // request a golden single pull
    });
    // add button for bulk golden pull
    const goldenBulkBtn = addBtn("Golden x5", vec2(width() - 300, height() - 250), () => {
        requestPull("golden", BULK_PULL_COUNT); // request a golden bulk pull
    });
    // TODO: Menu


    onUpdate(() => {

        normalCounter.text = `Normal: ${normalTicketCount}`; // on every frame, it keeps the counter up-to-date
        goldenCounter.text = `Golden: ${goldenTicketCount}`; // on every frame, it keeps the counter up-to-date

        // enable/disable normal tickets depending on current count
        if (normalTicketCount < BULK_PULL_COUNT) {
            // disable normal bulk pull button
            normalBulkBtn.area.scale = vec2(0); // removing collision area so button can't be pressed
            normalBulkBtn.color = Color.fromHex(DISABLED_BUTTON_COLOR); // grey out button to show its disabled

            // disable normal single pull button
            if (normalTicketCount <= 0) {
                normalSingleBtn.area.scale = vec2(0); // removing collision area so button can't be pressed
                normalSingleBtn.color = Color.fromHex(DISABLED_BUTTON_COLOR); // grey out button to show its disabled
            }
        } else {
            // restore buttons back to normal
            normalBulkBtn.area.scale = vec2(1);
            normalBulkBtn.color = Color.fromHex(BUTTON_COLOR);
            normalSingleBtn.area.scale = vec2(1);
            normalSingleBtn.color = Color.fromHex(BUTTON_COLOR);
        }

        // enable/disable golden tickets depending on current count
        if (goldenTicketCount < BULK_PULL_COUNT) {
            // disable golden bulk pull button
            goldenBulkBtn.area.scale = vec2(0); // remove collision area so button can't be pressed
            goldenBulkBtn.color = Color.fromHex(DISABLED_BUTTON_COLOR); // grey out button to indicate its unavailable

            // disable golden single pull button
            if (goldenTicketCount <= 0) {
                goldenSingleBtn.area.scale = vec2(0);
                goldenSingleBtn.color = Color.fromHex(DISABLED_BUTTON_COLOR);
            }
        } else {
            // restore buttons back to normal
            goldenSingleBtn.area.scale = vec2(1);
            goldenSingleBtn.color = Color.fromHex(BUTTON_COLOR);

            goldenBulkBtn.area.scale = vec2(1);
            goldenBulkBtn.color = Color.fromHex(BUTTON_COLOR);

        }
    });

});

/**
 * Given a rarity, return a color
 */
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
    else if (rarity === "legendary") {
        hexCode = "#F3AF19";
    } else {
        console.error("Rarity can only be: 'common', 'uncommon', 'rare', or 'legendary'.")
    }
    return hexCode;
}

// Tweens a gameObject's scale to 1 for a minimum duration of 0.25 seconds + delay
const zoomIn = (gameObject, delay) => {
    tween(0, // start value 
        1, // target value 
        0.25 + delay, // duration
        (v) => { gameObject.scale = vec2(v) }, // run this function for every interpolated value 'v'
        easings.easeOutElastic // easing method
    );
}
// Tweens a gameObject's scale to 0 for a minimum duration of 0.25 seconds + delay
const zoomOut = (gameObject, delay) => {
    tween(1, // start value 
        0, // target value 
        0.25 + delay, // duration
        (v) => { gameObject.scale = vec2(v) }, // run this function for every interpolated value 'v'
        easings.easeOutSine    // easing method
    );
}
const BADGE_BG_COLOR = "#0D3B66" // background color for the new badge
const BADGE_TXT_COLOR = "#F8F991" // hex code for text in the new badge

// This scene takes two arguments, one for the pulled character, and a bool that states whether or not they're a duplicate
scene("GachaDisplaySingle", async ({ pulled, duplicates, tickets }) => {
    // render scene's background
    add([
        sprite("blackBG"),
        scale(1),
        pos(center()),
        anchor("center"),
    ]);
    let alertMsg = "";
    if (tickets.normal !== 0) {
        alertMsg = `You leveled up and got ${tickets.normal} ${tickets.normal > 1 ? `normal tickets!` : `normal ticket!`}.`
        normalTicketCount += tickets.normal // increment normal ticket count
        alert(alertMsg);

    }
    if (tickets.golden !== 0) {
        alertMsg = `You leveled up and got ${tickets.golden} ${tickets.golden > 1 ? `golden tickets!` : `golden ticket!`}.`
        goldenTicketCount += tickets.golden // increment golden ticket count
        alert(alertMsg);
    }



    // get the pulled character's index information
    const charInfo = await requestCharacterData(pulled);
    loadSprite(charInfo.name, charInfo.image); // load the sprite for the corresponding character
    const revealText = add([
        text(`Congrats! You got ${charInfo.name}!`, { font: "digiFont" }),
        pos(vec2(width() / 2, height() - 650)),
        anchor("center")
    ]);

    const character = add([
        sprite(charInfo.name, { width: 350, height: 350 }),
        pos(vec2(width() - 1000, height() - 360)),
        anchor("center")
    ])

    // Display the character's name, image, description, rarity
    zoomIn(character, 0.5);
    zoomIn(revealText, 0.5);

    // display character's rarity
    character.add([
        text(`${charInfo.rarity}`, { font: "digiFont" }),
        anchor("center"),
        pos(vec2(550, -200)),
        color(getRarityColor(charInfo.rarity)),
    ]);

    // display character's description
    character.add([
        text(`${charInfo.description}`, { font: "digiFont", align: "center", width: 600, size: 25 }),
        anchor("center"),
        pos(vec2(550, 10))
    ]);
    // If character isn't a duplicate, display a badge that says they're new
    console.log(duplicates)
    if (duplicates === 0) {
        const newBadge = character.add([
            rect(200, 75, { radius: 5 }),
            outline(2),
            rotate(-45),
            anchor("center"),
            pos(vec2(-150, -150)),
            color(BADGE_BG_COLOR)
        ]);
        newBadge.add([
            text("New!", { font: "digiFont" }),
            anchor("center"),
            pos(vec2(0, -5)), // center it with newBadge
            color(BADGE_TXT_COLOR)
        ])
    }
    // player can go back to gacha via pressing the escape key
    onKeyPress("escape", () => {
        go("Gacha");
    })
    // add a back button so the player can do more pulls
    addBtn("Back", vec2(width() - 640, height() - 60), () => {
        go("Gacha");
    });
});

// scene takes two arrays, one for the pulled characters, and another that's the same size which stores a bool to determine whether or not they're a duplicate
scene("GachaDisplayBulk", async ({ pulled, duplicates, tickets }) => {
    const DISPLAY_BG_COLOR = "#57467B"; // background color of the board displaying individual character info
    // render scene's background
    add([
        sprite("blackBG"),
        scale(1),
        pos(center()),
        anchor("center"),
    ]);
    let characters = []; // store all the index entries of pulled characters
    // load all the characters' sprites
    for (let i = 0; i < pulled.length; i++) {
        const charInfo = await requestCharacterData(pulled[i]);
        loadSprite(charInfo.name, charInfo.image); // load sprite for character
        characters.push(charInfo); // character info to array
    }

    // add a back button so the player can do more pulls
    const backBtn = addBtn("Back", vec2(width() - 640, height() - 60), () => {
        go("Gacha");
    })
    // design grid layout
    const grid = addLevel([
        // define grid layout where the special symbols indicates a sprite's location in the grid
        "   !       @  ",
        "              ",
        "              ",
        "              ",
        "#      $      %",
    ],
        {
            tileWidth: 64, // width of a grid tile
            tileHeight: 64, // height of a grid tile
            pos: vec2(width() - 1100, height() - 500), // position of the first block
            // define what each symbol means
            tiles: {
                // ! is for the first character
                "!": () => [
                    sprite(`${characters[0].name}`, { width: 240, height: 240 }),
                    area(), // give them collision bodies so they can be clicked on
                    anchor("center"),
                    "character",
                ],
                // @ is for the second character
                "@": () => [
                    sprite(`${characters[1].name}`, { width: 240, height: 240 }),
                    area(), // give them collision bodies so they can be clicked on
                    anchor("center"),
                    "character",
                ],
                // # is for the third character
                "#": () => [
                    sprite(`${characters[2].name}`, { width: 240, height: 240 }),
                    area(), // give them collision bodies so they can be clicked on
                    anchor("center"),
                    "character"
                ],
                // $ is for the fourth character
                "$": () => [
                    sprite(`${characters[3].name}`, { width: 240, height: 240 }),
                    area(), // give them collision bodies so they can be clicked on
                    anchor("center"),
                    "character"
                ],
                // % is for the fifth character
                "%": () => [
                    sprite(`${characters[4].name}`, { width: 240, height: 240 }),
                    area(), // give them collision bodies so they can be clicked on
                    anchor("center"),
                    "character"
                ],
            }
        }
    )

    // leveled up notification
    // const leveledUpNotification = add([
    //     rect(800, 600),
    //     color(DISPLAY_BG_COLOR),
    //     outline(5),
    //     anchor("center"),
    //     pos(center()),
    // ]);

    let alertMsg = "";
    if (tickets.normal !== 0) {
        alertMsg = `You leveled up and got ${tickets.normal} ${tickets.normal > 1 ? `normal tickets!` : `normal ticket!`}.`
        normalTicketCount += tickets.normal // increment normal ticket count
        alert(alertMsg);
    }
    if (tickets.golden !== 0) {
        alertMsg = `You leveled up and got ${tickets.golden} ${tickets.golden > 1 ? `golden tickets!` : `golden ticket!`}.`
        goldenTicketCount += tickets.golden // increment golden ticket count
        alert(alertMsg);
    }


    let infoDisplayed = false; // boolean that's set if a character's info is being displayed
    const display = add([
        rect(1100, 600),
        color(DISPLAY_BG_COLOR),
        outline(5),
        anchor("center"),
        pos(center()),
        "display"
    ]);
    const displayImg = display.add([ // display character's image
        sprite(`${characters[0].name}`, { width: 400, height: 400 }), // initialize the sprite to some arbitrary image since this will get updated once displayInfo() is called
        anchor("center"),
        pos(vec2(width() - 1550, height() - 700)),
    ])
    // display character's name
    const displayName = display.add([
        text("", { font: "digiFont", align: "center", size: 50 }),
        color("#FFFFFF"),
        anchor("center"),
        pos(vec2(0, height() - 975)),
    ]);
    // display character's rarity
    const displayRarity = display.add([
        text("", { font: "digiFont", align: "center" }),
        anchor("center"),
        pos(vec2(100, -150))
    ]);
    // display character's description
    const displayDesc = display.add([
        text("", { font: "digiFont", align: "left", width: 500, size: 25 }),
        anchor("center"),
        pos(vec2(width() - 1000, height() - 700)),
    ]);
    // display duplicate currency amount
    const displayDupCurrency = display.add([
        text("", { font: "digiFont", align: "left", width: 500, size: 25 }),
        anchor("center"),
        pos(vec2(width() - 1000, height() - 530)),
    ]);

    // when player hovers over their pulls, display their name
    const revealText = add([
        text("", { font: "digiFont", align: "center" }),
        anchor("center"),
        pos(vec2(width() / 2, height() - 680))
    ]);
    /**
     * Populate info display with the given character's details
     */
    function displayInfo(character, dup_currency) {
        displayName.text = `${character.name}`;             // display character's name
        displayRarity.text = `${character.rarity}`;         // display character' rarity
        displayRarity.color = Color.fromHex(getRarityColor(character.rarity));
        zoomIn(display, 0.75)                               // have rectangle zoom in 
        displayImg.sprite = `${character.name}`;            // display character's image
        displayDesc.text = `${character.description}`;      // display character's description
        if (dup_currency !== 0) {
            displayDupCurrency.text = `Duplicate: +${dup_currency}`;
        } else {
            displayDupCurrency.text = "";
        }
        // button to go back to bulk pull results
        addBtn("Back", vec2(width() - 640, height() - 60), () => {
            infoDisplayed = false;
            zoomOut(display, 0.4); // TODO: this isn't visible as hidden is set to to true too soon
        });
    }
    // player can go back to gacha or bulk display via pressing the escape key
    onKeyPress("escape", () => {
        if (infoDisplayed) {
            infoDisplayed = false;
            zoomOut(display, 0.4); // TODO: this isn't visible as hidden is set to to true too soon
        } else {
            go("Gacha");
        }
    })
    let characterGameObjects = grid.get("character") // get a list of all the game objects with the tag 'character'
    // display each character with increasing more delay
    for (let i = 0; i < characterGameObjects.length; i++) {
        zoomIn(characterGameObjects[i], i * 0.25);
        // runs every frame when the object is being hovered
        characterGameObjects[i].onHoverUpdate(() => {
            characterGameObjects[i].scale = vec2(1.2); // make button slightly larger
            setCursor("pointer"); // change cursor into pointer
            revealText.text = `You got ${characters[i].name}!`;
        });
        // If character isn't a duplicate, display a badge that says they're new
        if (duplicates[i] === 0) {
            const newBadge = characterGameObjects[i].add([
                rect(200, 75, { radius: 5 }),
                outline(2),
                rotate(-45),
                anchor("center"),
                pos(vec2(-100, -100)),
                color(BADGE_BG_COLOR)
            ]);
            newBadge.add([
                text("New!", { font: "digiFont" }),
                anchor("center"),
                pos(vec2(0, -5)), // center it with newBadge
                color(BADGE_TXT_COLOR)
            ])
        }
        // runs once the object stopped being hovered
        characterGameObjects[i].onHoverEnd(() => {
            characterGameObjects[i].scale = vec2(1); // reset scale of button
            setCursor("default"); // set cursor back to normal
            revealText.text = "";
        });

        // run callback on click
        characterGameObjects[i].onClick(() => {
            displayInfo(characters[i], duplicates[i]);
            infoDisplayed = true;
        });
    }

    // runs every frame
    onUpdate(() => {
        // check if info panel is currently being displayed
        if (infoDisplayed) {
            // make each character unclickable
            characterGameObjects.forEach((character) => {
                character.area.scale = vec2(0);
            })
            backBtn.hidden = true; // hide button that goes back to gacha
            backBtn.area.scale = vec2(0) // make button clickable 
            display.hidden = false; // show display panel
        } else {
            display.hidden = true; // hide display panel
            // make each character clickable
            characterGameObjects.forEach((character) => {
                character.area.scale = vec2(1);
            })
            backBtn.hidden = false; // reveal button that goes back to gacha
            backBtn.area.scale = vec2(1) // make button clickable 
        }
    })
});

// User gets a free ticket a 24 hours; therefore, when this script loads, it should check if enough time has elapsed
async function checkFreeTicket() {
    const requestConfig = {
        url: '/gacha/free_ticket',
        method: 'GET',
        success: (response) => {
            if (response.free_ticket) {
                alert(`You got your daily free normal ticket!`);
                normalTicketCount++; // update counter to reflect new ticket count
            } else {
                console.log(`There's still ${response.timeRemaining * 1000} seconds left before your free ticket.`);
            }
        }
    }
    $.ajax(requestConfig);
}
checkFreeTicket(); // when the script loads, check if the user got their free ticket 