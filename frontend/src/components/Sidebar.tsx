"use client";
import { useState, useEffect } from 'react';
import { X, Code2, Cpu, Loader2, ExternalLink, FileCode, Globe } from 'lucide-react';

interface SidebarProps {
  node: { id: string; group: string; name?: string; size?: number; language?: string; __isInvisibleParent?: boolean } | null;
  repoUrl: string;
  onClose: () => void;
}

// Language color mapping for badges
const LANG_COLORS: Record<string, string> = {
  'Python': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'JavaScript': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'TypeScript': 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  'TypeScript React': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'JavaScript React': 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30',
  'Java': 'bg-red-500/20 text-red-300 border-red-500/30',
  'C++': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'C#': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Go': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Rust': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Ruby': 'bg-red-600/20 text-red-300 border-red-600/30',
  'HTML': 'bg-orange-400/20 text-orange-200 border-orange-400/30',
  'CSS': 'bg-blue-400/20 text-blue-200 border-blue-400/30',
  'SCSS': 'bg-pink-400/20 text-pink-200 border-pink-400/30',
  'Vue': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Svelte': 'bg-orange-600/20 text-orange-300 border-orange-600/30',
  'Shell': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'JSON': 'bg-gray-400/20 text-gray-200 border-gray-400/30',
  'Markdown': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'SQL': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

export default function Sidebar({ node, repoUrl, onClose }: SidebarProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!node || node.__isInvisibleParent) {
      setSummary(null);
      return;
    }

    // Only fetch summary for planet nodes (files)
    if (node.group !== 'planet') {
      setSummary(null);
      return;
    }

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: node.id, content: "File content fetched during ingestion." })
        });
        const data = await res.json();
        setSummary(data.summary);
      } catch (err) {
        setSummary("Failed to communicate with AI core.");
      }
      setLoading(false);
    };

    fetchSummary();
  }, [node]);

  if (!node || node.__isInvisibleParent) return null;

  const langColor = LANG_COLORS[node.language || ''] || 'bg-gray-600/20 text-gray-300 border-gray-500/30';

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-[#0a0a1a]/95 backdrop-blur-xl border-l border-[#00ffcc]/20 text-white p-6 shadow-2xl overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2 text-[#00ffcc]">
           <Code2 size={20} /> {node.group === 'planet' ? 'File Details' : node.group === 'solar_system' ? 'Folder Details' : 'Galaxy Details'}
        </h2>
        <button onClick={onClose} className="hover:text-[#00ffcc] transition-colors p-1 rounded-lg hover:bg-white/5">
          <X size={20}/>
        </button>
      </div>
      
      <div className="space-y-5">
        {/* Name */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Name</h3>
          <p className="font-semibold text-white text-lg">{node.name || node.id.split('/').pop()}</p>
        </div>

        {/* Path */}
        <div>
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Path</h3>
          <p className="font-mono text-xs break-all bg-black/40 p-3 rounded-lg border border-gray-800/50 text-gray-300">{node.id}</p>
          
          {node.group === 'planet' && repoUrl && (
            <a 
              href={`${repoUrl.replace('.git', '')}/blob/main/${node.id}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 text-xs flex items-center gap-1.5 text-[#00ffcc] hover:underline opacity-80 hover:opacity-100 transition-opacity"
            >
              <ExternalLink size={12}/> View on GitHub
            </a>
          )}
        </div>
        
        {/* Entity Type + Language (side by side) */}
        <div className="flex gap-3">
          <div className="flex-1">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium flex items-center gap-1">
              <Globe size={12}/> Entity Type
            </h3>
            <span className="inline-block px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium capitalize">
              {node.group.replace('_', ' ')}
            </span>
          </div>
          
          {node.language && node.language !== 'Unknown' && (
            <div className="flex-1">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium flex items-center gap-1">
                <FileCode size={12}/> Language
              </h3>
              <span className={`inline-block px-3 py-1.5 border rounded-lg text-xs font-semibold ${langColor}`}>
                {node.language}
              </span>
            </div>
          )}
        </div>

        {/* Data Mass */}
        {node.size && node.size > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 font-medium">Data Mass</h3>
            <span className="inline-block px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium">
              {node.size > 1024 * 1024 
                ? `${(node.size / 1024 / 1024).toFixed(2)} MB` 
                : node.size > 1024
                  ? `${(node.size / 1024).toFixed(1)} KB`
                  : `${node.size} bytes`
              }
            </span>
          </div>
        )}

        {/* AI Analysis — only for files */}
        {node.group === 'planet' && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-medium">
              <Cpu size={13}/> AI Analysis
            </h3>
            <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/30 p-4 rounded-xl border border-purple-500/20">
              {loading ? (
                <div className="flex items-center gap-3 text-purple-300 text-sm">
                  <Loader2 className="animate-spin" size={16} /> Analyzing...
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-blue-100/80">{summary || "Click a planet to analyze."}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
