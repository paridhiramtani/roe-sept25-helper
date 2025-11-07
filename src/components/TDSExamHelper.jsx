// src/components/TDSExamHelper.jsx
import React, { useState } from "react";
import { CheckCircle, AlertCircle, Loader, Target } from "lucide-react";

export default function TDSExamHelper() {
  const [question, setQuestion] = useState("");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));
  const removeFile = (idx) => setFiles((f) => f.filter((_, i) => i !== idx));

  const readFileSmart = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      const type = file.type || "";
      reader.onload = () => {
        if (type.includes("text") || type.includes("csv") || type.includes("json") || type.includes("xml")) {
          resolve({ name: file.name, type, content: reader.result.slice(0, 200000) }); // 200k chars safe preview
        } else if (type.includes("pdf") || type.includes("image") || type === "") {
          // send a small placeholder describing the file and include small base64 snippet for images if needed
          const dataUrl = reader.result;
          const base64Preview = dataUrl.split(",")[1] || "";
          const preview = base64Preview ? `${base64Preview.slice(0, 200)}...` : "";
          resolve({ name: file.name, type, content: `[Base64 ${type || "binary"} snippet: ${preview}]` });
        } else {
          resolve({ name: file.name, type, content: `[Unsupported preview of ${file.name} (${type})]` });
        }
      };

      if (type.includes("text") || type.includes("csv") || type.includes("json") || type.includes("xml")) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });

  const buildPrompt = async () => {
    const fileDatas = await Promise.all(files.map(readFileSmart));
    const fileSection = fileDatas.length
      ? fileDatas.map(f => `\n\nFile: ${f.name}\nType: ${f.type}\nContentPreview:\n${f.content}`).join("\n")
      : "";

    // Instruction to the model to perform the action asked by the user on uploaded files
    const prompt = `
You are an expert Tools & Data Science assistant.
The user asks a task and has uploaded files. Perform the user-specified action on the uploaded files.

TASK:
${question.trim()}

UPLOADED FILES:
${fileSection}

Important:
- Use the uploaded file content when relevant to complete the TASK.
- If a file was not readable, say so.
- Output only a clear result and, if asked, include code snippets or analysis.
Format your response with:
**FINAL ANSWER:** [result]
Confidence: [High/Medium/Low]
`;
    return prompt;
  };

  const callBackend = async (prompt) => {
    if (!BACKEND_URL) throw new Error("VITE_BACKEND_URL is not set. Set it to your backend base URL (e.g. https://...onrender.com).");

    const res = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/api/gpt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Backend error: ${res.status} ${txt}`);
    }

    const data = await res.json();
    // extract text from Responses API shaped response
    const text =
      data.output_text ||
      (Array.isArray(data.output)
        ? data.output.map(o => {
            if (Array.isArray(o.content)) return o.content.map(c => c.text || "").join("\n");
            return o.text || "";
          }).join("\n")
        : data?.choices?.map(c => c?.message?.content || c?.text || "").join("\n") || "");
    return text;
  };

  const handleSubmit = async () => {
    setError("");
    setResult("");
    if (!question.trim() && files.length === 0) {
      setError("Please enter a question and/or upload files.");
      return;
    }
    setLoading(true);
    try {
      const prompt = await buildPrompt();
      const text = await callBackend(prompt);
      setResult(text);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-bold">TDS Exam Helper</h1>
          <p className="text-blue-100 text-sm">Enter a task and upload files — the backend will run GPT and return results.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Question / Task</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Summarize the uploaded PDF, or extract schema from CSV"
              className="w-full h-28 px-4 py-3 border-2 border-gray-300 rounded-lg resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload files (any type)</label>
            <input type="file" multiple onChange={(e) => handleFileChange(e)} className="block w-full" />
            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 border rounded">
                    <div>
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-gray-500">{(f.size/1024).toFixed(1)} KB • {f.type || "unknown"}</div>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-red-500 text-sm">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
              {loading ? <span className="flex items-center"><Loader className="animate-spin mr-2" size={16}/>Running...</span> : "Run Task"}
            </button>
            <div className="text-sm text-gray-600">{error && <span className="text-red-600">{error}</span>}</div>
          </div>

          {result && (
            <div className="mt-4 bg-gray-50 border rounded p-4 whitespace-pre-wrap">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center"><CheckCircle className="text-green-600 mr-2" size={16}/>Result</h3>
              <div className="text-sm text-gray-800">{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

