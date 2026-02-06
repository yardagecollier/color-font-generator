import React, { useState, useEffect, useCallback } from 'react';
import { generateHarmony, getBestTextColor, getRandomFontPair, isAccessible } from './utils/colorLogic';
import { Lock, Unlock, Copy, RotateCcw, RefreshCw, Heart, Trash2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

function App() {
  const [palette, setPalette] = useState([]);
  const [fontPair, setFontPair] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState(null);

  // Load favorites on mount
  useEffect(() => {
    const saved = localStorage.getItem('aesthetic_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  // Save favorites when updated
  useEffect(() => {
    localStorage.setItem('aesthetic_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Initial load
  useEffect(() => {
    generateNewState(true);
  }, []);

  // Toast timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const generateNewState = useCallback((isInitial = false) => {
    if (!isInitial) {
      setHistory(prev => [...prev, { palette, fontPair }]);
    }

    const baseHue = Math.floor(Math.random() * 360);
    const newHarmony = generateHarmony(baseHue);
    const newFontPair = getRandomFontPair();

    setPalette(prev => {
      if (prev.length === 0) return newHarmony;
      return prev.map((color, index) => {
        if (color.locked) return color;
        return newHarmony[index];
      });
    });

    // Only update font if not locked (assuming we might want to lock fonts later, but for now always separate)
    // Actually, let's keep font randomization tied to generation for now as requested "Generate" triggers both.
    setFontPair(newFontPair);
  }, [palette, fontPair]);

  const handleKeyDown = useCallback((e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      generateNewState();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
    }
  }, [generateNewState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleLock = (index) => {
    setPalette(prev => prev.map((c, i) => i === index ? { ...c, locked: !c.locked } : c));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`Copied ${text}`);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setPalette(lastState.palette);
    setFontPair(lastState.fontPair);
    setHistory(prev => prev.slice(0, -1));
  };

  const saveFavorite = () => {
    const newFav = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      palette: palette.map(c => ({ hex: c.hex, hsl: c.hsl })), // Strip lock state for saving
      fontPair
    };
    setFavorites(prev => [newFav, ...prev]);
    setToast('Saved to Favorites');
  };

  const loadFavorite = (fav) => {
    // Save current to history before loading
    setHistory(prev => [...prev, { palette, fontPair }]);
    
    // Load palette (reset locks)
    setPalette(fav.palette.map(c => ({ ...c, locked: false })));
    setFontPair(fav.fontPair);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteFavorite = (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  if (!fontPair || palette.length === 0) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-off-white text-deep-graphite">
      {/* Toast Notification */}
      <div className={clsx(
        "fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[60] px-6 py-2 rounded-full bg-deep-graphite text-off-white shadow-lg transition-all duration-300 pointer-events-none",
        toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <span className="text-sm font-medium font-mono border-l-2 border-green-400 pl-2">{toast}</span>
      </div>

      {/* Styled Header ("Bubble" aesthetic) */}
      <nav className="fixed top-6 left-0 w-full z-50 pointer-events-none flex justify-center px-4">
        <div className="pointer-events-auto bg-white/80 backdrop-blur-md border border-black/5 shadow-sm rounded-full px-6 py-3 flex items-center gap-6 transition-all hover:shadow-md hover:scale-[1.01]">
           <h1 className="text-lg font-bold tracking-tight">Aesthetic Gen.</h1>
           
           <div className="h-4 w-px bg-black/10"></div>
           
           <div className="flex items-center gap-2">
             <button 
                onClick={handleUndo} 
                disabled={history.length === 0}
                className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30 transition-colors"
                title="Undo (Cmd+Z)"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                onClick={saveFavorite}
                className="p-2 rounded-full hover:bg-pink-50 text-pink-500 transition-colors"
                title="Save to Favorites"
              >
                <Heart size={18} />
              </button>
              <button 
                onClick={() => generateNewState()} 
                className="p-2 rounded-full hover:bg-black/5 transition-colors sm:hidden"
                title="Generate"
              >
                <RefreshCw size={18} />
              </button>
           </div>
        </div>
      </nav>

      {/* Main Content Grid */}
      <div className="flex flex-col flex-grow pt-24 pb-12 px-4 sm:px-8 max-w-7xl mx-auto w-full gap-8 sm:gap-12">
        
        {/* Colors Section */}
        <section className="w-full flex-grow flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-2xl shadow-black/5 min-h-[600px] sm:min-h-0 sm:aspect-[16/9]">
            {palette.map((color, index) => {
              const textColor = getBestTextColor(color.hex);
              const contrastRatio = isAccessible(color.hex, textColor);
              
              return (
                <div 
                  key={index} 
                  className="relative group flex-grow transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col justify-center items-center p-4"
                  style={{ backgroundColor: color.hex, color: textColor }}
                >
                  <div className="flex flex-col items-center gap-2 text-center transition-transform duration-300 w-full">
                    <button 
                      onClick={() => copyToClipboard(color.hex)}
                      className="text-xl sm:text-2xl font-mono font-bold uppercase tracking-wider hover:opacity-80 active:scale-95 transition-all whitespace-nowrap"
                    >
                      {color.hex}
                    </button>
                    
                    <span className="text-xs opacity-60 font-mono hidden sm:block">{color.hsl}</span>

                    <div className="flex items-center gap-1 mt-1 opacity-80" title={`WCAG Contrast: ${contrastRatio}`}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full", contrastRatio === 'Fail' ? "bg-red-500" : "bg-green-500")} />
                        <span className="text-[10px] font-mono tracking-wide uppercase">{contrastRatio}</span>
                    </div>

                    <button 
                      onClick={() => toggleLock(index)}
                      className={clsx(
                        "mt-4 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all",
                         color.locked ? "opacity-100" : "opacity-0 group-hover:opacity-100 sm:opacity-0" // Always confirm lock visibility on mobile? No, let's keep it clean
                      )}
                      aria-label="Lock color"
                    >
                      {color.locked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
        </section>

        {/* Typography Section (Now on equal footing) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
           <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
              <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-gray-500">Typography Pair</span>
                  <span className="text-xs font-mono text-gray-400">{fontPair.label}</span>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-mono">Header ({fontPair.header})</p>
                  <h2 className="text-3xl sm:text-4xl leading-tight" style={{ fontFamily: fontPair.header }}>
                    The quick brown fox jumps over the lazy dog.
                  </h2>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-mono">Body ({fontPair.body})</p>
                  <p className="text-base sm:text-lg leading-relaxed text-gray-600" style={{ fontFamily: fontPair.body }}>
                     Good design allows the content to shine. Typography is the bridge between the message and the reader.
                  </p>
                </div>
              </div>
           </div>

           {/* Favorites / Actions Section */}
           <div className="flex flex-col gap-6">
               <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex-grow min-h-[300px]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold tracking-tight">aesthetic. favorites.</h3>
                    <span className="text-xs font-mono text-gray-400">{favorites.length} saved</span>
                  </div>

                  {favorites.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
                       <Heart size={32} className="mb-3" />
                       <p className="text-sm">No favorites yet.</p>
                       <p className="text-xs mt-1">Generate and Save combinations.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       {favorites.map(fav => (
                         <div key={fav.id} className="group relative bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-transparent hover:border-black/5">
                            <div className="flex gap-2 h-12 mb-3 rounded-md overflow-hidden cursor-pointer" onClick={() => loadFavorite(fav)}>
                               {fav.palette.map((c, i) => (
                                 <div key={i} className="flex-grow h-full" style={{ backgroundColor: c.hex }} />
                               ))}
                            </div>
                            <div className="flex justify-between items-center">
                               <div className="flex flex-col">
                                 <span className="text-xs font-bold text-gray-700">{fav.fontPair.label}</span>
                                 <span className="text-[10px] text-gray-400 font-mono">
                                   {new Date(fav.timestamp).toLocaleDateString()}
                                 </span>
                               </div>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => loadFavorite(fav)}
                                    className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors"
                                    title="Load"
                                  >
                                     <ArrowRight size={14} />
                                  </button>
                                  <button 
                                    onClick={() => deleteFavorite(fav.id)}
                                    className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md text-gray-400 transition-colors"
                                    title="Delete"
                                  >
                                     <Trash2 size={14} />
                                  </button>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
               
               {/* Controls Hint */}
               <div className="text-center sm:text-left p-4 opacity-50 text-xs font-mono hidden sm:block">
                  <p>[Spacebar] to Generate</p>
                  <p>[Click] Lock icon to freeze color</p>
                  <p>[Cmd+Z] to Undo</p>
               </div>
           </div>
        </section>

      </div>
    </div>
  );
}

export default App;
