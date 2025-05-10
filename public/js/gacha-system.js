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
$.ajax(requestConfig).then(function (response) {
    console.log(response); // print the response of the request
})


function addBtn(str, position, callback) {
    // create button
    const btn = add([
        rect(240, 80, { radius: 8 }), // set button size
        pos(position), // button's position
        area(), // add collider area to detect collision
        scale(1), // size of button
        anchor("center"),
        outline(4),
        color(255, 255, 255)
    ]);

    // add a child object that displays the text
    btn.add([
        text(str),
        anchor("center"),
        color(0, 0, 0), // color of text
    ]);

    // runs every frame when the object is being hovered
    // btn.onHoverUpdate(() => {
    //     const t = time() * 10;
    //     btn.color = hsl2rgb((t / 10) % 1, 0.6, 0.7);
    //     btn.scale = vec2(1.2);
    //     setCursor("pointer");
    // });

    // // runs once the object stopped being hovered
    // btn.onHoverEnd(() => {
    //     btn.scale = vec2(1);
    //     btn.color = rgb();
    // });

    // run callback on click
    btn.onClick(callback);
    return btn;
}
// load a sprite from an image
loadSprite("button", "/public/images/button1.png");
loadSprite("banner", "/public/images/gachaBanner.png");
scene("Gacha", () => {

    // render gacha's banner
    // add([
    //     sprite("banner"),
    //     scale(1.1),
    //     pos(center()),
    //     anchor("center"),
    // ]);
    // add user's normal ticket count
    add([
        text(`Normal: ${normalTicketCount}`),
        pos(vec2(width() - 1100, 90)),
        anchor("center"),
    ]);
    // add user's golden ticket count
    add([
        text(`Golden: ${goldenTicketCount}`),
        pos(vec2(width() - 200, 90)),
        anchor("center"),
    ]);

    // add button for single normal pull
    addBtn("Normal x1", "button", vec2(300, 300), () => {
        console.log("1 normal pull coming up!");
    })


    // add button for bulk normal pull

    // add button for single golden pull
    addBtn("Golden x1", "button", vec2(300, 300), () => {
        console.log("1 golden pull coming up!");
    })
    // add button for bulk golden pull
    // onUpdate(() => {

    // })

});
