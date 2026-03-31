function redirectToDashboardIfLoggedIn() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      localStorage.setItem("currentUserEmail", user.email || "");
      window.location.href = "dashboard.html";
    }
  });
}

function protectPage() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      localStorage.setItem("currentUserEmail", user.email || "");
      if (typeof window.renderUserProfile === "function") {
        window.renderUserProfile(user);
      }
      return;
    }

    window.location.href = "login.html";
  });
}
