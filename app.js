import express from 'express';
import session from 'express-session';
const app = express();
import constructorMethod from './routes/index.js';
import { ensureLogin, redirectToGachaIfLoggedIn } from './middleware.js';
import exphbs from 'express-handlebars';
app.use(express.json());


app.use(session({
    name: 'AuthenticationState',
    secret: 'some secret string!',
    resave: false,
    saveUninitialized: false
}));


app.get('/', redirectToGachaIfLoggedIn);
app.get('/register', redirectToGachaIfLoggedIn);
// ensureLogin should apply to every other route besides / and /register but we dont have them yet
app.get('/signout', ensureLogin);


app.use('/public', express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

constructorMethod(app);

app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log('Your routes will be running on http://localhost:3000');
});