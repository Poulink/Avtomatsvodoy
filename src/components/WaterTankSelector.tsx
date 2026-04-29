import { useRef } from 'react';
import { motion } from 'motion/react';

export function WaterTankSelector({ level, onChange }: { level: number, onChange: (v: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const updateLevel = (clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate distance from the bottom of the container
    const yPos = rect.bottom - clientY;
    let percentage = (yPos / rect.height) * 100;
    
    // Clamp the percentage
    percentage = Math.max(10, Math.min(100, percentage));
    
    // Snap to nearest 10
    percentage = Math.round(percentage / 10) * 10;
    
    onChange(percentage);
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none w-full py-2">
      <div className="flex items-center justify-between w-full px-2 mb-2">
         <span className="text-gray-700 font-bold">Уровень воды</span>
         <span className="text-blue-600 font-extrabold text-xl">{level}%</span>
      </div>

      <div 
        ref={containerRef}
        className="w-32 h-48 bg-white/80 border-[6px] border-blue-100 backdrop-blur-sm rounded-b-[2.5rem] rounded-t-xl relative overflow-hidden cursor-ns-resize shadow-sm touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          updateLevel(e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons > 0) {
            updateLevel(e.clientY);
          }
        }}
      >
        {/* Background ambient lighting */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/50" />

        {/* Water Fill */}
        <motion.div 
           className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 border-t border-blue-300"
           animate={{ height: `${level}%` }}
           transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        >
           {/* Surface of water */}
           <div className="absolute top-0 left-0 right-0 h-3 bg-white/20 rounded-t-[50%] transform -translate-y-1/2" />
           <div className="absolute top-1 left-0 right-0 h-1 bg-white/10 rounded-t-[50%] transform -translate-y-1/2" />
           
           {/* Animated Bubbles */}
           <motion.div 
             className="absolute bottom-4 left-4 w-2 h-2 bg-white/30 rounded-full"
             animate={{ y: [0, -30, 0], opacity: [0, 1, 0] }}
             transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
           />
           <motion.div 
             className="absolute bottom-10 right-6 w-3 h-3 bg-white/20 rounded-full"
             animate={{ y: [0, -40, 0], opacity: [0, 1, 0] }}
             transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 0.5 }}
           />
           <motion.div 
             className="absolute bottom-2 right-1/2 w-1.5 h-1.5 bg-white/40 rounded-full"
             animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
             transition={{ repeat: Infinity, duration: 1.8, ease: "linear", delay: 0.2 }}
           />
        </motion.div>
        
        {/* Scale Markers */}
        <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
           {[100, 75, 50, 25].map(mark => (
             <div key={mark} className="w-full flex items-center px-1.5 opacity-30 mix-blend-multiply">
               <div className="w-3 h-0.5 bg-blue-900 rounded-full"></div>
             </div>
           ))}
        </div>
      </div>
      <p className="text-xs font-medium text-gray-400 text-center max-w-[160px] leading-tight">
        Потяните бачок вверх или вниз, чтобы изменить уровень
      </p>
    </div>
  );
}
