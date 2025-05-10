import kaplay, {
    sprite,
    pos,
    area,
    onClick,
    drawText,
    loadSprite
} from 'kaplay';

// Get all availabile items from the shop
async function fetchShopItems() {
    const res = await fetch("/shop/items");
    if (!res.ok) {
        throw "Error: Fetch failed- " + res.status;
    }
    return await res.json();
}

// Lay out entities in a grid and hook up click → purchase
function setupShop(items) {
    const cols = Math.ceil(Math.sqrt(items.length));
    const canvas = document.getElementById("shop-canvas");
    const width = canvas.width;
    const height = canvas.height;
    const spacingX = width / cols;
    const spacingY = height / cols;

    items.forEach((item, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = spacingX * col + spacingX / 2;
        const y = spacingY * row + spacingY / 2;

        add([
            sprite(item.name, { src: item.image }),
            pos(x, y),
            area(),
            onClick(() => {
                document.getElementById("pf-itemName").value = item.name;
                document.getElementById("purchase-form").submit();
            }),
            drawText(item.name),
            drawText("Cost: " + item.cost)
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

    // Initialize Kaplay
    kaplay({
        canvas: document.getElementById("shop-canvas"),
        width: 800,
        height: 600
    });

    // Preload sprites
    for (const item of shopItems) {
        loadSprite(item.name, item.image);
    }

    setupShop(shopItems);
}
