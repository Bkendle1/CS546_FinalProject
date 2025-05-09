// Here you will import route files and export the constructor method as shown in lecture code and worked in previous labs.

import shopRoutes from "./shop.js";

const constructorMethod = (app) => {
    // app.use("/", );
    app.use("/shop", shopRoutes);
    
    app.use(/(.*)/, (req, res) => {
        return res.status(404).render("error", {
            error: "Error: Route/Page Not Found!",
            status: 404
        });
    });
};

export default constructorMethod;
