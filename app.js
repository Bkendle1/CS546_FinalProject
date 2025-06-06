import express from 'express';
import session from 'express-session';
const app = express();
import constructorMethod from './routes/index.js';
import { ensureLogin, redirectToGachaIfLoggedIn, passiveIncome } from './middleware.js';
import exphbs from 'express-handlebars';
app.use(express.json());


app.use(session({
    name: 'AuthenticationState',
    secret: 'some secret string!',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.userId = req.session.user ? req.session.user.userId : null;
    next();
});

app.get('/', redirectToGachaIfLoggedIn);
app.get('/register', redirectToGachaIfLoggedIn);

// ensureLogin should apply to every other route besides / and /register but we dont have them yet
app.get('/shop', ensureLogin);
app.get('/shop/items', ensureLogin);
app.get('/shop/purchase', ensureLogin);
app.get('/shop/balance', ensureLogin);

app.get('/collectionIndex', ensureLogin);
app.get('/collectionIndex/entries', ensureLogin);
app.get('/collectionIndex/entries/:id', ensureLogin);

app.get('/collectionInventory', ensureLogin);
app.get('/collectionInventory/:characterId', ensureLogin);
app.get('/collectionInventory/:characterId/nickname', ensureLogin);
app.get('/collectionInventory/:characterId/feed', ensureLogin);

app.get('/gacha', ensureLogin);
app.get('/gacha/tickets', ensureLogin);
app.get('/gacha/normal', ensureLogin);
app.get('/gacha/normal/bulk', ensureLogin);
app.get('/gacha/golden', ensureLogin);
app.get('/gacha/golden/bulk', ensureLogin);
app.get('/gacha/:id/pull_history', ensureLogin);
app.get('/gacha/free_ticket', ensureLogin);
app.get('/gacha/checkCollected', ensureLogin);

app.get('/user/:id', ensureLogin);
app.get('/user/:id/profile', ensureLogin);
app.get('/user/:id/upload-pic', ensureLogin);
app.get('/metadata', ensureLogin);
app.get('/signout', ensureLogin);
app.use(passiveIncome);

app.use('/public', express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    helpers: {
        range: (from, to) => {
            let arr = [];
            for (let i = from; i <= to; i++) {
                arr.push(i);
            }
            return arr;
        },
        hasUploaded: (user) => {
            if (user && user.image) {
                return `<img src="${user.image}" alt="<Profile Pic Here>" width="60" height="60">`;
            }
            return;
        }
    }
}));
app.set('view engine', 'handlebars');

constructorMethod(app);

app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log("Your Gacha game routes will be running on http://localhost:3000");
});
