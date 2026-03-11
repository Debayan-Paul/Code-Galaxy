"use client";
import { useState, useEffect } from 'react';
import GalaxyGraph from '@/components/GalaxyGraph';
import Sidebar from '@/components/Sidebar';
import FileTree from '@/components/FileTree';
import LandingHero from '@/components/LandingHero';
import { ArrowLeft } from 'lucide-react';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState<string>('root');
  const [visibleGraphData, setVisibleGraphData] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);

  // ===== Scan handler =====
  const handleScan = async (url: string) => {
    setRepoUrl(url);
    setLoading(true);
    setGraphData(null);
    setSelectedNode(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url: url })
      });
      
      const data = await res.json();
      const gd = (data.nodes && data.edges)
        ? { nodes: data.nodes, links: data.edges }
        : data;
      
      setGraphData(gd);
      setCurrentPath('root'); // Start at Galaxy level (show solar systems)
      setShowLanding(false);  // Transition to visualization
    } catch (err) {
      alert("Failed to ingest repository. Ensure backend is running on port 8000.");
    }
    setLoading(false);
  };

  // ===== Compute visible subset =====
  useEffect(() => {
    if (!graphData?.nodes) {
      setVisibleGraphData(null);
      return;
    }

    const { nodes, links } = graphData;
    const vNodes: any[] = [];
    const vLinks: any[] = [];

    // Find children of currentPath via hierarchy links
    const childIds = links
      .filter((l: any) => {
        const src = typeof l.source === 'object' ? l.source.id : l.source;
        return src === currentPath && l.type === 'hierarchy';
      })
      .map((l: any) => typeof l.target === 'object' ? l.target.id : l.target);

    // Add invisible anchor parent pinned at origin
    const parentNode = nodes.find((n: any) => n.id === currentPath);
    if (parentNode) {
      vNodes.push({ ...parentNode, __isInvisibleParent: true, x: 0, y: 0, z: 0, fx: 0, fy: 0, fz: 0 });
    }

    // Pre-compute orbital positions for children
    const baseRadius = 80;
    const radiusStep = 50;
    let childIndex = 0;

    childIds.forEach((cId: string) => {
      const cNode = nodes.find((n: any) => n.id === cId);
      if (cNode) {
        const radius = baseRadius + childIndex * radiusStep;
        const angle = (childIndex / childIds.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        vNodes.push({ ...cNode, x, y: 0, z, fx: x, fy: 0, fz: z });
        childIndex++;
      }
    });

    // Only add import links (hierarchy links are hidden anyway)
    links.forEach((l: any) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      
      if (sourceId === currentPath && childIds.includes(targetId) && l.type === 'hierarchy') {
        vLinks.push(l);
      }
      if (l.type === 'import' && childIds.includes(sourceId) && childIds.includes(targetId)) {
        vLinks.push(l);
      }
    });

    setVisibleGraphData({ nodes: vNodes, links: vLinks });
  }, [graphData, currentPath]);

  // ===== Click handler =====
  const handleNodeClick = (node: any) => {
    if (node.__isInvisibleParent) return;
    
    setSelectedNode(node);
    
    // Drill into directories (galaxy or solar_system)
    if (['galaxy', 'solar_system'].includes(node.group)) {
      setCurrentPath(node.id);
    }
  };

  // ===== Navigate up =====
  const traverseUp = () => {
    if (currentPath === 'root') {
      // Go back to landing
      setShowLanding(true);
      setGraphData(null);
      setVisibleGraphData(null);
      setSelectedNode(null);
      return;
    }
    const parts = currentPath.split('/');
    if (parts.length <= 1) {
      setCurrentPath('root');
    } else {
      parts.pop();
      setCurrentPath(parts.join('/'));
    }
    setSelectedNode(null);
  };

  // ===== LANDING VIEW =====
  if (showLanding) {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-black text-white">
        <LandingHero onScan={handleScan} loading={loading} />
      </main>
    );
  }

  // ===== VISUALIZATION VIEW =====
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('/milky_way_dark_bg.png')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <GalaxyGraph data={visibleGraphData} onNodeClick={handleNodeClick} />
      </div>
      
      {/* Back button + breadcrumb stacked vertically */}
      <div className="absolute top-5 z-30 pointer-events-auto flex flex-col gap-2" style={{ left: `${sidebarWidth + 20}px` }}>
        <button 
          onClick={traverseUp}
          className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-sm text-gray-300 hover:text-[#00ffcc] hover:border-[#00ffcc]/30 transition-all duration-200 w-fit"
        >
          <ArrowLeft size={16} />
          {currentPath === 'root' ? 'Exit' : 'Back'}
        </button>
        <span className="text-xs text-gray-500 font-mono bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 w-fit">
          {currentPath === 'root' ? '🌌 Galaxy' : `📁 ${currentPath}`}
        </span>
      </div>

      {/* Left File Tree Sidebar */}
      <div className="absolute top-0 left-0 h-full z-20 pointer-events-auto">
        {graphData && (
          <FileTree 
            nodes={graphData.nodes} 
            links={graphData.links}
            currentPath={currentPath}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
            onSelect={(path, group) => {
              if (['galaxy', 'solar_system'].includes(group) || path === 'root') {
                setCurrentPath(path);
              }
              setSelectedNode(graphData.nodes.find((n: any) => n.id === path));
            }} 
          />
        )}
      </div>

      {/* Right Properties Sidebar */}
      <div className={`absolute top-0 right-0 h-full z-20 pointer-events-auto transition-transform duration-300 ${selectedNode && !selectedNode.__isInvisibleParent ? 'translate-x-0' : 'translate-x-full'}`}>
        <Sidebar node={selectedNode} repoUrl={repoUrl} onClose={() => setSelectedNode(null)} />
      </div>
    </main>
  );
}
