// SIGNUP
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      localStorage.setItem("currentUserEmail", email);
      alert("Signup successful!");
      window.location.href = "login.html";
    })
    .catch(err => alert(err.message));
}

// LOGIN
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      localStorage.setItem("currentUserEmail", email);
      window.location.href = "dashboard.html";
    })
    .catch(err => alert(err.message));
}
