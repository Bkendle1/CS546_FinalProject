import {validateString, getCharacterId, validateUsername, validatePassword, validateEmail} from '../helpers.js';
let registerForm = document.getElementById(`signup-form`);
let loginForm = document.getElementById(`signin-form`);

function displayErrors(errors) {
    let errorElement = document.getElementById(`error`);
    
    // reset errorElement
    errorElement.innerHTML = "";

    let ul = document.createElement('ul');
    for (let error of errors) {
        let li = document.createElement('li');
        li.innerHTML = error;
        ul.appendChild(li);
    }

    errorElement.appendChild(ul);
}


if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        let errors = [];

        // get inputs 
        let username = document.getElementById('username').value.trim();
        let email = document.getElementById('email').value.trim();
        let password = document.getElementById('password').value;
        let confirmPassword = document.getElementById('confirmPassword').value;
        
        // check for missing fields
        if (!username) {
            errors.push("Username is missing");
        }
        if (!email) {
          errors.push("Email is missing");
        }
        if (!password) {
            errors.push("Password is missing");
        }
        if (!confirmPassword) {
            errors.push("Confirm Password is missing");
        }

        // if there are missing fields
        if (errors.length > 0) {
            displayErrors(errors);
            return;
        }
        // else: no missing fields
        else {
            try {
                // validation 
                validateUsername(username);
                validateEmail(email);
                validatePassword(password);

                // check if password and confirmPassword is the same value
                if (password !== confirmPassword) {
                    errors.push("Password and Confirm Password need to match");
                }
            } catch (e) {
                errors.push(e.toString());
            }

            if (errors.length > 0) {
                displayErrors(errors);
                return;
            }

            registerForm.submit();
    }

    });
}


if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
      event.preventDefault();

      let errors = [];

      // get inputs
      
      let email = document.getElementById('email').value.trim();
      let password = document.getElementById('password').value;

      // check for missing fields
      if (!email) {
        errors.push("Email is missing");
      }
      if (!password) {
        errors.push("Password is missing");
      }
      
      // if there are missing fields
      if (errors.length > 0) {
          displayErrors(errors);
          return;
      }

      // else: no missing fields
      try {
          // validation
          validateEmail(email);
          validatePassword(password);
      } catch (e) {
          errors.push(e.toString());
      }

      if (errors.length > 0) {
          displayErrors(errors);
          return;
      }

      loginForm.submit();
  });
}