# CodeGalaxy 🌌

Visualize any GitHub repository as a living, breathing solar system. CodeGalaxy turns complex folder structures and codebases into an interactive 3D universe where folders become solar systems, files become planets, and code becomes the universe.

## Features
- **3D Visualization:** Explore repositories in a fully interactive 3D space.
- **Dynamic Sizing:** Planet sizes reflect the actual file byte sizes.
- **Language Detection:** Instantly see what programming languages are used across the repository.
- **AI File Summaries:** Click on any file to get an AI-generated summary of its purpose and contents (powered by Groq).
- **Structure Sidebar:** A resizable sidebar allows traditional tree-based navigation synced with the 3D view.

## Quick Start (Running Locally)

This project consists of a Python FastAPI backend and a Next.js frontend. 

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- A Groq API key (for AI summaries)

### 1. Start the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your Groq API key and optional GitHub token
# GROQ_API_KEY=your_key_here
# GITHUB_TOKEN=your_token_here (optional, prevents rate limits)

# Run the backend server
python main.py
```
The backend will run on `http://localhost:8000`.

### 2. Start the Frontend

Open a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
The frontend will run on `http://localhost:3000`.

## Hackathon Submission & Sharing

This repository is configured to be lightweight. The massive dependency folders (`node_modules` and `venv`) are intentionally excluded via `.gitignore`. 

When reviewing this code, judges can simply clone the repository and run the two sets of installation commands above to launch the project locally within minutes.
