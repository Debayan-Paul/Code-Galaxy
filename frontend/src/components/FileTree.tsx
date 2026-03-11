import { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileCode, Box } from 'lucide-react';

interface FileTreeProps {
  nodes: any[];
  links: any[];
  currentPath: string;
  width?: number;
  onWidthChange?: (width: number) => void;
  onSelect: (path: string, group: string) => void;
}

export default function FileTree({ nodes, links, currentPath, width = 320, onWidthChange, onSelect }: FileTreeProps) {
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !onWidthChange) return;
      const newWidth = Math.max(200, Math.min(e.clientX, window.innerWidth * 0.6));
      onWidthChange(newWidth);
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onWidthChange]);

  // Build tree from flat nodes
  const rootGalaxy = nodes.find(n => n.id === 'root');
  
  if (!rootGalaxy) return null;

  return (
    <div 
      className="h-full bg-[#0a0a1a]/90 backdrop-blur-md border-r border-[#00ffcc]/30 text-white flex flex-col relative flex-shrink-0"
      style={{ width: `${width}px` }}
    >
      <div className="p-4 flex flex-col flex-1 overflow-hidden">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[#00ffcc] mb-4 pb-4 border-b border-gray-700 font-sans">
          <Box size={24} /> Structure
        </h2>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <TreeNode 
              node={rootGalaxy} 
              allNodes={nodes} 
              links={links}
              currentPath={currentPath} 
              onSelect={onSelect} 
              defaultExpanded={true}
          />
        </div>
      </div>
      
      {/* Resizer Handle */}
      {onWidthChange && (
        <div 
          className="absolute top-0 right-[-3px] w-2 h-full cursor-col-resize hover:bg-[#00ffcc]/50 z-50 transition-colors"
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />
      )}
    </div>
  );
}

function TreeNode({ node, allNodes, links, currentPath, onSelect, defaultExpanded = false }: any) {
  const [expanded, setExpanded] = useState(defaultExpanded || currentPath.startsWith(node.id));
  
  const childrenIds = links
      .filter((l: any) => l.type === 'hierarchy' && (typeof l.source === 'object' ? l.source.id : l.source) === node.id)
      .map((l: any) => typeof l.target === 'object' ? l.target.id : l.target);
      
  const children = allNodes.filter((n: any) => childrenIds.includes(n.id));

  const isSelected = currentPath === node.id;
  const isDir = ['universe', 'galaxy', 'solar_system'].includes(node.group) || children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDir) {
        setExpanded(!expanded);
    }
    onSelect(node.id, node.group);
  };

  return (
    <div className="ml-3 select-none">
      <div 
        onClick={handleClick}
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-[#00ffcc]/20 text-[#00ffcc]' : 'hover:bg-white/10 text-gray-300'}`}
      >
        <div className="w-4 h-4 flex items-center justify-center">
            {isDir && (expanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
        </div>
        {isDir ? <Folder size={16} className={isSelected ? 'text-[#00ffcc]' : 'text-blue-400'}/> : <FileCode size={16} className="text-gray-400"/>}
        <span className="text-sm truncate" title={node.name || node.id}>{node.name || node.id.split('/').pop()}</span>
      </div>
      
      {expanded && isDir && (
        <div className="border-l border-gray-700 ml-2">
            {children.map((child: any) => (
                <TreeNode 
                    key={child.id} 
                    node={child} 
                    allNodes={allNodes} 
                    links={links}
                    currentPath={currentPath} 
                    onSelect={onSelect}
                />
            ))}
        </div>
      )}
    </div>
  );
}
