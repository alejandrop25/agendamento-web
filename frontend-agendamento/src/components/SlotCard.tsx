import { useState } from "react";
import type { Slot } from '../types';


interface SlotCardProps {
    slot: Slot;
    refreshSlots: () => void;
    setMessage: (msg: { text: string; type: 'success' | 'error' } | null) => void;
}

export function SlotCard({ slot, refreshSlots, setMessage }: SlotCardProps) {
  const [isReserving, setIsReserving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id, clientName, clientEmail }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ text: 'Reserva confirmada com sucesso! 🎉', type: 'success' });
        setIsReserving(false);
        refreshSlots();
      } else {
        setMessage({ text: data.error, type: 'error' });
        refreshSlots(); 
      }
    } catch (error) {
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(`http://localhost:3000/cancel/${slot.id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage({ text: 'Reserva cancelada e horário liberado! 🔄', type: 'success' });
        refreshSlots();
      }
    } catch (error) {
      setMessage({ text: 'Erro ao cancelar a reserva.', type: 'error' });
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <p className="font-bold text-lg text-gray-800">{slot.artist.name}</p>
      <p className="text-sm text-gray-500 mb-2">{slot.artist.specialty}</p>
      <p className="text-gray-700">📅 {formatDate(slot.startTime)}</p>
      <p className="text-gray-700 mb-4">⏰ {formatTime(slot.startTime)} - {formatTime(slot.endTime)}</p>
      
      {slot.isBooked ? (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
          <p className="text-red-600 font-semibold mb-2">❌ Horário Ocupado</p>
          <button onClick={handleCancel} className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 transition-colors">
            Cancelar Reserva
          </button>
        </div>
      ) : isReserving ? (
        <form onSubmit={handleReserve} className="mt-4 bg-gray-50 p-4 rounded-md border">
          <input type="text" required placeholder="Seu Nome" className="w-full mb-2 p-2 border rounded" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          <input type="email" required placeholder="Seu E-mail" className="w-full mb-3 p-2 border rounded" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">Confirmar</button>
            <button type="button" onClick={() => setIsReserving(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded font-semibold">Voltar</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setIsReserving(true)} className="w-full mt-4 bg-gray-800 text-white py-2 rounded font-semibold hover:bg-black transition-colors">
          Reservar este horário
        </button>
      )}
    </div>
  );
}