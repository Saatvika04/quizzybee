let currentQuestion = 0;
let score = 0;
let questions = [];
let totalPoints = 0;
let questionStartTime = 0;
let attemptDetails = [];
let partySettings = null;
let timerIntervalId = null;
let batteryWarningTimeoutId = null;
let currentQuestionOptions = [];
let wrongAnswersCount = 0;
let correctStreak = 0;
let sabotageCharges = 0;
let sabotageUsed = 0;
let sabotageReceived = 0;
let activeEffects = {
  invertUntil: 0
};
let processedEventIds = new Set();
let liveEventsUnsubscribe = null;
let participantsUnsubscribe = null;

const AGGRESSIVE_TIMER_MS = 12000;
const LOW_BATTERY_WARNING_MS = 8000;
const FLASHBANG_DURATION_MS = 3000;
const INVERT_DURATION_MS = 8000;

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

function getStoredPartySettings() {
  try {
    return JSON.parse(localStorage.getItem("partySettings") || "null");
  } catch (error) {
    return null;
  }
}

function isPartyModeEnabled() {
  return localStorage.getItem("isPartyMode") === "true";
}

function getParticipantId() {
  return localStorage.getItem("participantId");
}

function getQuizCode() {
  return localStorage.getItem("quizCode");
}

function hasLeaderboardEnabled() {
  return !partySettings || partySettings.leaderboard !== false;
}

function isEffectEnabled(effectKey) {
  return Boolean(partySettings && partySettings[effectKey]);
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
    teamId: localStorage.getItem("teamId") || null,
    teamName: localStorage.getItem("teamName") || null,
    totalPoints,
    totalTimeMs,
    score,
    attemptDetails,
    sabotageUsed,
    sabotageReceived,
    wrongAnswersCount
  };

  const docRef = await firebase.firestore()
    .collection("quizzes")
    .doc(quizCode)
    .collection("attempts")
    .add(attempt);

  localStorage.setItem("lastAttemptId", docRef.id);
}

function updatePartyMessage(message) {
  const node = document.getElementById("partyMessage");

  if (node) {
    node.innerText = message;
  }
}

function updateSabotageButtons() {
  const controls = document.getElementById("partyControls");
  const targetSelect = document.getElementById("sabotageTarget");
  const flashbangButton = document.getElementById("flashbangButton");
  const invertButton = document.getElementById("invertButton");
  const sabotageAvailable = isPartyModeEnabled()
    && isGroupQuiz()
    && isEffectEnabled("sabotage")
    && sabotageCharges > 0
    && targetSelect
    && targetSelect.options.length > 0;

  if (controls) {
    controls.classList.toggle("hidden", !isEffectEnabled("sabotage") || !isGroupQuiz());
  }

  if (flashbangButton) {
    flashbangButton.disabled = !sabotageAvailable;
  }

  if (invertButton) {
    invertButton.disabled = !sabotageAvailable;
  }
}

function renderTargetOptions(participants) {
  const targetSelect = document.getElementById("sabotageTarget");

  if (!targetSelect) {
    return;
  }

  targetSelect.innerHTML = "";

  participants.forEach(participant => {
    const option = document.createElement("option");
    option.value = participant.id;
    option.text = participant.playerName;
    targetSelect.appendChild(option);
  });

  updateSabotageButtons();
}

function setupParticipantsListener() {
  if (!isGroupQuiz() || !isEffectEnabled("sabotage") || !getQuizCode()) {
    return;
  }

  const participantId = getParticipantId();
  participantsUnsubscribe = firebase.firestore()
    .collection("quizzes")
    .doc(getQuizCode())
    .collection("participants")
    .onSnapshot(snapshot => {
      const participants = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(participant => participant.id !== participantId);

      renderTargetOptions(participants);
    });
}

function showOverlay(id, durationMs) {
  const overlay = document.getElementById(id);

  if (!overlay) {
    return;
  }

  overlay.classList.remove("hidden");

  setTimeout(() => {
    overlay.classList.add("hidden");
  }, durationMs);
}

function applyScreenShrink() {
  const quizStage = document.getElementById("quizStage");

  if (!quizStage || !isEffectEnabled("screenShrink")) {
    return;
  }

  const scale = Math.max(0.6, 1 - wrongAnswersCount * 0.08);
  quizStage.style.transform = `scale(${scale})`;
}

function maybeShowLowBatteryWarning() {
  if (!isEffectEnabled("lowBatteryWarning")) {
    return;
  }

  clearTimeout(batteryWarningTimeoutId);
  batteryWarningTimeoutId = setTimeout(() => {
    showOverlay("batteryOverlay", 2600);
  }, LOW_BATTERY_WARNING_MS);
}

function clearQuestionEffects() {
  clearTimeout(batteryWarningTimeoutId);
}

function startAggressiveTimer() {
  const timerTrack = document.getElementById("timerTrack");

  clearInterval(timerIntervalId);

  if (!isEffectEnabled("aggressiveTimer") || !timerTrack) {
    timerTrack && timerTrack.classList.add("hidden");
    return;
  }

  timerTrack.classList.remove("hidden");
  const timerFill = document.getElementById("timerFill");
  const timerBee = document.getElementById("timerBee");

  timerIntervalId = setInterval(() => {
    const elapsed = Date.now() - questionStartTime;
    const progress = Math.min(elapsed / AGGRESSIVE_TIMER_MS, 1);

    if (timerFill) {
      timerFill.style.width = `${progress * 100}%`;
    }

    if (timerBee) {
      timerBee.style.left = `calc(${progress * 100}% - 14px)`;
    }

    if (progress >= 1) {
      clearInterval(timerIntervalId);
      updatePartyMessage("Too slow. The hive chose for you.");
      checkAnswer(-1);
    }
  }, 100);
}

function isControlsInverted() {
  return Date.now() < activeEffects.invertUntil;
}

function awardSabotageCharge() {
  sabotageCharges += 1;
  updatePartyMessage(`Power-up ready. Charges: ${sabotageCharges}`);
  updateSabotageButtons();
}

async function sendSabotage(type) {
  if (!isEffectEnabled("sabotage") || sabotageCharges <= 0 || !getQuizCode()) {
    return;
  }

  const targetSelect = document.getElementById("sabotageTarget");

  if (!targetSelect || !targetSelect.value) {
    updatePartyMessage("No target available right now.");
    return;
  }

  sabotageCharges -= 1;
  sabotageUsed += 1;
  updateSabotageButtons();

  await firebase.firestore()
    .collection("quizzes")
    .doc(getQuizCode())
    .collection("liveEvents")
    .add({
      type,
      targetParticipantId: targetSelect.value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      fromParticipantId: getParticipantId()
    });

  updatePartyMessage(`${type === "flashbang" ? "Flashbang" : "Invert"} sent.`);
}

function applyLiveEvent(event) {
  if (event.type === "flashbang") {
    sabotageReceived += 1;
    showOverlay("flashbangOverlay", FLASHBANG_DURATION_MS);
    updatePartyMessage("You were flashbanged by another player.");
    return;
  }

  if (event.type === "invert") {
    sabotageReceived += 1;
    activeEffects.invertUntil = Date.now() + INVERT_DURATION_MS;
    updatePartyMessage("Controls inverted for a few seconds.");
    loadQuestion();
  }
}

function setupLiveEventsListener() {
  if (!isGroupQuiz() || !isEffectEnabled("sabotage") || !getQuizCode() || !getParticipantId()) {
    return;
  }

  liveEventsUnsubscribe = firebase.firestore()
    .collection("quizzes")
    .doc(getQuizCode())
    .collection("liveEvents")
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type !== "added") {
          return;
        }

        if (processedEventIds.has(change.doc.id)) {
          return;
        }

        processedEventIds.add(change.doc.id);
        const event = change.doc.data();

        if (event.targetParticipantId !== getParticipantId()) {
          return;
        }

        applyLiveEvent(event);
      });
    });
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
  clearQuestionEffects();
  maybeShowLowBatteryWarning();
  startAggressiveTimer();

  currentQuestionOptions = q.options.map((option, index) => ({
    option,
    originalIndex: index
  }));

  if (isControlsInverted()) {
    currentQuestionOptions = [...currentQuestionOptions].reverse();
  }

  const optionsHTML = currentQuestionOptions
    .map((entry, displayIndex) => `<button type="button" data-display-index="${displayIndex}">${entry.option}</button>`)
    .join("");

  document.getElementById("options").innerHTML = optionsHTML;

  document.querySelectorAll("#options button").forEach(button => {
    button.addEventListener("click", () => {
      checkAnswer(Number(button.dataset.displayIndex));
    });
  });
}

async function checkAnswer(selectedDisplayIndex) {
  if (currentQuestion >= questions.length) {
    return;
  }

  clearInterval(timerIntervalId);
  clearQuestionEffects();
  const selectedEntry = currentQuestionOptions[selectedDisplayIndex];
  const selectedOption = selectedEntry ? selectedEntry.option : "";
  const timeMs = Date.now() - questionStartTime;
  let pointsEarned = 0;
  const correct = selectedOption === questions[currentQuestion].answer;

  if (correct) {
    score++;
    correctStreak += 1;

    if (isGroupQuiz()) {
      pointsEarned = calculateGroupPoints(timeMs);
      totalPoints += pointsEarned;
    }

    if (isEffectEnabled("sabotage") && correctStreak > 0 && correctStreak % 3 === 0) {
      awardSabotageCharge();
    } else if (!isEffectEnabled("sabotage")) {
      updatePartyMessage("Correct answer.");
    }
  } else {
    wrongAnswersCount += 1;
    correctStreak = 0;
    applyScreenShrink();
    updatePartyMessage("Wrong answer.");
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
  wrongAnswersCount = 0;
  correctStreak = 0;
  sabotageCharges = 0;
  sabotageUsed = 0;
  sabotageReceived = 0;
  activeEffects.invertUntil = 0;
  processedEventIds = new Set();
  partySettings = getStoredPartySettings();

  const teamName = localStorage.getItem("teamName");
  const isTeamMode = Boolean(partySettings && partySettings.teamMode);
  const teamBadge = document.getElementById("teamBadge");
  const partyStatus = document.getElementById("partyStatus");
  const partyControls = document.getElementById("partyControls");
  const quizStage = document.getElementById("quizStage");

  if (teamBadge) {
    if (isTeamMode && teamName) {
      teamBadge.innerText = `Playing for ${teamName}`;
      teamBadge.classList.remove("hidden");
    } else {
      teamBadge.classList.add("hidden");
    }
  }

  if (partyStatus) {
    partyStatus.classList.toggle("hidden", !isPartyModeEnabled());
  }

  if (partyControls) {
    partyControls.classList.toggle("hidden", !(isPartyModeEnabled() && isEffectEnabled("sabotage") && isGroupQuiz()));
  }

  if (quizStage) {
    quizStage.style.transform = "scale(1)";
  }

  if (hasLeaderboardEnabled()) {
    updatePartyMessage("Party mode active. Play fast and stay sharp.");
  }

  setupParticipantsListener();
  setupLiveEventsListener();

  loadQuestion();
}
