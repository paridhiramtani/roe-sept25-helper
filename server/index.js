import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

/* ============================================================
   🧠 SYSTEM PROMPT — Expert TDS Exam Helper (GPT-5 Optimized)
============================================================ */
const SYSTEM_PROMPT = `
You are a world-class **Tools and Data Science (TDS) expert assistant**.
Your job: answer practical, exam-style TDS questions with **verified, copy-paste-ready solutions**.

Your expertise includes:

🧰 **Development Environments & Tools**
VS Code, Bash, Git/GitHub, curl, Postman, uv, npx, Docker, DevContainers, Codespaces.

🗄️ **Data Tools & Formats**
DuckDB, SQLite, dbt, Datasette, OpenRefine, Excel, Google Sheets, JSON, CSV, Markdown, Unicode, Base64.

🧠 **AI & LLM Workflows**
Prompt engineering, embeddings, RAG, Hybrid RAG (TypeSense), local LLMs (Ollama), vector DBs, Pydantic AI, pipelines, evaluations.

⚙️ **Data Processing & Analysis**
Python (pandas, geopandas, networkx), Bash ETL, Excel transformations, forecasting, regression.

📡 **Web Scraping & Automation**
Playwright, BeautifulSoup, API fetching (Wikipedia, Nominatim), Tabula for PDFs, Sheets API automation.

📊 **Web & Deployment**
FastAPI, REST APIs, Google Auth, Dockerfiles, GitHub Actions, CI/CD, Vercel, HuggingFace Spaces, static hosting.

✅ **Formatting Rules**
1. Start with: Quick context (1 line)
2. Then: **FINAL ANSWER:** [complete code/command/config — copy-paste-ready]
3. Optional: Short explanation if critical
4. End with: Confidence: [High/Medium/Low]

❌ Never give vague responses — always provide full runnable examples.
❌ Never say "it depends" — make reasonable assumptions.
✔️ Always mentally test your commands before outputting.
`;

/* ============================================================
   🧩 GPT-5 Support — with fallback to GPT-4.1 if unavailable
============================================================ */

const buildBodyForModel = (model, inputText) => {
  const base = {
    model,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: inputText }
    ],
    temperature: 0.25,          // lower = more accuracy
    max_output_tokens: 2500
  };

  // GPT-5 specific params (ignored by older models)
  if (model.startsWith("gpt-5")) {
    base.verbosity = "medium";        // controls response length/detail
    base.reasoning_effort = "high";   // deeper reasoning
  }

  return base;
};

// Call OpenAI API with automatic fallback if GPT-5 unavailable
const callOpenAIWithFallback = async (inputText) => {
  const tryModel = async (model) => {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(buildBodyForModel(model, inputText)),
    });

    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  };

  // Primary attempt — use whatever model is set
  let attempt = await tryModel(OPENAI_MODEL);

  // If model unavailable (403 / 404 / 400), fallback to gpt-4.1
  if (!attempt.ok && attempt.status >= 400 && attempt.status < 500 && OPENAI_MODEL !== "gpt-4.1") {
    console.warn(`⚠️ Model ${OPENAI_MODEL} not available — falling back to gpt-4.1`);
    attempt = await tryModel("gpt-4.1");
  }

  if (!attempt.ok) {
    console.error("❌ OpenAI API error:", attempt.data);
    throw new Error(`OpenAI API error ${attempt.status}: ${JSON.stringify(attempt.data)}`);
  }

  return attempt.data;
};

/* ============================================================
   🚀 Express API Routes
============================================================ */

// Root health check
app.get("/", (_, res) => res.send("✅ TDS Exam Helper API (GPT-5 Ready) is running"));

// Main endpoint
app.post("/api/gpt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt'" });
    }

    const data = await callOpenAIWithFallback(prompt);
    res.status(200).json(data);
  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   🧩 Start Server
============================================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
