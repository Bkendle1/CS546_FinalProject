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
    background: "#000000" // background color
});



// load a sprite from an image
loadSprite("android21", "/public/images/android21.png");
scene("game", () => {
    // as soon as the webpage loads, send an AJAX request to get the user's ticket counts
    //Set up request config
    let requestConfig = {
        method: 'GET', // send a GET request
        url: '/gacha/tickets' // GET request goes to this route
    };
    let normalTicketCount = 0;
    let goldenTicketCount = 0;
    $.ajax(requestConfig).then(function (response) {
        console.log(response); // print normal ticket count
        normalTicketCount = response.normalTicketCount;
        goldenTicketCount = response.goldenTicketCount;
    })
    // add user's normal ticket count
    add([
        text(`Normal: ${normalTicketCount}`),
        pos(400),
        anchor("center"),
    ]);
    // add user's golden ticket count
    add([
        text(`Golden: ${goldenTicketCount}`),
        pos(500),
        anchor("center"),
    ]);
    // add button for single normal pull
    // add button for bulk normal pull

    // add button for single golden pull
    // add button for bulk golden pull

    // add image to screen
    const player = add([
        sprite("android21"), // renders the image we loaded (i.e. 'android21') as a sprite
        scale(.1), // halved its size
        pos(80, 40), // position on screen
    ]);



    onUpdate(() => {

    })

});
go("game");
