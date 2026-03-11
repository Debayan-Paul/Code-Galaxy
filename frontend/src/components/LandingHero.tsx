"use client";
import { useState } from 'react';
import { Github, Search, Loader2, Terminal } from 'lucide-react';

interface LandingHeroProps {
  onScan: (url: string) => void;
  loading: boolean;
}

export default function LandingHero({ onScan, loading }: LandingHeroProps) {
  const [repoUrl, setRepoUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl && !loading) onScan(repoUrl);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: "url('/milky_way_dark_bg.png')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Solar System Animation */}
      <div className="solar-system z-10">
        {/* Sun */}
        <div className="sun" />
        
        {/* Orbit 1 - Mercury */}
        <div className="orbit orbit-1">
          <div className="planet planet-mercury" />
        </div>
        
        {/* Orbit 2 - Venus */}
        <div className="orbit orbit-2">
          <div className="planet planet-venus" />
        </div>
        
        {/* Orbit 3 - Earth */}
        <div className="orbit orbit-3">
          <div className="planet planet-earth" />
        </div>
        
        {/* Orbit 4 - Mars */}
        <div className="orbit orbit-4">
          <div className="planet planet-mars" />
        </div>
        
        {/* Orbit 5 - Jupiter */}
        <div className="orbit orbit-5">
          <div className="planet planet-jupiter" />
        </div>
        
        {/* Orbit 6 - Saturn */}
        <div className="orbit orbit-6">
          <div className="planet planet-saturn">
            <div className="saturn-ring" />
          </div>
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 -mt-8">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">
            <Terminal className="inline-block text-[#00ffcc] mr-3 -mt-2" size={52}/>
            Code<span className="text-[#00ffcc]">Galaxy</span>
          </h1>
          <p className="text-gray-400 mt-3 text-lg max-w-lg mx-auto leading-relaxed">
            Visualize any GitHub repository as a living solar system.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl animate-fade-in-up mt-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ffcc] to-purple-600 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative flex items-center bg-[#050510]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1.5 focus-within:border-[#00ffcc]/50 transition-all duration-300">
              <div className="pl-5 text-gray-500">
                <Github size={22} />
              </div>
              <input 
                type="url" 
                required
                placeholder="https://github.com/user/repo" 
                className="w-full bg-transparent border-none text-white py-4 px-4 focus:ring-0 outline-none placeholder-gray-600 text-lg"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={loading || !repoUrl}
                className="bg-[#00ffcc] hover:bg-[#00e6b8] text-black font-bold py-3.5 px-8 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 mr-1 text-base shadow-lg shadow-[#00ffcc]/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20}/> : <Search size={20}/>}
                <span>{loading ? 'Scanning...' : 'Scan'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Loading state */}
        {loading && (
          <div className="mt-8 animate-pulse">
            <p className="text-[#00ffcc]/80 text-sm tracking-wider">Cloning repository and analyzing structure...</p>
            <div className="mt-3 w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-[#00ffcc] to-purple-500 rounded-full animate-loading-bar" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
