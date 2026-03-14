import os
import shutil
import json
import re
from git import Repo

def clone_repo(github_url: str, dest_dir: str = "/tmp/repo"):
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir, ignore_errors=True)
    
    # Do not call os.makedirs(dest_dir). GitPython will create the folder during clone.
    print(f"Cloning {github_url} to {dest_dir}...")
    Repo.clone_from(github_url, dest_dir)
    return dest_dir

async def get_source_files(repo_path: str):
    source_files = []
    
    # Expanded ignore lists to safely catch heavy/useless folders, but KEEP important configs
    ignore_dirs = {
        '.git', '.github', 'node_modules', 'venv', 'env', '__pycache__', 
        'dist', 'build', 'public', 'assets', '.next', 'out', 'coverage', '.vscode'
    }
    
    # Ignore compiled binaries, media, lockfiles, and large data files
    ignore_extensions = {
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', '.pdf', 
        '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.class', 
        '.pyc', '.pyo', '.lock', '.log', '.csv', '.sqlite3', '.ttf', '.woff'
    }

    # Files that are explicitly useless to visualize (like package-lock.json)
    ignore_exact_files = {
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'poetry.lock', '.DS_Store'
    }

    for root, dirs, files in os.walk(repo_path):
        # Modify dirs in-place to prevent os.walk from entering ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            
            # Skip unwanted extensions and exact file matches
            if ext in ignore_extensions or file in ignore_exact_files:
                continue
                
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, repo_path).replace("\\", "/")
            
            try:
                # Optional: Skip files larger than 1MB to prevent memory crashes
                size_bytes = os.path.getsize(full_path)
                if size_bytes > 1000000:  
                    continue
                    
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                source_files.append({
                    "id": rel_path,
                    "content": content[:10000], # Cap content length to prevent massive payloads
                    "group": rel_path.split("/")[0] if "/" in rel_path else "root",
                    "size": size_bytes
                })
            except Exception:
                # Fails gracefully if a file is unreadable (e.g. weird encoding)
                pass

    print(f"Algorithmically parsed {len(source_files)} valid source files.")
    return source_files
