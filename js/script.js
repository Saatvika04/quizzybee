let currentQuestion = 0;
let score = 0;
let questions = [];

function getStoredQuestions() {
  try {
    const storedQuizData = localStorage.getItem("quizData");
    return storedQuizData ? JSON.parse(storedQuizData) : null;
  } catch (error) {
    return null;
  }
}

function getQuizQuestions() {
  const storedQuestions = getStoredQuestions();

  if (Array.isArray(storedQuestions) && storedQuestions.length > 0) {
    return storedQuestions;
  }

  if (typeof sampleQuestions !== "undefined" && sampleQuestions.length > 0) {
    return sampleQuestions;
  }

  return [];
}

function loadQuestion() {
  const q = questions[currentQuestion];

  if (!q) {
    document.getElementById("question").innerText = "No quiz questions available.";
    document.getElementById("options").innerHTML = "<button onclick=\"window.location.href='dashboard.html'\">Back to Dashboard</button>";
    return;
  }

  document.getElementById("question").innerText = q.question;

  const optionsHTML = q.options
    .map((option, index) => `<button type="button" data-option-index="${index}">${option}</button>`)
    .join("");

  document.getElementById("options").innerHTML = optionsHTML;

  document.querySelectorAll("#options button").forEach(button => {
    button.addEventListener("click", () => {
      checkAnswer(Number(button.dataset.optionIndex));
    });
  });
}

function checkAnswer(selectedIndex) {
  const selectedOption = questions[currentQuestion].options[selectedIndex];

  if (selectedOption === questions[currentQuestion].answer) {
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

function initializeQuiz() {
  questions = getQuizQuestions();
  currentQuestion = 0;
  score = 0;
  loadQuestion();
}
