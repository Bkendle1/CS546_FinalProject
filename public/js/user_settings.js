const deleteBtn = document.getElementById("deleteBtn");
const profileLink = document.getElementById("profileLink");
if (deleteBtn) {
    deleteBtn.addEventListener("click", async (event) => {
        event.preventDefault(); // prevent the link from taking the user anywhere
        // send pop up to confirm user wants to delete their account
        if (window.confirm("Are you sure you want to delete?")) {
            // get the url for the delete route user's id via the href of the link that takes the user to their profile page
            const url = profileLink.href
            const response = await fetch(url, { method: "DELETE" })
            // send an AJAX request, i.e. DELETE /user/:id/profile
            // let requestConfig = {
            //     method: "DELETE",
            //     url: url,
            // }
            // $.ajax(requestConfig)
        }
    });
}