import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { generateTimeSlots, formatDateForDisplay } from '../../utils/timeUtils'; // Importación unificada
import Calendar from '../../components/Calendar';

export default function Availability() {
  const navigate = useNavigate();
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado del formulario
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '' });
  
  // Estado para mostrar el Calendario
  const [showCalendar, setShowCalendar] = useState(false);
  
  const timeSlots = generateTimeSlots(8, 20);

  useEffect(() => { loadBlockedSlots(); }, []);

  const loadBlockedSlots = async () => {
    try {
      const { data } = await api.get('/appointments');
      const blocked = data.filter(a => a.status === 'BLOQUEADO');
      setBlockedSlots(blocked.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) { console.error(error); }
  };

  const handleBlockRange = async (e) => {
    e.preventDefault();
    if (!form.date) return alert('Selecciona una fecha');
    if (form.startTime >= form.endTime) {
      return alert('La hora de inicio debe ser anterior a la hora de fin.');
    }

    setLoading(true);
    try {
      await api.post('/appointments/block-range', { 
        date: form.date, 
        startTime: form.startTime, 
        endTime: form.endTime 
      });
      
      alert('Horarios bloqueados correctamente.');
      setForm({ date: '', startTime: '', endTime: '' });
      loadBlockedSlots();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al bloquear');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockGroup = async (group) => {
    const isMultiple = group.length > 1;
    const msg = isMultiple 
      ? `¿Desbloquear este periodo completo (${group.length} intervalos)?` 
      : '¿Desbloquear este horario?';

    if (!confirm(msg)) return;

    try {
      await Promise.all(group.map(slot => api.delete(`/appointments/block/${slot._id}`)));
      loadBlockedSlots();
    } catch (error) { 
      alert(error.response?.data?.message || 'Error al desbloquear'); 
    }
  };

  // Agrupador Visual
  const getGroupedSlots = () => {
    if (blockedSlots.length === 0) return [];
    const groups = [];
    let currentGroup = [blockedSlots[0]];

    for (let i = 1; i < blockedSlots.length; i++) {
      const prevSlot = currentGroup[currentGroup.length - 1];
      const currSlot = blockedSlots[i];
      const prevDate = new Date(prevSlot.date);
      const currDate = new Date(currSlot.date);
      const diffMinutes = (currDate - prevDate) / (1000 * 60);

      if (diffMinutes === 30) {
        currentGroup.push(currSlot);
      } else {
        groups.push(currentGroup);
        currentGroup = [currSlot];
      }
    }
    groups.push(currentGroup);
    return groups;
  };

  const groupedSlots = getGroupedSlots();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/doctor/dashboard')} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition font-bold text-gray-600">
          ←
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Disponibilidad</h1>
          <p className="text-gray-500">Bloquea periodos de tiempo en tu agenda.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* TARJETA IZQUIERDA: BLOQUEAR POR RANGO */}
        <div className="card-sqew h-fit sticky top-24 border-t-4 border-black z-30">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <span>⏱️</span> Bloquear Periodo
          </h3>
          
          <form onSubmit={handleBlockRange} className="space-y-5">
            
            {/* 1. Selector de Fecha (Custom Calendar) */}
            <div className="relative">
               <label className="text-xs font-bold uppercase text-gray-500 ml-1">Fecha</label>
               
               <button
                   type="button"
                   onClick={() => setShowCalendar(!showCalendar)}
                   className={`w-full mt-1 p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all bg-white
                     ${showCalendar ? 'ring-2 ring-black border-transparent' : 'border-gray-200 hover:border-gray-400'}`}
                 >
                   <span className={`text-sm font-medium ${form.date ? 'text-gray-900' : 'text-gray-400'}`}>
                     {form.date 
                       ? formatDateForDisplay(form.date) 
                       : 'Seleccionar fecha...'}
                   </span>
                   <span className="text-gray-400">📅</span>
                 </button>

               {/* Popover Calendario */}
               {showCalendar && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)}></div>
                   <div className="absolute top-full left-0 mt-2 z-50 w-full sm:w-auto">
                     <Calendar 
                       value={form.date}
                       onChange={(date) => setForm({...form, date})}
                       onClose={() => setShowCalendar(false)}
                     />
                   </div>
                 </>
               )}
            </div>
            
            {/* 2. Selectores de Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Desde</label>
                <select 
                  className="input-sqew mt-1"
                  value={form.startTime}
                  onChange={e => setForm({...form, startTime: e.target.value})}
                  required
                >
                  <option value="">Inicio</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Hasta</label>
                <select 
                  className="input-sqew mt-1"
                  value={form.endTime}
                  onChange={e => setForm({...form, endTime: e.target.value})}
                  required
                >
                  <option value="">Fin</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Mensaje Informativo */}
            {form.startTime && form.endTime && form.startTime < form.endTime && (
               <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                 Se bloquearán <b>{Math.ceil((new Date(`2000-01-01T${form.endTime}`) - new Date(`2000-01-01T${form.startTime}`)) / (1000 * 60 * 30))}</b> intervalos de 30 min.
               </div>
            )}

            <button disabled={loading} className="btn-primary w-full shadow-lg shadow-gray-300">
              {loading ? 'Procesando...' : 'Bloquear Horarios'}
            </button>
          </form>
        </div>

        {/* TARJETA DERECHA: LISTA AGRUPADA */}
        <div>
          <h3 className="font-bold text-xl mb-6 ml-2">Agenda Bloqueada</h3>
          
          <div className="space-y-4">
            {groupedSlots.length === 0 && (
              <div className="text-center p-10 bg-white rounded-4xl border border-dashed border-gray-200">
                <p className="text-gray-400">Tu agenda está completamente abierta.</p>
              </div>
            )}
            
            {groupedSlots.map((group, index) => {
              const firstSlot = group[0];
              const lastSlot = group[group.length - 1];
              
              const endDate = new Date(lastSlot.date);
              endDate.setMinutes(endDate.getMinutes() + 30);

              const currentDateStr = new Date(firstSlot.date).toLocaleDateString();
              const prevGroup = index > 0 ? groupedSlots[index-1] : null;
              const prevDateStr = prevGroup ? new Date(prevGroup[0].date).toLocaleDateString() : null;
              const showHeader = currentDateStr !== prevDateStr;

              return (
                <div key={index}>
                  {showHeader && (
                    <h4 className="text-xs font-bold uppercase text-gray-400 mt-6 mb-3 ml-2 tracking-wider sticky top-0 bg-[#F2F4F7] py-2 z-10 backdrop-blur-sm">
                      {new Date(firstSlot.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h4>
                  )}
                  
                  <div className="bg-white px-5 py-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-red-200 hover:shadow-md transition group relative overflow-hidden">
                    
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-400"></div>

                    <div className="ml-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-lg font-mono tracking-tight">
                          {new Date(firstSlot.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          <span className="text-gray-300 mx-2">—</span>
                          {endDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-medium">
                        {group.length} intervalo{group.length > 1 ? 's' : ''} bloqueados
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleUnblockGroup(group)}
                      className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl p-2.5 transition"
                      title="Desbloquear periodo"
                    >
                      <span className="font-bold text-xs uppercase tracking-wide">Desbloquear</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}