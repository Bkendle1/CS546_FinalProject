import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

kaplay();

// load a sprite from an image
loadSprite("android21", "/public/images/android21.png");

// add image to screen
add([sprite("android21"), pos(80, 40)]);

