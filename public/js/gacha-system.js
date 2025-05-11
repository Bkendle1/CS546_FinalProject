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
    method: 'GET', // send a GET request
    url: '/gacha/tickets', // GET request goes to this route
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
const TEXT_COLOR = "#A4B0F5" // hexcolor for general text
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
        text(str),
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

function requestPull(pullType, pullCount) {
    pullType = pullType.toLowerCase(); // make pull type case-insensitive
    let requestConfig = {
        method: 'GET',
        success: (response) => {
            // check if it was a single or bulk pull 
            if (pullCount === 1) {
                go("GachaDisplaySingle", { pulled: response.pulled, duplicates: response.duplicates }); // after the player does a pull, render this new scene that displays their new character
            } else {
                go("GachaDisplayBulk", { pulled: response.pulled, duplicates: response.duplicates }); // after the player does a pull, render this new scene that displays their new characters
            }
        }
    };
    // request a normal pull
    if (pullType === 'normal') {
        // make request to corresponding route
        if (pullCount === 1) {
            requestConfig["url"] = '/gacha/normal'; // request a single, normal pull
            $.ajax(requestConfig).then(function (response) {
                console.log(`Character pulled ${response.pulled}`);
                normalTicketCount -= 1; // decrement ticket count
            });

        } else {
            requestConfig["url"] = '/gacha/normal/bulk'; // request a bulk, normal pull
            $.ajax(requestConfig).then(function (response) {
                console.log(`Character pulled ${response.pulled}`);
                normalTicketCount -= BULK_PULL_COUNT; // decrement ticket count
            });
        }


    }
    else if (pullType === 'golden') { // request a golden pull
        // make request to corresponding route
        if (pullCount === 1) {
            requestConfig["url"] = '/gacha/golden'; // request a single, golden pull
            $.ajax(requestConfig).then(function (response) {
                console.log(`Character pulled ${response.pulled}`);
                goldenTicketCount -= 1; // decrement ticket count
            });

        } else {
            requestConfig["url"] = '/gacha/golden/bulk'; // request a bulk, golden pull
            $.ajax(requestConfig).then(function (response) {
                console.log(`Character pulled ${response.pulled}`);
                goldenTicketCount -= BULK_PULL_COUNT; // decrement ticket count
            });
        }


    }
};


// Get the data of a character using a route for the collectionIndex collection
async function requestCharacterData(characterId) {
    // Make a GET request to /collectionIndex/entries/:id
    try {
        const url = `/collectionIndex/entries/${characterId}`;
        const response = await fetch(url);
        if (!response.ok) throw response.status;
        return await response.json(); // return JSON of response, i.e. character index data
    } catch (e) {
        console.log(e);
    }
}

loadSprite("banner", "/public/images/gachaBanner.png"); // load banner image as a sprite
loadSprite("blackBG", "/public/images/abstractBlackBG.png");
loadFont("digiFont", "/public/fonts/PixelDigivolve.otf", 8, 8);
scene("Gacha", () => {
    // render gacha's banner
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

    // add button for single normal pull
    const normalSingleBtn = addBtn("Normal x1", vec2(300, 200), () => {
        requestPull('normal', 1)
    });
    // add button for bulk normal pull
    const normalBulkBtn = addBtn("Normal x5", vec2(300, 300), () => {
        requestPull('normal', BULK_PULL_COUNT)
    });

    // add button for single golden pull
    const goldenSingleBtn = addBtn("Golden x1", vec2(950, 200), () => {
        requestPull('golden', 1); // request a golden single pull
    });
    // add button for bulk golden pull
    const goldenBulkBtn = addBtn("Golden x5", vec2(950, 300), () => {
        requestPull('golden', BULK_PULL_COUNT); // request a golden bulk pull
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

// scene takes two arguments, one for the pulled character, and a bool that states whether or not they're a duplicate
scene("GachaDisplaySingle", async ({ pulled, duplicate }) => {
    // render scene's background
    add([
        sprite("blackBG"),
        scale(1),
        pos(center()),
        anchor("center"),
    ]);
    // get the pulled character's index information
    const charInfo = await requestCharacterData(pulled);
    loadSprite(charInfo.name, charInfo.image);

    const character = add([
        sprite(charInfo.name),
        pos(center()),
        anchor("center")
    ])
    // TODO: display character's information from index using AJAX request to collectionIndex route
    // display the character's name, image, description, rarity
    tween(
        0,
        1,
        2,
        (v) => {

        }
    )
    add([
        text(`DEBUG: You got: ${pulled}`, { font: "digiFont" }),
        pos(center()),
        anchor("center")
    ]);
    // add a back button so the player can do more pulls
    addBtn("Back", vec2(width() - 640, height() - 60), () => {
        go("Gacha");
    })
});

// scene takes two arrays, one for the pulled characters, and another that's the same size which stores a bool to determine whether or not they're a duplicate
scene("GachaDisplayBulk", ({ pulled, duplicates }) => {
    // render scene's background
    add([
        sprite("blackBG"),
        scale(1),
        pos(center()),
        anchor("center"),
    ]);


    // TODO: display character's information from index using AJAX request to collectionIndex route
    add([
        text(`DEBUG: You got: ${pulled}`, { font: "digiFont" }),
        pos(center()),
        anchor("center")
    ]);

    // add a back button so the player can do more pulls
    addBtn("Back", vec2(width() - 640, height() - 60), () => {
        go("Gacha");
    })
});
