const deleteBtn = document.getElementById("deleteBtn");
const profileLink = document.getElementById("profileLink");

deleteBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!window.confirm("Are you sure you want to delete?")) {
        return;
    }
    try {
      const url = profileLink.href;
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
