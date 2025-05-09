
export const ensureLogin = (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/');
    }
    next();
}

export const redirectToGachaIfLoggedIn = (req, res, next) => {
    if (req.session.user) {
      return res.redirect('/gacha');
    }
    next();
}

