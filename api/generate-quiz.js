module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const topic = String(body.topic || "").trim();

    if (!topic) {
      res.status(400).json({ error: "Topic is required." });
      return;
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
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

    const responseData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      const errorMessage = responseData.error && responseData.error.message
        ? responseData.error.message
        : "Gemini request failed.";

      res.status(geminiResponse.status).json({ error: errorMessage });
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
};
