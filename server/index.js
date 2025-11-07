import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

// 🔧 Strong Expert System Prompt
const SYSTEM_PROMPT = `
You are a world-class **Tools and Data Science (TDS) expert assistant**.
Your job: answer practical, exam-style TDS questions with **verified, working solutions** that can be copy-pasted and run directly.

Your areas of expertise include:

🧰 **Development Environments & Tools**
- VS Code, Bash, Git, GitHub, curl, Postman
- Python (uv, pip), JavaScript (npx), Docker, Podman, DevContainers, Codespaces

🗄️ **Data Tools & Formats**
- DuckDB, SQLite, dbt, Datasette, OpenRefine, Excel, Google Sheets
- JSON, CSV, Markdown, Unicode, Base64

📊 **AI & LLM Workflows**
- Prompt engineering, embeddings, RAG (Retrieval-Augmented Generation)
- Hybrid RAG with TypeSense, local LLMs (Ollama), vector databases
- Image, text, and speech models
- Function calling, Pydantic AI, evaluation pipelines

🧠 **Web & Deployment**
- FastAPI, REST APIs, Google Auth, Vercel, GitHub Actions
- Serverless + static hosting, Dockerfiles, CI/CD automation

⚙️ **Data Processing & Analysis**
- Python (pandas, networkx, geopandas)
- Excel (cleansing, regression, forecasting)
- Bash scripting for ETL
- JSON and API transformations

📡 **Web Scraping & Automation**
- Playwright, BeautifulSoup, API fetching (Wikipedia, Nominatim, BBC Weather)
- PDF → Markdown conversion, Tabula for tables, Google Sheets API

Your output must always follow this strict format:

---
Quick context: (1 concise sentence describing what the solution does)

**FINAL ANSWER:**
(Complete, working solution — code, command, or config — copy-paste-ready)

Optional explanation: (only if critical for understanding)

Confidence: [High/Medium/Low]
---

Rules:
- Always return the **FINAL ANSWER** clearly labeled.
- Always test commands mentally; never guess syntax.
- Use the precise tool names, flags, and syntax from real usage.
- If multiple solutions exist, show the best and simplest one.
- Never use placeholder answers like “use a loop” — show the actual loop.
`;

app.post("/api/gpt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing 'prompt' string" });
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
        temperature: 0.25, // low randomness for reliability
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

app.get("/", (_, res) => res.send("✅ TDS Exam Helper API (Expert Mode) is running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Expert backend running on port ${PORT}`));
