import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Droplet, CheckCircle, Info, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Smiley } from './Smiley';
import { WaterTankSelector } from './WaterTankSelector';

export function Home({ user }: { user: User }) {
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [localStep, setLocalStep] = useState<0 | 1 | 2>(0);
  
  const [waterLevel, setWaterLevel] = useState(100);
  const [washBasin, setWashBasin] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'requests'),
      where('userId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      // Find the most recent active request. Since we can't easily do complex where + orderBy
      // without index, we just fetch all for user and sort in memory for simplicity (usually few requests)
      // or we can sort by createdAt locally.
      const requests = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      requests.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      
      const dismissedIds = JSON.parse(localStorage.getItem('dismissedRequests') || '[]');
      const active = requests.find(r => (r.status === 'filling' || r.status === 'pending' || r.status === 'filled') && !dismissedIds.includes(r.id));
      
      setActiveRequest(active || null);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    });

    return unsub;
  }, [user.uid]);

  const handleFillWater = () => {
    setLocalStep(1);
  };

  const handleOkInstructions = () => {
    setLocalStep(2);
  };

  const handleHandedOver = async () => {
    try {
      await addDoc(collection(db, 'requests'), {
        userId: user.uid,
        status: 'pending',
        washBasin,
        waterLevel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setLocalStep(0); 
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'requests');
    }
  };

  // Secret admin code: Click title 5 times
  const [clicks, setClicks] = useState(0);
  useEffect(() => {
    if (clicks >= 5) {
      navigate('/admin');
    }
  }, [clicks, navigate]);

  if (loading) return <div>Loading...</div>;

  const handleDismiss = (id: string) => {
    const dismissedIds = JSON.parse(localStorage.getItem('dismissedRequests') || '[]');
    dismissedIds.push(id);
    localStorage.setItem('dismissedRequests', JSON.stringify(dismissedIds));
    setActiveRequest(null);
    setLocalStep(0);
  }

  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    if (!window.confirm('Отменить запрос? (Cancel request?)')) return;
    try {
      await deleteDoc(doc(db, 'requests', activeRequest.id));
      setActiveRequest(null);
      setLocalStep(0);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `requests/${activeRequest.id}`);
    }
  };

  // Render components based on state using AnimatePresence
  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full">
      {/* Hidden admin trigger */}
      <div className="w-full h-16 absolute top-0 opacity-0 z-50 cursor-default" onClick={() => setClicks(c => c+1)} />

      <AnimatePresence mode="wait">
        
        {/* State: Active Request Exists */}
        {activeRequest ? (
          <motion.div 
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full flex-1 flex flex-col items-center justify-center text-center pb-12"
          >
            {activeRequest.status === 'filled' ? (
              <>
                <Smiley state="filled" />
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight mt-4">Вода готова!</h2>
                <p className="text-gray-500 text-lg mt-2 mb-8 px-4">
                  Ваш бачок полностью наполнен.
                </p>
                
                <button 
                  onClick={() => handleDismiss(activeRequest.id)}
                  className="w-full max-w-[280px] bg-green-500 text-white font-bold py-5 px-8 rounded-full shadow-lg shadow-green-500/30 hover:bg-green-600 hover:shadow-xl active:scale-95 transition-all text-xl"
                >
                  Спасибо
                </button>
              </>
            ) : (
              <>
                <Smiley state={activeRequest.status === 'filling' ? 'filling' : 'neutral'} />
                
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight mt-4">
                  {activeRequest.status === 'filling' ? 'Выполняем запрос...' : 'Запрос отправлен'}
                </h2>
                
                <p className="text-gray-500 text-lg mt-3 px-4 max-w-sm" style={{textWrap: 'balance'}}>
                  {activeRequest.status === 'filling' ? 'Уже наливаем воду в ваш бачок.' : 'Пожалуйста, подождите. Не закрывайте окно.'}
                </p>
                
                <div className="flex flex-col gap-3 w-full max-w-[320px] mt-10">
                  <div className="bg-white/60 backdrop-blur-md px-6 py-5 w-full rounded-3xl shadow-sm border border-black/[0.05]">
                    <div className="flex items-center justify-between">
                       <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Текущий Статус</p>
                       {activeRequest.status === 'filling' && (
                         <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                         </span>
                       )}
                    </div>
                    <p className={`font-bold text-xl mt-2 text-left ${activeRequest.status === 'filling' ? 'text-blue-600' : 'text-gray-700'}`}>
                      {activeRequest.status === 'filling' ? 'Идет налив воды...' : 'В ожидании...'}
                    </p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-md px-6 py-4 w-full rounded-3xl shadow-sm border border-black/[0.05] text-left">
                    <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider mb-2">Настройки</p>
                    <div className="space-y-1.5">
                       <div className="flex justify-between items-center text-gray-700 font-medium font-sans">
                         <span>Уровень воды:</span>
                         <span className="text-blue-600 font-bold">{activeRequest.waterLevel ?? 100}%</span>
                       </div>
                       {activeRequest.washBasin && (
                         <div className="flex items-center gap-2 text-blue-600 font-medium font-sans text-sm">
                           ✨ <span>С тщательной мойкой бачка</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleCancelRequest}
                  className="mt-10 flex items-center justify-center gap-2 text-red-400 font-medium hover:text-red-600 hover:bg-red-50 py-3 px-6 rounded-full transition-colors"
                >
                  <X size={20} />
                  Отменить запрос
                </button>
              </>
            )}
          </motion.div>
        ) : localStep === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full flex-1 flex flex-col items-center justify-center text-center space-y-8 pb-10"
          >
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl p-1 bg-white border border-gray-100">
               <img 
                 src="https://images.unsplash.com/photo-1548840134-29777bd300ce?auto=format&fit=crop&w=800&q=80" 
                 alt="Аппарат с водой" 
                 className="w-full aspect-[4/3] object-cover rounded-[1.2rem]"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute top-4 left-4 bg-white/90 backdrop-blur pb-1 pt-1 px-3 rounded-full text-blue-600 font-bold tracking-tight text-sm flex items-center gap-1.5 shadow-sm">
                  <Info size={16} /> Правило
               </div>
            </div>

            <div className="space-y-4 text-center px-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Как это работает</h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-[280px] mx-auto" style={{textWrap: 'balance'}}>
                Сначала передайте пустой бачок в окно аппарата, и только затем нажимайте кнопку.
              </p>
            </div>
            
            <button 
              onClick={handleOkInstructions}
              className="w-full max-w-[280px] bg-blue-600 text-white font-bold py-5 px-8 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-xl"
            >
              Понятно
            </button>
          </motion.div>
        ) : localStep === 2 ? (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full flex-1 flex flex-col items-center justify-center text-center space-y-10 pb-10"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-yellow-100 rounded-full animate-pulse opacity-50" />
              <div className="w-28 h-28 bg-yellow-50 border-2 border-yellow-200 text-yellow-500 rounded-full flex items-center justify-center relative shadow-sm">
                <Droplet size={48} className="fill-current" />
              </div>
            </div>

            <div className="space-y-4 px-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Передайте бачок</h2>
              <p className="text-gray-600 text-lg leading-relaxed max-w-[280px] mx-auto" style={{textWrap: 'balance'}}>
                Пожалуйста, передайте бачок в окно прямо сейчас. 
              </p>
            </div>
            
            <button 
              onClick={handleHandedOver}
              className="w-full max-w-[280px] bg-blue-600 text-white font-bold py-5 px-6 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all text-xl flex items-center justify-center gap-3"
            >
              <CheckCircle size={26} />
              Я все передал
            </button>
            <button 
              onClick={() => setLocalStep(0)}
              className="text-gray-400 font-medium hover:text-gray-600 transition"
            >
              Назад
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="step0"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full flex-1 flex flex-col items-center justify-center text-center space-y-10 pb-12"
          >
            <div className="relative">
               <div className="absolute -inset-6 bg-blue-200/50 rounded-full blur-xl" />
               <div className="w-36 h-36 bg-gradient-to-tr from-blue-500 to-blue-400 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/40 relative">
                 <Droplet size={72} className="fill-current transform translate-y-1" />
               </div>
            </div>
            
            <div className="space-y-3 px-4">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight" onClick={() => setClicks(c => c+1)}>Нужна вода?</h1>
              <p className="text-gray-500 text-xl font-medium max-w-[280px] mx-auto" style={{textWrap: 'balance'}}>Настройте параметры и отправьте запрос.</p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <div className="bg-white/60 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-black/[0.05]">
                <WaterTankSelector level={waterLevel} onChange={setWaterLevel} />
              </div>

              <label className="flex items-center gap-4 bg-white/60 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-black/[0.05] cursor-pointer active:scale-95 transition-transform">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={washBasin} 
                    onChange={e => setWashBasin(e.target.checked)} 
                    className="w-6 h-6 text-blue-600 rounded-xl bg-blue-50 border-blue-200 focus:ring-blue-500 transition-all checked:bg-blue-600 checked:border-blue-600" 
                  />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-gray-800 font-bold block">Помыть бачок</span>
                  <span className="block text-sm font-medium text-blue-600/80 mt-0.5">+2 минуты к ожиданию</span>
                </div>
              </label>
            </div>

            <button 
              onClick={handleFillWater}
              className="w-full max-w-[280px] mt-4 bg-blue-600 text-white font-bold py-[20px] px-8 rounded-full shadow-2xl shadow-blue-600/40 hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all text-2xl flex items-center justify-center gap-2 group"
            >
              Налить воду
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={28} />
            </button>

            {clicks > 2 && (
              <p className="text-xs text-gray-400 absolute bottom-4">До доступа: {5 - clicks}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
