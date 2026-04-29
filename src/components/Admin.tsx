import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Trash2, ShieldAlert, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export function Admin() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'requests')
    );

    const unsub = onSnapshot(q, (snap) => {
      const rqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rqs.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setRequests(rqs);
      setLoading(false);
      setError('');
    }, (error) => {
      console.error(error);
      setError('У вас нет прав администратора для просмотра этой страницы.');
      setLoading(false);
    });

    return unsub;
  }, []);

  const totalPages = Math.max(1, Math.ceil(requests.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = requests.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [requests.length, currentPage, totalPages]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `requests/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот запрос?')) return;
    try {
      await deleteDoc(doc(db, 'requests', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `requests/${id}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium tracking-wide">Загрузка панели администратора...</div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto mt-10">
      <ShieldAlert size={56} className="text-red-500" />
      <h2 className="text-2xl font-bold text-gray-800">Доступ запрещен</h2>
      <p className="text-gray-600 leading-relaxed text-balance">{error}</p>
      <button 
        onClick={() => navigate('/')}
        className="bg-blue-600 text-white font-medium px-8 py-3 rounded-full mt-6 shadow hover:bg-blue-700 transition"
      >
        Вернуться назад
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in pb-12">
      <div className="flex items-center gap-4 mb-6 sticky top-[72px] z-40 bg-[#f4f8fb]/80 backdrop-blur-md py-4">
        <button onClick={() => navigate('/')} className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition active:scale-95">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">Панель администратора</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-black/[0.04] overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">Новых запросов нет.</div>
        ) : (
          <>
            <ul className="divide-y divide-gray-50">
              {currentRequests.map((req) => (
                <li key={req.id} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 justify-between sm:items-center hover:bg-gray-50/50 transition duration-300">
                  <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ID: {req.id.slice(0, 6)}</span>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'filling' ? 'bg-blue-100 text-blue-700' :
                      req.status === 'ignore' ? 'bg-gray-100 text-gray-600' :
                      req.status === 'filled' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100'
                    }`}>
                      {req.status === 'pending' ? 'ОЖИДАЕТ' : req.status === 'filling' ? 'НАЛИВАЕТСЯ' : req.status === 'filled' ? 'НАЛИТО' : req.status === 'ignore' ? 'ПРОИГНОРИРОВАНО' : req.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]" title={req.userId}>Польз.: {req.userId.slice(0, 8)}</p>
                  
                  <div className="flex flex-col gap-0.5 mt-2 mb-1">
                    <span className="text-[13px] font-semibold text-gray-600 bg-gray-50 px-2 py-1 rounded-md inline-block w-fit border border-gray-100">
                      Уровень воды: <span className="text-blue-600">{req.waterLevel ?? 100}%</span>
                    </span>
                    {req.washBasin && (
                      <span className="text-[13px] font-semibold text-gray-600 bg-blue-50/50 px-2 py-1 rounded-md inline-block w-fit border border-blue-100/50">
                        ✨ Тщательно помыть бачок
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400">
                    {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString('ru-RU') : 'Только что'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {req.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'filling')}
                        className="bg-blue-50 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-100 flex items-center gap-1.5 text-sm font-semibold transition active:scale-95 border border-blue-100"
                        title="Начать наливать"
                      >
                        <PlayCircle size={18} /> Наливать
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(req.id, 'ignore')}
                        className="bg-gray-50 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center gap-1.5 text-sm font-semibold transition active:scale-95 border border-gray-100"
                        title="Игнорировать"
                      >
                        <XCircle size={18} /> Игнорировать
                      </button>
                    </>
                  )}
                  {req.status === 'filling' && (
                    <button 
                      onClick={() => handleUpdateStatus(req.id, 'filled')}
                      className="bg-green-50 text-green-600 px-3 py-2 rounded-xl hover:bg-green-100 flex items-center gap-1.5 text-sm font-semibold transition active:scale-95 border border-green-100"
                      title="Готово"
                    >
                      <CheckCircle size={18} /> Налито
                    </button>
                  )}
                  {req.status === 'ignore' && (
                    <button 
                      onClick={() => handleUpdateStatus(req.id, 'pending')}
                      className="bg-gray-50 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center gap-1.5 text-sm font-semibold transition active:scale-95 border border-gray-200"
                      title="Восстановить запрос"
                    >
                      Восстановить
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(req.id)}
                    className="text-red-400 p-2 ml-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors active:scale-95"
                    title="Удалить"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
            </ul>
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 flex items-center gap-1 text-sm font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 transition active:scale-95"
                >
                  <ChevronLeft size={18} /> Назад
                </button>
                <span className="text-sm font-medium text-gray-500">
                  {currentPage} из {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 flex items-center gap-1 text-sm font-semibold rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 transition active:scale-95"
                >
                  Вперед <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
