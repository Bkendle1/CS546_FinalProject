//Here is where you'll set up your server as shown in lecture code
import express from 'express';
const app = express();
import configRoutes from './routes/index.js';
import exphbs from 'express-handlebars';

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
    // If the user posts to the server with a property called _method, rewrite the request's method to be that method
    // so if they post _method=PUT you can now allow browsers to change the POST route into a PUT route using this middleware
    if (req.body && req.body._method) {
        req.method = req.body._method; // change request method
        delete req.body._method; // delete form field as its no longer needed
    }

    // let the next middleware run 
    next();
};

app.use('/public', express.static('public')); // static assets will be stored and served from /public

app.use(express.json()); // express middleware which allows us to read request.body
app.use(express.urlencoded({ extended: true })); // allows us to receive form data
app.use(rewriteUnsupportedBrowserMethods);

app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));  // set templating engine to be handlebars using the main layout which is for elements that you want to be displayed on all your webpages. The app looks in /views/layouts/ and uses main.handlebars as the main layout

app.set('view engine', 'handlebars'); // set view engine to be handlebars
configRoutes(app);

app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log("Your routes will be running on http://localhost:3000");
});