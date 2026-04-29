/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { Home } from './components/Home';
import { Admin } from './components/Admin';
import { Droplet, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen text-gray-500 font-medium">Загрузка...</div>;

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col pt-safe bg-[#f4f8fb] font-sans selection:bg-blue-200">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
            <Droplet className="fill-current" />
            Автомат с водой
          </div>
          {user && (
            <button onClick={() => signOut(auth)} className="text-gray-400 p-2 -mr-2 hover:bg-gray-100 rounded-full hover:text-gray-600 transition-colors">
              <LogOut size={22} />
            </button>
          )}
        </header>

        <main className="flex-1 flex flex-col p-4 w-full max-w-lg mx-auto relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div 
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center w-full text-center space-y-8"
              >
                <div className="relative w-32 h-32 bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner border border-white">
                  <Droplet size={56} className="fill-current" />
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-blue-200"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">Сервис подачи воды</h1>
                  <p className="text-gray-500 text-lg px-4">Авторизуйтесь, чтобы удобно заказывать питьевую воду.</p>
                </div>
                <button 
                  onClick={handleLogin}
                  className="bg-blue-600 text-white font-semibold py-5 px-8 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all w-full text-xl"
                >
                  Войти через Google
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col w-full"
              >
                <Routes>
                  <Route path="/" element={<Home user={user} />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </BrowserRouter>
  );
}
