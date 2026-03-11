import os
import shutil
import json
import re
from git import Repo
from services.summarizer import get_groq_client

def clone_repo(github_url: str, dest_dir: str = "/tmp/repo"):
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir, ignore_errors=True)
    
    # Do not call os.makedirs(dest_dir). GitPython will create the folder during clone.
    print(f"Cloning {github_url} to {dest_dir}...")
    Repo.clone_from(github_url, dest_dir)
    return dest_dir

async def get_source_files(repo_path: str):
    source_files = []
    # Simple ignore list
    ignore_dirs = {'.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build', 'public', 'assets', '.next'}
    ignore_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', '.pdf', '.zip', '.tar', '.gz'}
    
    all_file_paths = []
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in ignore_extensions:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, repo_path).replace("\\", "/")
                # Cap the number of files we send to not overwhelm the LLM API context limit
                if len(all_file_paths) < 300:
                    all_file_paths.append(rel_path)

    filtered_paths = set(all_file_paths)
    
    # Use Groq to intelligently filter files
    if len(all_file_paths) > 10:
        try:
            client = get_groq_client()
            prompt = f"Here is a flat list of file paths from a codebase. Reply ONLY with a raw JSON array of strings containing the file paths that are essential core source code files, main react components, api routes, and core business models. Exclude obvious config files, package JSONs, dockerfiles, obscure tests, and generic assets. Maintain the exact string paths. Do not wrap in markdown tags. Paths:\n{json.dumps(all_file_paths)}"
            
            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            content = response.choices[0].message.content
            json_match = re.search(r'\[.*\]', content, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                if isinstance(parsed, list):
                    filtered_paths = set(parsed)
            print(f"Groq intelligent filter kept {len(filtered_paths)}/{len(all_file_paths)} core files.")
        except Exception as e:
            print(f"Groq filtering failed: {e}. Falling back to all files.")

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in ignore_extensions:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, repo_path).replace("\\", "/")
                
                if rel_path in filtered_paths:
                    try:
                        size_bytes = os.path.getsize(full_path)
                        with open(full_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        source_files.append({
                            "id": rel_path,
                            "content": content,
                            "group": rel_path.split("/")[0] if "/" in rel_path else "root",
                            "size": size_bytes
                        })
                    except Exception:
                        pass
    return source_files

