function rememberLoggedInUser(user) {
  localStorage.setItem("currentUserEmail", user.email || "");
}

// SIGNUP
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => firebase.auth().createUserWithEmailAndPassword(email, password))
    .then(() => {
      rememberLoggedInUser(firebase.auth().currentUser || { email });
      alert("Signup successful!");
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}

// LOGIN
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => firebase.auth().signInWithEmailAndPassword(email, password))
    .then(() => {
      rememberLoggedInUser(firebase.auth().currentUser || { email });
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}
