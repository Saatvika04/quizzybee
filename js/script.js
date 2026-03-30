let currentQuestion = 0;
let score = 0;

function loadQuestion() {
  const q = questions[currentQuestion];

  document.getElementById("question").innerText = q.question;

  let optionsHTML = "";
  q.options.forEach(option => {
    optionsHTML += `<button onclick="checkAnswer('${option}')">${option}</button>`;
  });

  document.getElementById("options").innerHTML = optionsHTML;
}

function checkAnswer(selected) {
  if (selected === questions[currentQuestion].answer) {
    score++;
  }

  currentQuestion++;

  if (currentQuestion < questions.length) {
    loadQuestion();
  } else {
    localStorage.setItem("score", score);
    window.location.href = "result.html";
  }
}