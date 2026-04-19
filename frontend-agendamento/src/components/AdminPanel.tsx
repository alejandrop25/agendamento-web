import { useState } from 'react';
import type { Artist } from '../types';

interface AdminPanelProps {
  artists: Artist[];
  refreshData: () => void;
  setMessage: (msg: { text: string; type: 'success' | 'error' } | null) => void;
}

export function AdminPanel({ artists, refreshData, setMessage }: AdminPanelProps) {
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  
  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistSpecialty, setNewArtistSpecialty] = useState('');

  const [newSlotArtistId, setNewSlotArtistId] = useState('');
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');

  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newArtistName, specialty: newArtistSpecialty }),
      });
      if (response.ok) {
        setMessage({ text: 'Artista adicionado com sucesso!', type: 'success' });
        refreshData();
        setShowArtistForm(false);
        setNewArtistName('');
        setNewArtistSpecialty('');
      }
    } catch (error) {
      setMessage({ text: 'Erro ao criar artista.', type: 'error' });
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = new Date(`${newSlotDate}T${newSlotStart}`).toISOString();
    const endTime = new Date(`${newSlotDate}T${newSlotEnd}`).toISOString();

    try {
      const response = await fetch('http://localhost:3000/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId: newSlotArtistId, startTime, endTime }),
      });
      if (response.ok) {
        setMessage({ text: 'Horário adicionado com sucesso!', type: 'success' });
        refreshData();
        setShowSlotForm(false);
        setNewSlotDate('');
        setNewSlotStart('');
        setNewSlotEnd('');
      }
    } catch (error) {
      setMessage({ text: 'Erro ao criar horário.', type: 'error' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">⚙️ Área Administrativa</h2>
      
      <div className="flex gap-4 mb-4">
        <button onClick={() => setShowArtistForm(!showArtistForm)} className="bg-indigo-600 text-white px-4 py-2 rounded font-semibold hover:bg-indigo-700">
          {showArtistForm ? 'Fechar Artista' : '+ Novo Artista'}
        </button>
        <button onClick={() => setShowSlotForm(!showSlotForm)} className="bg-emerald-600 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-700">
          {showSlotForm ? 'Fechar Horário' : '+ Novo Horário'}
        </button>
      </div>

      {showArtistForm && (
        <form onSubmit={handleCreateArtist} className="bg-gray-50 p-4 rounded border mb-4 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Nome do Artista</label>
            <input required type="text" className="w-full p-2 border rounded" value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Especialização</label>
            <input required type="text" placeholder="Ex: Realismo" className="w-full p-2 border rounded" value={newArtistSpecialty} onChange={(e) => setNewArtistSpecialty(e.target.value)} />
          </div>
          <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded font-semibold hover:bg-black">Salvar</button>
        </form>
      )}

      {showSlotForm && (
        <form onSubmit={handleCreateSlot} className="bg-gray-50 p-4 rounded border mb-4 grid grid-cols-5 gap-4 items-end">
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Selecione o Artista</label>
            <select required className="w-full p-2 border rounded bg-white" value={newSlotArtistId} onChange={(e) => setNewSlotArtistId(e.target.value)}>
              <option value="">-- Escolha --</option>
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Dia</label>
            <input required type="date" className="w-full p-2 border rounded" value={newSlotDate} onChange={(e) => setNewSlotDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Início / Fim</label>
            <div className="flex gap-1">
              <input required type="time" className="w-full p-2 border rounded" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} />
              <input required type="time" className="w-full p-2 border rounded" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded font-semibold hover:bg-black h-[42px]">Salvar</button>
        </form>
      )}
    </div>
  );
}
