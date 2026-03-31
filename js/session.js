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
      return;
    }

    window.location.href = "login.html";
  });
}
