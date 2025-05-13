const deleteBtn = document.getElementById("deleteBtn");
const profileLink = document.getElementById("profileLink");

// delete account functionality
if (deleteBtn) {
  deleteBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!window.confirm("Are you sure you want to delete?")) {
      return;
    }
    const url = profileLink.href;
    try {
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) {
        throw await response.text();
      }
      // now sign the user out and redirect to login
      await fetch('/signout');
      window.location.href = '/';
    } catch (e) {
      console.error("Account deletion failed:", e);
    }
  });
}

// Drop-down menu
const optionsMenu = document.getElementById("options");
// if drop down menu exists
if (optionsMenu) {
  // when the user makes a selection, redirect them to the corresponding webpage
  optionsMenu.addEventListener("change", async (event) => {
    const url = optionsMenu.value;
    window.location.href = url;
  })
}