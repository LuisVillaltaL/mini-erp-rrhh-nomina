import { useState } from 'react';
import { nominaService } from '../../services/nominaService';

export default function NominaFormulario({ onCreada }) {
  const [form, setForm] = useState({ periodo: '', fecha_inicio: '', fecha_fin: '' });

  const guardar = async (e) => {
    e.preventDefault();
    await nominaService.crear(form);
    onCreada();
  };

  return (
    <form onSubmit={guardar} className="bg-white p-6 border border-slate-200 rounded-xl max-w-md">
      <h3 className="text-lg font-bold mb-4">Nueva Nómina Mensual</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Periodo (Ej: 2026-05)</label>
          <input type="text" className="w-full border rounded-lg p-2" value={form.periodo} onChange={e => setForm({...form, periodo: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
          <input type="date" className="w-full border rounded-lg p-2" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha Fin</label>
          <input type="date" className="w-full border rounded-lg p-2" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} required />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded-lg font-bold">Crear Nómina</button>
      </div>
    </form>
  );
}