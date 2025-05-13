import multer from "multer";
import path from "path";

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

const uploadDir = path.join(process.cwd(), "public", "uploads");
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
export const uploadPic = multer({ storage }).single("profilePic");
