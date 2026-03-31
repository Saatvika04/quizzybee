let currentQuestion = 0;
let score = 0;
let questions = [];
let totalPoints = 0;
let questionStartTime = 0;
let attemptDetails = [];

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

function isGroupQuiz() {
  return localStorage.getItem("isGroupQuiz") === "true";
}

function calculateGroupPoints(timeMs) {
  const timePenalty = Math.floor(timeMs / 1000) * 5;
  return Math.max(10, 100 - timePenalty);
}

async function saveGroupAttempt() {
  const quizCode = localStorage.getItem("quizCode");

  if (!isGroupQuiz() || !quizCode || typeof firebase === "undefined") {
    return;
  }

  const playerName =
    localStorage.getItem("playerName")
    || localStorage.getItem("currentUserEmail")
    || "Guest Player";
  const totalTimeMs = attemptDetails.reduce((sum, detail) => sum + detail.timeMs, 0);

  const attempt = {
    playerName,
    totalPoints,
    totalTimeMs,
    score,
    attemptDetails
  };

  const docRef = await firebase.firestore()
    .collection("quizzes")
    .doc(quizCode)
    .collection("attempts")
    .add(attempt);

  localStorage.setItem("lastAttemptId", docRef.id);
}

function loadQuestion() {
  const q = questions[currentQuestion];

  if (!q) {
    document.getElementById("question").innerText = "No quiz questions available.";
    document.getElementById("options").innerHTML = "<button onclick=\"window.location.href='dashboard.html'\">Back to Dashboard</button>";
    return;
  }

  document.getElementById("question").innerText = q.question;
  questionStartTime = Date.now();

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

async function checkAnswer(selectedIndex) {
  const selectedOption = questions[currentQuestion].options[selectedIndex];
  const timeMs = Date.now() - questionStartTime;
  let pointsEarned = 0;
  const correct = selectedOption === questions[currentQuestion].answer;

  if (correct) {
    score++;

    if (isGroupQuiz()) {
      pointsEarned = calculateGroupPoints(timeMs);
      totalPoints += pointsEarned;
    }
  }

  attemptDetails.push({
    question: questions[currentQuestion].question,
    selectedOption,
    correct,
    timeMs,
    pointsEarned
  });

  currentQuestion++;

  if (currentQuestion < questions.length) {
    loadQuestion();
  } else {
    localStorage.setItem("score", score);
    localStorage.setItem("totalPoints", totalPoints);
    localStorage.setItem("attemptDetails", JSON.stringify(attemptDetails));
    await saveGroupAttempt();
    window.location.href = "result.html";
  }
}

function initializeQuiz() {
  questions = getQuizQuestions();
  currentQuestion = 0;
  score = 0;
  totalPoints = 0;
  attemptDetails = [];
  loadQuestion();
}
