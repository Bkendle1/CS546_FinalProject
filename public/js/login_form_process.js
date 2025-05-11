// Helper Functions for Validation and Errors
function validateString(str, varName) {
  if (str === undefined) throw `${varName || "One of the inputs"} is missing.`;
  if (typeof (str) !== "string") throw `${varName || "Input"} must be a string.`;
  if (str.trim().length === 0) throw `${varName || "Input"} can not be empty or just whitespaces.`;
  return str.trim(); // return trimmed string
}

function validateUsername(str) {
  str = validateString(str,"Username");

  // A-Z: 65 to 90
  // a-z: 97 to 122
  // 0-9: 48 to 57
  for (let i = 0; i < str.length; i++) {
      let charCode = str.charCodeAt(i);

      if (!(charCode >= 65 && charCode <= 90) && !(charCode >= 97 && charCode <= 122) && !(charCode >= 48 && charCode <= 57)) {
          throw new Error("Username should only contain letters or positive whole numbers");
      }
  }

  // minimum length = 5 characters, maximum length = 10 characters
  if ((str.length < 5) || (str.length > 10)) {
      throw new Error("Username must have at least 5 characters and at max of 10 characters");
  }

  // return as lowercase version to store in database 
  return str.toLowerCase();
}

function validateEmail(str) {
  str = validateString(str,"Email");
  let isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
  if (!isValidEmail.test(str)) {
      throw new Error("Email must be a valid: no spaces, contains an @ and .<domain>");
  }

  if (str.length > 254) {
      throw new Error("Email maximum length is 254 characters");
  }

  // return as lowercase version to store in database 
  return str.toLowerCase();
}

function validatePassword(str) {
  // dont trim passwords !! 
  if (!str) {
      throw new Error("Password needed");
  }
  if (typeof str !== "string") {
      throw new Error("Password must be a string");
  }
  if (str.length === 0) {
      throw new Error("Password cannot be an empty string or with only spaces");
  }

  // check if contains a space
  if (str.includes(" ")) {
      throw new Error("Password can not contain spaces, but can include any other character, including special characters");
  }

  // minimum length = 8 characters
  if (str.length < 8 || str.length > 25) {
      throw new Error("Password must have at least 8 characters (max of 25 characters)");
  }

  // constraints: at least one uppercase character, at least one number, at least one special character
  let hasUpper = /[A-Z]/.test(str);
  let hasNumber = /[0-9]/.test(str);
  let hasSpecial = /[^a-zA-Z0-9 ]/.test(str); // special character is defined as anything that is not a number, letter, or space

  if (!hasUpper || !hasNumber || !hasSpecial) {
      throw new Error("Password must contain at least one uppercase character, at least one number, at least one special character (special character is defined as anything that is not a number, letter, or space)");
  }

  return str;
}

function displayErrors(errors) {
    let errorElement = document.getElementById("error");

    // reset errorElement
    errorElement.innerHTML = "";

    let ul = document.createElement("ul");
    for (let error of errors) {
        let li = document.createElement("li");
        li.innerHTML = error;
        ul.appendChild(li);
    }

    errorElement.appendChild(ul);
}

let registerForm = document.getElementById("signup-form");
let loginForm = document.getElementById("signin-form");

if (loginForm) {
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault(); // ✅ MUST be first

    let errors = [];
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email) errors.push("Email is missing");
    if (!password) errors.push("Password is missing");

    try {
      validateEmail(email);
      validatePassword(password);
    } catch (e) {
      errors.push(e.toString());
    }

    if (errors.length > 0) {
      displayErrors(errors);
      return;
    }

    axios.post("/", {email: email, password: password })
      .then((res) => {
        if (res.data.success) {
          window.location.href = "/gacha";
        }
      })
      .catch((e) => {
        let loginErrors = [];
        if (e.response && e.response.data && e.response.data.errors) {
          loginErrors = e.response.data.errors;
        }
        else {
          loginErrors = ["Login could not be done"];
        }

        displayErrors(loginErrors);
      });
  });
}


if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        let errors = [];

        // get inputs 
        let username = document.getElementById("username").value.trim();
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value;
        let confirmPassword = document.getElementById("confirmPassword").value;
        
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

