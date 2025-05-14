import userRoutes from "./user.js";
import shopRoutes from "./shop.js";
import collectionInventoryRoutes from "./collectionInventory.js"
import gachaRoutes from "./gacha-system.js";
import collectionIndexRoutes from './collectionIndex.js';

const constructorMethod = (app) => {
    app.use("/gacha", gachaRoutes);
    app.use("/shop", shopRoutes);
    app.use("/collectionInventory", collectionInventoryRoutes);
    app.use("/", userRoutes);
    app.use("/collectionIndex", collectionIndexRoutes);

    app.use(/(.*)/, (req, res) => {
        return res.status(404).render("error", {
            title: "404 Error",
            error: "Route/Page Not Found!",
            status: 404
        });
    });
};

export default constructorMethod;
