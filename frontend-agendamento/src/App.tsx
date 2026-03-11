import { useEffect, useState } from 'react';

interface Artist {
  id: string;
  name: string;
  specialty: string;
}

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  artist: Artist;
}

function App() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await fetch('http://localhost:3000/slots');
      const data = await response.json();
      setSlots(data);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      setMessage({ text: 'Erro ao carregar a agenda. O servidor está rodando?', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!selectedSlotId) return;

    try {
      const response = await fetch('http://localhost:3000/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlotId,
          clientName,
          clientEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Reserva confirmada com sucesso! 🎉', type: 'success' });
        setSlots(slots.filter((slot) => slot.id !== selectedSlotId));
        // Limpa o formulário
        setSelectedSlotId(null);
        setClientName('');
        setClientEmail('');
      } else {
        setMessage({ text: data.error || 'Erro ao realizar reserva.', type: 'error' });
        fetchSlots(); 
      }
    } catch (error) {
      setMessage({ text: 'Erro de conexão com o servidor.', type: 'error' });
    }
  };

  const handleCancel = async (slotId: string) => {
    try {
      const response = await fetch(`http://localhost:3333/cancel/${slotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ text: 'Reserva cancelada e horário liberado! 🔄', type: 'success' });
        fetchSlots(); 
      } else {
        setMessage({ text: 'Erro ao cancelar a reserva.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Erro de conexão com o servidor.', type: 'error' });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Estúdio de Tatuagem - Agendamento
        </h1>

        {/* Exibe mensagens de sucesso ou erro */}
        {message && (
          <div className={`p-4 mb-6 rounded-md font-medium text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Carregando horários disponíveis...</p>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Horários Livres</h2>
            
            {slots.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum horário disponível no momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.map((slot) => (
                  <div key={slot.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <p className="font-bold text-lg text-gray-800">{slot.artist.name}</p>
                    <p className="text-sm text-gray-500 mb-2">{slot.artist.specialty}</p>
                    <p className="text-gray-700">
                      📅 {formatDate(slot.startTime)}
                    </p>
                    <p className="text-gray-700 mb-4">
                      ⏰ {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </p>
                    {/* Renderização Condicional Inteligente */}
                    {slot.isBooked ? (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
                        <p className="text-red-600 font-semibold mb-2">❌ Horário Ocupado</p>
                        <button
                          onClick={() => handleCancel(slot.id)}
                          className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 transition-colors"
                        >
                          Cancelar Reserva
                        </button>
                      </div>
                    ) : selectedSlotId === slot.id ? (
                      <form onSubmit={handleReserve} className="mt-4 bg-gray-50 p-4 rounded-md border">
                        {/* ... (mantenha os seus inputs de Nome e Email e os botões Confirmar/Cancelar iguais) ... */}
                        <input
                          type="text"
                          required
                          placeholder="Seu Nome"
                          className="w-full mb-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                        <input
                          type="email"
                          required
                          placeholder="Seu E-mail"
                          className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">
                            Confirmar
                          </button>
                          <button type="button" onClick={() => setSelectedSlotId(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-semibold hover:bg-gray-400">
                            Voltar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setSelectedSlotId(slot.id)}
                        className="w-full mt-4 bg-gray-800 text-white py-2 rounded font-semibold hover:bg-black transition-colors"
                      >
                        Reservar este horário
                      </button>
                    )}
                    {/* Botão para abrir o formulário */}
                    {selectedSlotId === slot.id ? (
                      <form onSubmit={handleReserve} className="mt-4 bg-gray-50 p-4 rounded-md border">
                        <input
                          type="text"
                          required
                          placeholder="Seu Nome"
                          className="w-full mb-2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                        <input
                          type="email"
                          required
                          placeholder="Seu E-mail"
                          className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">
                            Confirmar
                          </button>
                          <button type="button" onClick={() => setSelectedSlotId(null)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-semibold hover:bg-gray-400">
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setSelectedSlotId(slot.id)}
                        className="w-full bg-gray-800 text-white py-2 rounded font-semibold hover:bg-black transition-colors"
                      >
                        Reservar este horário
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;