import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

// Initialize Kaplay
const indexCanvas = document.querySelector("#index-canvas");
kaplay({ 
    canvas: indexCanvas,
    width: indexCanvas.width, 
    background: "#E6E6FA",
    loadingScreen: true
});

const TEXT_COLOR = "#BB00E6" // hexcolor for general text

async function fetchEntries() {
    const res = await fetch("/collectionIndex/entries");
    if (!res.ok) {
        throw "Error: Fetch failed- " + res.status;
    }
    return res.json();
}

// preload sprites then start
fetchEntries()
    .then(async entries => {
        for (const e of entries) {
        const url = e.image && e.image.startsWith("http")
            ? e.image
            : "https://via.placeholder.com";
        loadSprite(e._id, url);
        }
        await Promise.all(spritePromises);
        go("Index");
    })
    .catch(console.error);

scene("Index", async () => {
    let entries;
    try {
        entries = await fetchEntries();
    } catch (e) {
        console.error(e);
        return;
    }

    const cols = 4;
    const rows = Math.ceil(entries.length/cols);
    const spacingX = canvas.width  / cols;
    const spacingY = 550;
    indexCanvas.height = spacingY * rows;

    for (let idx = 0; idx < entries.length; idx++) {
        const entry = entries[idx];
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = spacingX * col + spacingX/2;
        const y = spacingY * row + spacingY/2;

        // create the bakcground for each character
        add([
            rect(280,450,{radius: 8}),
            pos(x,y), 
            anchor("center"),
            outline(2), 
            color("#FFFFFF"),
            z(0)
        ]);

        // character sprite
        add([
            sprite(entry._id),
            pos(x, y - 60),
            anchor("center"),
            scale(0.5),
            layer("sprite"),
            z(3)
        ]);

        // name
        add([
            text(entry.name,{size: 16}),
            pos(x, y + 10),
            anchor("center"),
            color(TEXT_COLOR),
            layer("ui"),
            z(4)
        ]);

        // rarity
        add([
            text(entry.rarity,{size: 16}),
            pos(x, y + 30),
            anchor("center"),
            color(TEXT_COLOR),
            layer("ui"),
            z(4)
        ]);

        // description
        const descriptionLines = entry.description.match(/.{1,30}(?=\s|$)/g);
        descriptionLines.forEach((line, i) => {
            add([
                text(line.trim(), {size: 10}),
                pos(x, y + 55 + i * 15),
                anchor("center"),
                color(TEXT_COLOR),
                layer("ui"),
                z(4),
            ]);
        });

        // collected flag
        if (entry.collected) {
            add([
                text("✔️",{size: 16}),
                pos(x + 50, y - 150),
                anchor("center"),
                layer("ui"),
                z(10)
            ]);
        } else {
            add([
                text("❌",{size: 16}),
                pos(x + 50, y - 150),
                anchor("center"),
                layer("ui"),
                z(10)
            ]);
        }
    }
});

go("Index");