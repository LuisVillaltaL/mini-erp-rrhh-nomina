import { useState, useEffect } from 'react';
import { nominaService } from '../../services/nominaService';

export default function NominaLista({ onVerDetalle }) {
  const [nominas, setNominas] = useState([]);

  useEffect(() => {
    nominaService.listar().then(data => setNominas(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
          <tr>
            <th className="px-4 py-3">Periodo</th>
            <th className="px-4 py-3">Inicio</th>
            <th className="px-4 py-3">Fin</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Total Neto</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {nominas.map(n => (
            <tr key={n.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">{n.periodo}</td>
              <td className="px-4 py-3">{new Date(n.fecha_inicio).toLocaleDateString()}</td>
              <td className="px-4 py-3">{new Date(n.fecha_fin).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs ${n.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {n.estado}
                </span>
              </td>
              <td className="px-4 py-3 font-bold text-blue-600">Q {n.total_neto}</td>
              <td className="px-4 py-3">
                <button onClick={() => onVerDetalle(n.id)} className="text-indigo-600 hover:underline">Ver Detalle</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}