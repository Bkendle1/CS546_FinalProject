import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

// Initialize Kaplay
const shopCanvas = document.querySelector("#shop-canvas");
kaplay({
    canvas: shopCanvas,
    width: shopCanvas.width,
    background: "#87CEEB",
    loadingScreen: true
});

const TEXT_COLOR = "#BB00E6" // hexcolor for general text

// hide form on cancel
document.getElementById("pf-cancel").addEventListener("click", () => {
    document.getElementById("purchase-form").style.display = "none";
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
        for (const i of items) {
        const url = i.image && i.image.startsWith("http")
            ? i.image
            : "https://via.placeholder.com";
        loadSprite(i._id, url);
        }
        await Promise.all(spritePromises);
        go("Shop");
    })
    .catch(console.error);

scene("Shop", async () => {
    let items, balance;
    try {
        items = await fetchShopItems();
        balance = await fetchBalance();
    } catch (e) {
        console.error(e);
        return;
    }

    document.getElementById("user-balance").textContent = "Current Balance: " + balance;

    const cols = 3;
    const rows = Math.ceil(items.length / cols);
    const spacingX = canvas.width / cols;
    const spacingY = 550;
    shopCanvas.height = spacingY * rows;

    for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = spacingX * col + spacingX / 2;
        const y = spacingY * row + spacingY / 2;

        // create the bakcground for each item
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
            sprite(item._id),
            pos(x, y - 60),
            anchor("center"),
            scale(0.5),
            layer("sprite"),
            /* onClick(() => {
                document.getElementById("pf-itemName").value = item.name;
                document.getElementById("purchase-form").submit();
            }), */
            z(3)
        ]);

        // name label
        add([
            text(item.name, {size: 16}),
            // pos(x - spacingX / 4, y + spacingY / 4),
            pos(x, y + 10),
            anchor("center"),
            color(TEXT_COLOR),
            layer("ui"),
            z(4)
        ]);

        // cost label
        add([
            text("Cost:" + item.cost, {size: 16}),
            // pos(x - spacingX / 4, y + spacingY / 4),
            pos(x, y + 30),
            anchor("center"),
            color(TEXT_COLOR),
            layer("ui"),
            z(4)
        ]);

        // description label
        const descriptionLines = item.description.match(/.{1,30}(?=\s|$)/g);
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

        // BUY button
        const buyBtn = add([
            text("Buy", {size: 18}),
            pos(x, y + 180),
            anchor("center"),
            color(TEXT_COLOR),
            area(),
            z(5)
        ]);

        buyBtn.onHoverUpdate(() => {
            buyBtn.scale = vec2(1.2);
            setCursor("pointer");
        });
        buyBtn.onHoverEnd(() => {
            buyBtn.scale = vec2(1);
            setCursor("default");
        });
        buyBtn.onClick(() => {
            document.getElementById("pf-itemName").value = item.name;
            document.getElementById("pf-itemLabel").textContent = item.name;
            document.getElementById("purchase-form").style.display = "block";
        });
    }
});

go("Shop");