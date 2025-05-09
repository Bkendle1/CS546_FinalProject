// Get all availabile items from the shop
async function fetchShopItems() {
    const res = await fetch("/shop/items");
    if (!res.ok) {
        throw "Error: Fetch failed- " + res.status;
    }
    return await res.json();
}

// Lay out entities in a grid and hook up click → purchase
function setupShopScene(game, items) {
    const cols = Math.ceil(Math.sqrt(items.length));
    const spacingX = game.width  / cols;
    const spacingY = game.height / cols;

    items.forEach((item, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = spacingX * col + spacingX / 2;
        const y = spacingY * row + spacingY / 2;

        game.add([
            sprite(item.name, { src: item.image }),
            pos(x, y),
            onClick(() => {
            document.getElementById("pf-itemName").value = item.name;
            document.getElementById("purchase-form").submit();
            }),
            drawText(item.name, { x, y: y + 40, font: "16px Arial" }),
            drawText("Cost: " + item.cost, { x, y: y + 60, font: "14px Arial" })
        ]);
    });
}

window.addEventListener("DOMContentLoaded", main);
async function main() {
    let shopItems;
    try {
        shopItems = await fetchShopItems();
    } catch (e) {
        console.error(e);
        return;
    }

    // Initialize Kaplay on the existing <canvas> or container
    const game = kaplay({
        canvas: document.getElementById("phaser-shop"),
        width: 800,
        height: 600,
        background: "#222"
    });

    // Load each image asset
    await Promise.all(
        shopItems.map(item =>
            game.assets.load(item.name, item.image)
        )
    );

    // Start the game loop
    setupShopScene(game, shopItems);
    game.start();
}
