import { useEffect, useState } from 'react';
import type { Slot, Artist } from './types';
import { AdminPanel } from './components/AdminPanel';
import { SlotCard } from './components/SlotCard';
import { LoginPanel } from './components/LoginPanel';

function App() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));


  useEffect(() => {
    refreshAllData();
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('token');
      setToken(null);
  };

  const refreshAllData = async () => {
    try {
      const [slotsRes, artistsRes] = await Promise.all([
        fetch('http://localhost:3000/slots'),
        fetch('http://localhost:3000/artists')
      ]);
      
      const slotsData = await slotsRes.json();
      const artistsData = await artistsRes.json();
      
      setSlots(slotsData);
      setArtists(artistsData);
    } catch (error) {
      setMessage({ text: 'Erro ao carregar os dados do servidor.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
{token ? (
  <div className="mb-8">
    <div className="flex justify-end mb-2">
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          setToken(null);
        }} 
        className="text-red-600 font-bold hover:underline"
      >
        Sair do Sistema
      </button>
    </div>
    
    <AdminPanel 
      artists={artists} 
      refreshData={refreshAllData} 
      setMessage={setMessage} 
      token={token} 
    />
  </div>
) : (
  /* Se NÃO TEM o token, mostra a tela de Login para proteger a Área VIP */
  <div className="mb-8">
    <LoginPanel setToken={setToken} />
  </div>
)}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Agenda Disponível</h1>

          {message && (
            <div className={`p-4 mb-6 rounded-md font-medium text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-500">Carregando horários disponíveis...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => (
                <SlotCard 
                  key={slot.id} 
                  slot={slot} 
                  refreshSlots={refreshAllData} 
                  setMessage={setMessage} 
                />
              ))}
            </div>
          )}
        </div>
        

      </div>
    </div>
  );
}

export default App;