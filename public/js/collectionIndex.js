import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

async function fetchEntries() {
    const res = await fetch("/collectionIndex/entries");
    if (!res.ok) {
        throw "Error: Fetch failed- " + res.status;
    }
    return res.json();
}

function setupIndex(entries, canvas) {
    const cols = Math.ceil(Math.sqrt(entries.length));
    const spacingX = canvas.width  / cols;
    const spacingY = canvas.height / cols;

    entries.forEach((e, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = spacingX * col + spacingX/2;
        const y = spacingY * row + spacingY/2;

        // character sprite
        add([
            sprite(e._id),
            pos(x, y),
            area(),
            layer("sprite")
        ]);

        // name
        add([
            drawText({ text: e.name }),
            pos(x - spacingX/4, y + spacingY/4),
            layer("ui")
        ]);

        // rarity
        add([
            drawText({ text: e.rarity }),
            pos(x - spacingX/4, y + spacingY/4 + 20),
            layer("ui")
        ]);

        /* // image
        add([
            drawText(e.image),
            pos(x - spacingX/4, y + spacingY/4),
            layer("ui")
        ]); */

        // description
        add([
            drawText({ text: e.description }),
            pos(x - spacingX/4, y + spacingY/4),
            layer("ui")
        ]);

        // collected flag
        if (e.collected) {
            add([
                drawText({ text: "✔️" }),
                pos(x + spacingX/4, y - spacingY/4),
                layer("ui")
            ]);
        }
    });
}

window.addEventListener("DOMContentLoaded", main);
async function main() {
    let entries;
    try {
        entries = await fetchEntries();
    } catch (e) {
        console.error(e);
        return;
    }

    // Initialize Kaplay
    const canvas = document.getElementById("index-canvas");
    kaplay({ 
        canvas, 
        width: canvas.width, 
        height: canvas.height 
    });

    entries.forEach(entry => 
        loadSprite(entry._id, entry.image
    ));

    setupIndex(entries, canvas);
};
