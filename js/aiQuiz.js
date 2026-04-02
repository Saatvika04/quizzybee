const AI_QUIZ_ENDPOINT = "/api/generateQuiz";

function setStatus(message) {
  document.getElementById("status").innerText = message;
}

function normalizeQuestions(payload) {
  const questions = Array.isArray(payload) ? payload : payload.questions;

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No quiz questions were returned.");
  }

  return questions.map(question => {
    const normalizedQuestion = {
      question: String(question.question || "").trim(),
      options: Array.isArray(question.options)
        ? question.options.map(option => String(option).trim()).filter(Boolean)
        : [],
      answer: String(question.answer || "").trim()
    };

    if (!normalizedQuestion.question) {
      throw new Error("A generated question is missing its text.");
    }

    if (normalizedQuestion.options.length < 2) {
      throw new Error("Each generated question must include at least two options.");
    }

    if (!normalizedQuestion.options.includes(normalizedQuestion.answer)) {
      throw new Error("Each generated answer must match one of its options.");
    }

    return normalizedQuestion;
  });
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}

function getPartySettings() {
  const teamMode = document.getElementById("teamModeToggle").checked;

  return {
    leaderboard: document.getElementById("leaderboardToggle").checked,
    aggressiveTimer: document.getElementById("aggressiveTimerToggle").checked,
    screenShrink: document.getElementById("screenShrinkToggle").checked,
    lowBatteryWarning: document.getElementById("lowBatteryWarningToggle").checked,
    sabotage: document.getElementById("sabotageToggle").checked,
    teamMode,
    teamCount: teamMode ? Number(document.getElementById("teamCountSelect").value) : null,
    teamAssignmentMode: teamMode ? document.getElementById("teamAssignmentModeSelect").value : null,
    enforceBalancedTeams: teamMode ? document.getElementById("balancedTeamsToggle").checked : null
  };
}

async function generateQuiz() {
  const topic = document.getElementById("topic").value.trim();
  const generateButton = document.getElementById("generateButton");
  const isGroupQuiz = document.getElementById("groupQuizToggle").checked;
  const isPartyMode = document.getElementById("partyModeToggle").checked;
  const partySettings = isPartyMode ? getPartySettings() : null;

  if (!topic) {
    setStatus("Please enter a topic first.");
    return;
  }

  generateButton.disabled = true;
  setStatus("Generating quiz...");

  try {
    const response = await fetch(AI_QUIZ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Failed to generate quiz.");
    }

    const questions = normalizeQuestions(payload);

    if (isGroupQuiz) {
      const code = generateCode();

      await firebase.firestore().collection("quizzes").doc(code).set({
        topic,
        questions,
        isGroupQuiz: true,
        isPartyMode,
        partySettings,
        createdBy: localStorage.getItem("currentUserEmail") || "Unknown creator"
      });

      localStorage.setItem("quizCode", code);
      localStorage.setItem("isGroupQuiz", "true");
      localStorage.setItem("isPartyMode", String(isPartyMode));
      localStorage.setItem("partySettings", JSON.stringify(partySettings));
      localStorage.setItem("playerName", localStorage.getItem("currentUserEmail") || "Quiz Host");
      alert(`Group quiz created. Share this code: ${code}`);
    } else {
      localStorage.removeItem("quizCode");
      localStorage.setItem("isGroupQuiz", "false");
      localStorage.setItem("isPartyMode", String(isPartyMode));
      localStorage.setItem("partySettings", JSON.stringify(partySettings));
      localStorage.removeItem("playerName");
    }

    localStorage.setItem("quizData", JSON.stringify(questions));
    localStorage.removeItem("score");
    localStorage.removeItem("totalPoints");
    localStorage.removeItem("attemptDetails");
    localStorage.removeItem("lastAttemptId");
    localStorage.setItem("quizTopic", topic);
    window.location.href = "quiz.html";
  } catch (error) {
    setStatus(error.message || "Something went wrong while generating the quiz.");
  } finally {
    generateButton.disabled = false;
  }
}
