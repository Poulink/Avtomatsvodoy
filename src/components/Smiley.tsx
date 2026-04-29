import { motion, AnimatePresence } from 'motion/react';

export function Smiley({ state }: { state: 'neutral' | 'filling' | 'filled' }) {
  const isFilled = state === 'filled';
  const isFilling = state === 'filling';

  return (
    <div className="relative w-40 h-40 mx-auto mt-4 mb-8 flex items-center justify-center">
      <motion.div 
        className="absolute inset-0 bg-[#e0f0ff] rounded-full flex items-center justify-center text-blue-500 shadow-inner"
        animate={{
          scale: isFilled ? [1, 1.05, 1] : 1,
        }}
        transition={{
          repeat: isFilled ? Infinity : 0,
          duration: 1.5,
          ease: "easeInOut"
        }}
      >
        <div className="relative w-full h-full">
          {/* Eyes */}
          <motion.div 
            className="absolute top-1/3 left-[28%] w-4 h-4 rounded-full bg-blue-500 origin-bottom"
            animate={{
               scaleY: isFilled ? 0.3 : 1,
               y: isFilled ? -5 : (isFilling ? 2 : 0)
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          />
          <motion.div 
            className="absolute top-1/3 right-[28%] w-4 h-4 rounded-full bg-blue-500 origin-bottom"
            animate={{
               scaleY: isFilled ? 0.3 : 1,
               y: isFilled ? -5 : (isFilling ? 2 : 0)
            }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          />

          {/* Mouth */}
          <svg className="absolute bottom-8 left-0 w-full h-12 text-blue-500" viewBox="0 0 100 50">
            <motion.path
              d={
                state === 'neutral' ? "M 38 25 Q 50 25 62 25" :
                state === 'filling' ? "M 35 25 Q 50 38 65 25" :
                "M 25 20 Q 50 60 75 20"
              }
              stroke="currentColor"
              strokeWidth={state === 'filled' ? "6" : "5"}
              strokeLinecap="round"
              fill="none"
              animate={{
                d: state === 'neutral' ? "M 38 25 Q 50 25 62 25" :
                   state === 'filling' ? "M 35 25 Q 50 38 65 25" :
                   "M 25 20 Q 50 60 75 20"
              }}
              transition={{ type: "spring", stiffness: 120, damping: 12 }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Hands */}
      <AnimatePresence>
        {isFilled && (
          <motion.div>
            <motion.div 
              className="absolute top-[40%] -left-6 z-10"
              initial={{ opacity: 0, scale: 0, rotate: -40 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                rotate: [-20, -50, -20]
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ rotate: { repeat: Infinity, duration: 0.6, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
              style={{ transformOrigin: "bottom right" }}
            >
              <div className="w-12 h-6 border-4 border-blue-400 rounded-full border-b-transparent border-r-transparent"></div>
            </motion.div>
            
            <motion.div 
              className="absolute top-[40%] -right-6 z-10"
              initial={{ opacity: 0, scale: 0, rotate: 40 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                rotate: [20, 50, 20]
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ rotate: { repeat: Infinity, duration: 0.6, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
              style={{ transformOrigin: "bottom left" }}
            >
               <div className="w-12 h-6 border-4 border-blue-400 rounded-full border-b-transparent border-l-transparent"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
