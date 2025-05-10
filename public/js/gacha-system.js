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
    btn.onClick(callback);
    return btn;
}

function requestPull(pullType, pullCount) {
    pullType = pullType.toLowerCase(); // make pull type case-insensitive
    // request a normal pull
    if (pullType === 'normal') {
        let requestConfig = {
            method: 'GET',
        };
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
        let requestConfig = {
            method: 'GET',
        };
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

loadSprite("banner", "/public/images/gachaBanner.png"); // load banner image as a sprite

scene("Gacha", () => {
    // render gacha's banner
    add([
        sprite("banner"),
        scale(1.1),
        pos(center()),
        anchor("center"),
    ]);

    // add user's normal ticket count
    const normalCounter = add([
        text(`Normal: ${normalTicketCount}`),
        pos(vec2(width() - 1100, 90)),
        anchor("center"),
    ]);
    // add user's golden ticket count
    const goldenCounter = add([
        text(`Golden: ${goldenTicketCount}`),
        pos(vec2(width() - 200, 90)),
        anchor("center"),
    ]);
    // TODO: when any of these buttons are pressed, if successful then we need to load a new scene to display the new characters
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
        requestPull('golden', 1)
    });
    // add button for bulk golden pull
    // const goldenBulkBtn = addBtn("Golden x5", vec2(600, 200), () => {
    //     requestPull('golden', BULK_PULL_COUNT)
    // });

    // A button that goes to the shop menu


    onUpdate(() => {
        normalCounter.text = `Normal: ${normalTicketCount}`; // on every frame, it keeps the counter up-to-date
        goldenCounter.text = `Golden: ${goldenTicketCount}`; // on every frame, it keeps the counter up-to-date
        if (normalTicketCount <= 0) {
            // remove the area() from the normal buttons to prevent being clicked, i.e. add button again without area()
            // change color of buttons so they're greyed out
        } else {
            // restore button back to normal
        }
        // TODO: I don't think this check should be done in the update()

        if (goldenTicketCount <= 0) {
            // remove the area() from the normal buttons to prevent being clicked
            goldenSingleBtn.area.scale = vec2(0);

            goldenSingleBtn.color = Color.fromHex("#36454F"); // grey out button to indicate its unavailable
            // goldenSingle
            // change color of buttons so they're greyed out
        }
    });

});

