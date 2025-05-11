import kaplay from "https://unpkg.com/kaplay@3001/dist/kaplay.mjs";

// Get all availabile items from the shop
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

// Lay out entities in a grid and hook up click → purchase
function setupShop(items, canvas) {
    const cols = Math.ceil(Math.sqrt(items.length));
    const spacingX = canvas.width / cols;
    const spacingY = canvas.height / cols;

    items.forEach((item, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = spacingX * col + spacingX / 2;
        const y = spacingY * row + spacingY / 2;

        add([
            sprite(item.name),
            pos(x, y),
            area(),
            layer("sprite"),
            onClick(() => {
                document.getElementById("pf-itemName").value = item.name;
                document.getElementById("purchase-form").submit();
            }),
        ]);

        // name label
        add([
            drawText(item.name),
            pos(x - spacingX / 4, y + spacingY / 4),
            layer("ui")
        ]);

        // cost label
        add([
            drawText(cost.name),
            pos(x - spacingX / 4, y + spacingY / 4),
            layer("ui")
        ]);

        // description label
        add([
            drawText(item.description),
            pos(x - spacingX / 4, y + spacingY / 4),
            layer("ui")
        ]);

        /* // image label
        add([
            drawText(image.name),
            pos(x - spacingX/4, y + spacingY/4),
            layer("ui")
        ]); */
    });
}

window.addEventListener("DOMContentLoaded", main);
async function main() {
    let items, balance;
    try {
        [items, balance] = await Promise.all([fetchShopItems(), fetchBalance()]);
    } catch (e) {
        console.error(e);
        return;
    }

    const bal = document.getElementById("user-balance");
    if (bal) {
        bal.textContent = "Balance: " + balance;
    }

    // Initialize Kaplay
    const canvas = document.getElementById("shop-canvas");
    kaplay({
        canvas,
        width: canvas.width,
        height: canvas.height
    });

    // Preload sprites
    for (const item of items) {
        loadSprite(item.name, item.image);
    }

    setupShop(items, canvas);
}
