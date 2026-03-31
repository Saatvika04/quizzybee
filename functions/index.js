const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const geminiModel = defineString("GEMINI_MODEL", {
  default: "gemini-2.5-flash",
  description: "Gemini model used to generate structured quiz questions."
});

exports.generateQuiz = onRequest(
  {
    cors: true,
    region: "us-central1",
    secrets: [geminiApiKey]
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed. Use POST." });
      return;
    }

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const topic = String(body.topic || "").trim();

      if (!topic) {
        res.status(400).json({ error: "Topic is required." });
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel.value()}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": geminiApiKey.value()
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: [
                      "Generate a beginner-friendly multiple-choice quiz.",
                      `Topic: ${topic}.`,
                      "Return only structured quiz data.",
                      "Create exactly 5 questions.",
                      "Each question must have exactly 4 options.",
                      "Each question must have exactly 1 correct answer.",
                      "The answer value must exactly match one of the options.",
                      "Keep the wording clear for students."
                    ].join(" ")
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    minItems: 5,
                    maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        question: {
                          type: "string"
                        },
                        options: {
                          type: "array",
                          minItems: 4,
                          maxItems: 4,
                          items: {
                            type: "string"
                          }
                        },
                        answer: {
                          type: "string"
                        }
                      },
                      required: ["question", "options", "answer"]
                    }
                  }
                },
                required: ["questions"]
              }
            }
          })
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error && responseData.error.message
          ? responseData.error.message
          : "Gemini request failed.";

        res.status(response.status).json({ error: errorMessage });
        return;
      }

      const outputText = responseData.candidates
        && responseData.candidates[0]
        && responseData.candidates[0].content
        && responseData.candidates[0].content.parts
        && responseData.candidates[0].content.parts[0]
        && responseData.candidates[0].content.parts[0].text;

      if (!outputText) {
        res.status(502).json({ error: "The Gemini response did not include quiz data." });
        return;
      }

      const parsedQuiz = JSON.parse(outputText);
      res.status(200).json(parsedQuiz);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to generate quiz." });
    }
  }
);
