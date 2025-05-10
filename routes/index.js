import userRoutes from "./user.js";
import shopRoutes from "./shop.js";
// import all the other routes ...

const configRouteFunction = (app) => {
  app.use("/", userRoutes);
  app.use("/shop", shopRoutes);

  app.use(/(.*)/, (req, res) => {
    res.status(404).json({ error: "Route Not found" });
  });
};

export default configRouteFunction;
