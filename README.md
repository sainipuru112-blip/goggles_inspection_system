# Hypervise AI Vision Platform

> Real-time AI-powered goggles / PPE inspection system using YOLO + FastAPI + React.

---

## ⚡ Quick Start (New Machine)

### 1. Install Python 3.11+
Download from https://www.python.org/downloads/ — check **"Add Python to PATH"** during install.

### 2. Install Node.js (LTS)
Download from https://nodejs.org — use the Windows x64 installer.

> If you skip steps 1–2, `setup.bat` will try to install Node.js automatically via `winget`.  
> Python must be installed manually.

### 3. Run Setup (one time only)
Double-click **`setup.bat`** — it will:
- Install all Python backend dependencies
- Install all frontend npm packages
- Fix PowerShell execution policy

### 4. Start the App
Double-click **`start-app.bat`** — it will:
- Open the backend server on http://localhost:8000
- Open the frontend dev server on http://localhost:5173
- Automatically open your browser

---

## 📁 Project Structure

```
goggles_inspection_system/
├── setup.bat          ← Run once on a new machine
├── start-app.bat      ← Launch the full app (both servers)
├── run-backend.bat    ← Start backend only
├── run-frontend.bat   ← Start frontend only
│
├── backend/
│   ├── app.py         ← FastAPI entry point
│   ├── config.py      ← Camera source, ports, thresholds
│   ├── requirements.txt
│   ├── weights/       ← Place your .pt YOLO model files here
│   └── snapshots/     ← Auto-saved inspection snapshots
│
└── frontend/
    ├── src/
    │   ├── pages/     ← Dashboard, Monitor, History, Settings
    │   └── components/
    └── package.json
```

---

## ⚙️ Configuration

Edit [`backend/config.py`](backend/config.py) to change:

| Setting | Default | Options |
|---|---|---|
| `SOURCE_TYPE` | `"webcam"` | `"webcam"` / `"rtsp"` / `"video"` / `"ip_camera"` |
| `RTSP_URL` | `rtsp://admin:admin@...` | Your IP camera URL |
| `CONFIDENCE_THRESHOLD` | `0.80` | 0.0 – 1.0 |
| `FRAME_WIDTH/HEIGHT` | `1280 × 720` | Any resolution |

---

## 🤖 Adding YOLO Models

1. Put your `.pt` file in `backend/weights/`
2. Open the app → **Model Configuration** page
3. Create a model and assign parts

---

## 🔗 URLs

| URL | Description |
|---|---|
| http://localhost:5173 | Main App UI |
| http://localhost:8000/docs | FastAPI Swagger docs |
| http://localhost:8000/redoc | FastAPI ReDoc |

---

## 🛠 Manual Commands (if .bat files don't work)

**Backend:**
```powershell
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```powershell
cd frontend
npm run dev
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| AI Detection | Ultralytics YOLO |
| Backend | Python 3.11+ / FastAPI / SQLite |
| Camera | OpenCV |
| Real-time | WebSockets |
| Frontend | React + Vite + MUI + Zustand |
