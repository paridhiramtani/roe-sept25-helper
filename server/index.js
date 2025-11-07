import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

const SYSTEM_PROMPT = `
You are an expert in Tools and Data Science (TDS).
Always return complete, verified, and copy-paste-ready answers.
You have deep practical knowledge in:
- Development tools (VS Code, Git, Bash, uv, npx)
- Data tools (DuckDB, dbt, SQLite, Excel, Google Sheets)
- AI tools (Prompt engineering, RAG, embeddings, FastAPI, Vercel, HuggingFace Spaces)
- Web & deployment (Docker, GitHub Actions, Vercel, Codespaces)
Always include:
1. Quick context (1 sentence)
2. **FINAL ANSWER:** [exact commands/code/config]
3. Confidence: [High/Medium/Low]
If unsure, clearly state assumptions before answering.
`;

app.post("/api/gpt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_output_tokens: 2500
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI API error:", data);
      return res.status(openaiRes.status).json(data);
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (_, res) => res.send("✅ TDS Exam Helper API is running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
