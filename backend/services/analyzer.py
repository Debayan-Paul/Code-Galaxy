import re
import math
from collections import defaultdict

LANG_MAP = {
    '.py': 'Python', '.pyw': 'Python',
    '.js': 'JavaScript', '.mjs': 'JavaScript', '.cjs': 'JavaScript',
    '.ts': 'TypeScript', '.tsx': 'TypeScript React', '.jsx': 'JavaScript React',
    '.java': 'Java', '.kt': 'Kotlin', '.kts': 'Kotlin',
    '.c': 'C', '.h': 'C Header', '.cpp': 'C++', '.cc': 'C++', '.hpp': 'C++ Header',
    '.cs': 'C#', '.go': 'Go', '.rs': 'Rust', '.rb': 'Ruby',
    '.php': 'PHP', '.swift': 'Swift', '.m': 'Objective-C',
    '.html': 'HTML', '.htm': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.sass': 'Sass', '.less': 'Less',
    '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML', '.toml': 'TOML', '.xml': 'XML',
    '.md': 'Markdown', '.txt': 'Text', '.csv': 'CSV',
    '.sql': 'SQL', '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell', '.ps1': 'PowerShell',
    '.r': 'R', '.R': 'R', '.lua': 'Lua', '.dart': 'Dart', '.scala': 'Scala',
    '.vue': 'Vue', '.svelte': 'Svelte', '.astro': 'Astro',
    '.dockerfile': 'Dockerfile', '.graphql': 'GraphQL', '.gql': 'GraphQL',
    '.proto': 'Protobuf', '.ex': 'Elixir', '.exs': 'Elixir',
}

def detect_language(filename: str) -> str:
    """Detect programming language from file extension."""
    import os
    _, ext = os.path.splitext(filename.lower())
    # Special case for Dockerfile
    if filename.lower() in ('dockerfile', 'makefile', 'cmakelists.txt'):
        return filename.capitalize()
    return LANG_MAP.get(ext, 'Unknown')


def build_hierarchical_graph(files, repo_name="Unknown Repository"):
    nodes = []
    edges = []
    
    # Root node is the Galaxy
    nodes.append({
        "id": "root",
        "name": repo_name,
        "group": "galaxy",
        "val": 20,
        "language": None
    })
    
    # Map which dirs have BOTH subdirs and files
    dir_contents = defaultdict(lambda: {"dirs": set(), "files": []})
    
    for file in files:
        path = file["id"]
        parts = path.split("/")
        
        for i in range(len(parts) - 1):
            parent = "/".join(parts[:i]) if i > 0 else "root"
            child = "/".join(parts[:i+1])
            dir_contents[parent]["dirs"].add(child)
            
        parent = "/".join(parts[:-1]) if len(parts) > 1 else "root"
        dir_contents[parent]["files"].append(file)
        
    created_nodes = set(["root"])
    
    def add_dir_node(dir_id, parent_id, name):
        if dir_id not in created_nodes:
            created_nodes.add(dir_id)
            nodes.append({
                "id": dir_id,
                "name": name,
                "group": "solar_system",
                "val": 12,
                "language": None
            })
            edges.append({
                "source": parent_id,
                "target": dir_id,
                "type": "hierarchy"
            })
            
    for parent_id, contents in dir_contents.items():
        has_dirs = len(contents["dirs"]) > 0
        has_files = len(contents["files"]) > 0
        
        file_parent_id = parent_id
        if has_dirs and has_files:
            file_parent_id = f"{parent_id}/_files_"
            add_dir_node(file_parent_id, parent_id, "Files")
            
        for child_dir in contents["dirs"]:
            name = child_dir.split("/")[-1]
            add_dir_node(child_dir, parent_id, name)
            
        for file in contents["files"]:
            path = file["id"]
            name = path.split("/")[-1]
            file_size = file.get("size", 1024)
            language = detect_language(name)
            
            val = max(2, min(15, math.log(file_size + 1, 2) / 1.5))
            
            nodes.append({
                "id": path,
                "name": name,
                "group": "planet",
                "val": val,
                "size": file_size,
                "language": language
            })
            edges.append({
                "source": file_parent_id,
                "target": path,
                "type": "hierarchy"
            })
            
    return nodes, edges

def extract_edges(files):
    edges = []
    file_ids = {f["id"] for f in files}
    
    for file in files:
        content = file.get("content", "")
        source_id = file["id"]
        
        matches = re.findall(r'(from|import)\s+[\'"]?([a-zA-Z0-9_./-]+)[\'"]?', content)
        possible_targets = set()
        for match in matches:
            target_str = match[1]
            target_str = target_str.replace("'", "").replace('"', "").replace("./", "").replace("../", "")
            for f_id in file_ids:
                if target_str in f_id and source_id != f_id:
                    possible_targets.add(f_id)
        
        for target in possible_targets:
            edges.append({"source": source_id, "target": target, "type": "import"})
            
    return edges
