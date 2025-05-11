import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

async function fetchEntries() {
    const res = await fetch("/collectionIndex/entries");
    if (!res.ok) {
        throw "Error: Fetch failed- " + res.status;
    }
    return res.json();
}

scene("Index", async () => {
    let entries;
    try {
        entries = await fetchEntries();
    } catch (e) {
        console.error(e);
        return;
    }

    const cols = Math.ceil(Math.sqrt(entries.length));
    const spacingX = canvas.width  / cols;
    const spacingY = canvas.height / cols;

    for (let idx = 0; idx < entries.length; idx++) {
        const entry = entries[idx];
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = spacingX * col + spacingX/2;
        const y = spacingY * row + spacingY/2;

        // character sprite
        add([
            sprite(entry._id),
            pos(x, y),
            area(),
            layer("sprite")
        ]);

        // name
        add([
            drawText({ text: entry.name }),
            pos(x - spacingX/4, y + spacingY/4),
            anchor("center"),
            layer("ui")
        ]);

        // rarity
        add([
            drawText({ text: entry.rarity }),
            pos(x - spacingX/4, y + spacingY/4 + 20),
            anchor("center"),
            layer("ui")
        ]);

        /* // image
        add([
            drawText(entry.image),
            pos(x - spacingX/4, y + spacingY/4),
            anchor("center"),
            layer("ui")
        ]); */

        // description
        add([
            drawText({ text: entry.description }),
            pos(x - spacingX/4, y + spacingY/4),
            anchor("center"),
            layer("ui")
        ]);

        // collected flag
        if (entry.collected) {
            add([
                drawText({ text: "✔️" }),
                pos(x + spacingX/4, y - spacingY/4),
                anchor("center"),
                layer("ui")
            ]);
        }
    }
});

// Initialize Kaplay
const indexCanvas = document.querySelector("index-canvas");
kaplay({ 
    canvas: indexCanvas,
    width: indexCanvas.width, 
    height: indexCanvas.height,
    background: "#111",
    loadingScreen: true
});

// preload sprites then start
fetchEntries().then(entries => {
    entries.forEach(entry => loadSprite(entry._id, entry.image));
    go("Index");
}).catch(console.error);
