const AI_QUIZ_ENDPOINT = "/api/generateQuiz";
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 20;
const MAX_SOURCE_TEXT_LENGTH = 50000;

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

function setGenerationButtonsDisabled(disabled) {
  document.getElementById("generateButton").disabled = disabled;
  document.getElementById("generatePdfButton").disabled = disabled;
}

async function registerHostParticipant(code, playerName) {
  const participantRef = firebase.firestore()
    .collection("quizzes")
    .doc(code)
    .collection("participants")
    .doc();

  await participantRef.set({
    playerName,
    playerEmail: localStorage.getItem("currentUserEmail") || "",
    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
    isHost: true,
    isPartyMode: false,
    teamId: null,
    teamName: null
  });

  localStorage.setItem("participantId", participantRef.id);
  localStorage.removeItem("teamId");
  localStorage.removeItem("teamName");
}

async function launchQuizFlow(questions, quizTopicLabel) {
  const isGroupQuiz = document.getElementById("groupQuizToggle").checked;

  if (isGroupQuiz) {
    const code = generateCode();

    await firebase.firestore().collection("quizzes").doc(code).set({
      topic: quizTopicLabel,
      questions,
      isGroupQuiz: true,
      isPartyMode: false,
      partySettings: null,
      createdBy: localStorage.getItem("currentUserEmail") || "Unknown creator"
    });

    localStorage.setItem("quizCode", code);
    localStorage.setItem("isGroupQuiz", "true");
    localStorage.setItem("isPartyMode", "false");
    localStorage.removeItem("partySettings");
    localStorage.setItem("playerName", localStorage.getItem("currentUserEmail") || "Quiz Host");
    await registerHostParticipant(code, localStorage.getItem("currentUserEmail") || "Quiz Host");
    alert(`Group quiz created. Share this code: ${code}`);
  } else {
    localStorage.removeItem("quizCode");
    localStorage.setItem("isGroupQuiz", "false");
    localStorage.setItem("isPartyMode", "false");
    localStorage.removeItem("partySettings");
    localStorage.removeItem("participantId");
    localStorage.removeItem("teamId");
    localStorage.removeItem("teamName");
    localStorage.removeItem("playerName");
  }

  localStorage.setItem("quizData", JSON.stringify(questions));
  localStorage.removeItem("score");
  localStorage.removeItem("totalPoints");
  localStorage.removeItem("attemptDetails");
  localStorage.removeItem("lastAttemptId");
  localStorage.setItem("quizTopic", quizTopicLabel);
  window.location.href = "quiz.html";
}

async function requestGeneratedQuiz(payload) {
  const response = await fetch(AI_QUIZ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responsePayload = await response.json();

  if (!response.ok) {
    throw new Error(responsePayload.error || "Failed to generate quiz.");
  }

  return normalizeQuestions(responsePayload);
}

async function generateQuiz() {
  const topic = document.getElementById("topic").value.trim();

  if (!topic) {
    setStatus("Please enter a topic first.");
    return;
  }

  setGenerationButtonsDisabled(true);
  setStatus("Generating quiz from topic...");

  try {
    const questions = await requestGeneratedQuiz({ topic });
    await launchQuizFlow(questions, topic);
  } catch (error) {
    setStatus(error.message || "Something went wrong while generating the quiz.");
  } finally {
    setGenerationButtonsDisabled(false);
  }
}

async function extractPdfText(file) {
  if (!file) {
    throw new Error("Please upload a PDF first.");
  }

  if (file.type !== "application/pdf") {
    throw new Error("Please upload a valid PDF file.");
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error("Please upload a PDF smaller than 10 MB.");
  }

  const pdfBytes = await file.arrayBuffer();
  const pdfDocument = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const pageTexts = [];
  const totalPagesToRead = Math.min(pdfDocument.numPages, MAX_PDF_PAGES);

  for (let pageNumber = 1; pageNumber <= totalPagesToRead; pageNumber++) {
    setStatus(`Reading PDF page ${pageNumber} of ${totalPagesToRead}...`);
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map(item => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pageTexts.push(`Page ${pageNumber}: ${pageText}`);
    }

    if (pageTexts.join("\n").length >= MAX_SOURCE_TEXT_LENGTH) {
      break;
    }
  }

  const extractedText = pageTexts.join("\n").slice(0, MAX_SOURCE_TEXT_LENGTH).trim();

  if (!extractedText) {
    throw new Error("No readable text was found in this PDF. Try a text-based PDF instead of a scanned image PDF.");
  }

  return extractedText;
}

async function generateQuizFromPdf() {
  const pdfFile = document.getElementById("studyPdf").files[0];

  setGenerationButtonsDisabled(true);

  try {
    const studyMaterialText = await extractPdfText(pdfFile);
    setStatus("Generating quiz from uploaded study material...");
    const questions = await requestGeneratedQuiz({
      sourceType: "studyMaterial",
      studyMaterialText
    });
    await launchQuizFlow(questions, pdfFile.name.replace(/\.pdf$/i, ""));
  } catch (error) {
    setStatus(error.message || "Something went wrong while generating the quiz from the PDF.");
  } finally {
    setGenerationButtonsDisabled(false);
  }
}
