import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

// Initialize Kaplay
const shopCanvas = document.querySelector("#shop-canvas");
kaplay({
    canvas: shopCanvas,
    width: shopCanvas.width,
    height: shopCanvas.height,
    background: "#000000",
    loadingScreen: true
});

async function fetchShopItems() {
    const res = await fetch("/shop/items");
    if (!res.ok) {
        throw "Error: Items fetch failed- " + res.status;
    }
    return await res.json();
}

async function fetchBalance() {
    const res = await fetch("/shop/balance");
    if (!res.ok) {
        throw "Error: Balance fetch failed- " + res.status;
    }
    const data = await res.json();
    return data.balance;
}

// preload sprites then start
fetchShopItems()
    .then(async items => {
        // preload each sprite (with fallback)
        for (const item of items) {
        const url = item.image && item.image.startsWith("http")
            ? item.image
            : "https://via.placeholder.com/150";
        loadSprite(item.name, url);
        }
        go("Shop");
    })
    .catch(console.error);

scene("Shop", async () => {
    let items, balance;
    try {
        [items, balance] = await Promise.all([
            fetchShopItems(),
            fetchBalance()
        ]);
    } catch (e) {
        console.error(e);
        return;
    }

    const bal = document.getElementById("user-balance");
    if (bal) {
        bal.textContent = "Balance: " + balance;
    }

    const cols = Math.ceil(Math.sqrt(items.length));
    const spacingX = canvas.width / cols;
    const spacingY = canvas.height / cols;

    for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = spacingX * col + spacingX / 2;
        const y = spacingY * row + spacingY / 2;

        add([
            sprite(item.name, { src: item.image }),
            pos(x, y),
            area(),
            layer("sprite"),
            onClick(() => {
                document.getElementById("pf-itemName").value = item.name;
                document.getElementById("purchase-form").submit();
            })
        ]);

        // name label
        add([
            drawText({ text: item.name }),
            pos(x - spacingX / 4, y + spacingY / 4),
            anchor("center"),
            layer("ui")
        ]);

        // cost label
        add([
            drawText({ text: "Cost: " + item.cost }),
            pos(x - spacingX / 4, y + spacingY / 4),
            anchor("center"),
            layer("ui")
        ]);

        // description label
        add([
            drawText({ text: item.description }),
            pos(x - spacingX / 4, y + spacingY / 4),
            anchor("center"),
            layer("ui")
        ]);

        /* // image label
        add([
            drawText(image.name),
            pos(x - spacingX/4, y + spacingY/4),
            layer("ui")
        ]); */
    }
});
