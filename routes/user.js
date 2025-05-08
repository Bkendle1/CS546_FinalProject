import {Router} from 'express';
const router = Router();
import {register, login } from '../data/users.js';
import {validateString, getCharacterId, validateUsername, validatePassword, validateEmail} from '../helpers.js';

router.route('/').get(async (req, res) => {
    //code here for GET
    try {
      let isUserLoggedIn = false;

      // if user is logged in, redirect to gacha.handlebars (home page)
      if (req.session.user) {
        isUserLoggedIn = true;
        return res.redirect('/gacha');
      }
  
      // else: render login.handlebars
      res.render('login',{title:"Login Page", 
                          user: req.session.user, 
                          isUserLoggedIn: isUserLoggedIn, 
                          });
      
    } catch (e) {
      res.status(500).render('error',{title: "Error: Login",error: e.toString()});
    }
})
.post(async (req, res) => {
    //code here for POST
    const errors = [];
    let formInfo = req.body;

    // check for missing fields
    if (!formInfo.email) {
        errors.push("Email is missing");
      }
    if (!formInfo.password) {
        errors.push("Password is missing");
    }

    // re-render form explaining to user which fields are missing 
    if (errors.length > 0) {
      return res.status(400).render('login', {
        title: "Login Page",
        user: req.session.user,
        errors
      });
    }

    // validate request body
    try {
      formInfo.email = validateEmail(formInfo.email);
      formInfo.password = validatePassword(formInfo.password);

      // call register db function
      let user = await login(formInfo.email,formInfo.password);

      // store user information in req.session.user 
      req.session.user = {
        email: user.email
      };

      // redirect to gacha home page 
      return res.redirect('/gacha');     

    } catch (e) {
      return res.status(400).render('login', {
        title: "Login Page",
        user: req.session.user,
        errors: ["Either the email or password is invalid"]
      });
    }
});

router.route('/register')
.get(async (req, res) => {
  //code here for GET
  try {
    // if user is logged in, redirect to gacha.handlebars (home page)
    if (req.session.user) {
      return res.redirect('/gacha');
    }

    // else: then go to register.handlebar 
    res.render('register',{title:"Register Page", user: req.session.user});
  } catch (e) {
    res.status(400).render('error', {
      title: "Error: Registration Can Not Be Done",
      user: req.session.user,
      error: e.toString()
    });
  }
})
.post(async (req, res) => {
  //code here for POST
  const errors = [];
  let formInfo = req.body;

  // check for missing fields
  if (!formInfo.username) {
    errors.push("Username is missing");
  }
  if (!formInfo.email) {
    errors.push("Email is missing");
  }
  if (!formInfo.password) {
      errors.push("Password is missing");
  }
  if (!formInfo.confirmPassword) {
    errors.push("Confirm Password is missing");
  }

  // re-render form explaining to user which fields are missing 
  if (errors.length > 0) {
    return res.status(400).render('register', {
      title: "Register Page",
      user: req.session.user,
      errors
    });
  }

  // validate request body
  try {
    formInfo.username = validateUsername(formInfo.username);
    formInfo.email = validateEmail(formInfo.email);
    formInfo.password = validatePassword(formInfo.password);

    // check if password and confirmPassword is the same value
    if (formInfo.password !== formInfo.confirmPassword) {
      return res.status(400).render('register', {
        title: "Register Page",
        user: req.session.user,
        errors: ["Password and Confirm Password need to match"]
      });
    }

    // call register db function
    let result = await register(formInfo.username,formInfo.email,formInfo.password);

    // if registered sucessfullt, redirect to login.handlebars
    if (result.registrationCompleted === true) {
      return res.redirect('/'); 
    }
    else {
      return res.status(500).render('register', {
        title: "Register Page",
        user: req.session.user,
        errors: ["Internal Server Error"]
      });
    }    
  } catch (e) {
    // re-render form with 400 status code
    return res.status(400).render('register', {
      title: "Register Page",
      user: req.session.user,
      errors: [e.toString()]
    });
  }

});

router.route('/signout').get(async (req, res) => {
  //code here for GET
  try {
    req.session.destroy();
    res.clearCookie('AuthenticationState');
    res.render('signout',{title: "Logged Out"});
  } catch (e) {
    res.status(400).render('error', {
      title: "Error: Logout Could Not Be Done",
      user: req.session.user,
      error: e.toString()
    });
  }
});

//export router
export default router;