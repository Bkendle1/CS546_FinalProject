import userRoutes from "./user.js";
import shopRoutes from "./shop.js";
import gachaRoutes from "./gacha-system.js";
import indexRoutes from './collectionIndex.js';
const constructorMethod = (app) => {
  app.use("/gacha", gachaRoutes);
  app.use("/shop", shopRoutes);
  app.use("/", userRoutes);
  app.use("/collectionIndex", indexRoutes);

  app.use(/(.*)/, (req, res) => {
    return res.status(404).render("error", {
      error: "Error: Route/Page Not Found!",
      status: 404
    });
  });

};

export default constructorMethod;
