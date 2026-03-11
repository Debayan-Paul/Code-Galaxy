import shutil
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from services.ingestor import clone_repo, get_source_files
from services.analyzer import build_hierarchical_graph, extract_edges
from services.summarizer import summarize_file

app = FastAPI(title="CodeGalaxy API")

# Allow CORS for local frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoIngestRequest(BaseModel):
    github_url: str

class NodePosition(BaseModel):
    id: str
    name: str
    group: str
    val: float
    size: Optional[int] = None
    language: Optional[str] = None
    
class Edge(BaseModel):
    source: str
    target: str
    type: str

class GraphResponse(BaseModel):
    nodes: List[NodePosition]
    edges: List[Edge]

@app.get("/")
def read_root():
    return {"status": "CodeGalaxy Backend is running!"}

class SummaryRequest(BaseModel):
    filename: str
    content: str

class SummaryResponse(BaseModel):
    summary: str

@app.post("/api/ingest", response_model=GraphResponse)
async def ingest_repo(request: RepoIngestRequest):
    # Unique temp dir per request to prevent collisions
    session_id = str(uuid.uuid4())[:8]
    dest_dir = f"/tmp/codegalaxy/repo_{session_id}"
    
    try:
        # Extract repo name for naming the Galaxy
        repo_name = request.github_url.split("/")[-1].replace(".git", "")
        if not repo_name:
            repo_name = "Unknown Repository"
            
        clone_repo(request.github_url, dest_dir)
        files = await get_source_files(dest_dir)
        nodes, hierarchy_edges = build_hierarchical_graph(files, repo_name)
        import_edges = extract_edges(files)
        
        all_edges = hierarchy_edges + import_edges
        
        # Clean up
        shutil.rmtree(dest_dir, ignore_errors=True)
        return GraphResponse(nodes=nodes, edges=all_edges)
    except Exception as e:
        # Better safe than sorry cleanup
        shutil.rmtree(dest_dir, ignore_errors=True)
        raise ValueError(f"Failed to process repository: {str(e)}")

@app.post("/api/summarize", response_model=SummaryResponse)
async def fetch_summary(request: SummaryRequest):
    summary = await summarize_file(request.content, request.filename)
    return SummaryResponse(summary=summary)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

