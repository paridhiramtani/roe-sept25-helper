# roe-sept25-helper

Frontend: Vite + React + Tailwind. Backend: Node/Express proxy to OpenAI.

- Deploy backend as Render Web Service (server/)
- Deploy frontend as Render Static Site (root)

Set environment variables on Render:
- Backend (Web Service): OPENAI_API_KEY (your key), OPENAI_MODEL (optional)
- Frontend (Static Site): VITE_BACKEND_URL = https://<your-backend>.onrender.com
