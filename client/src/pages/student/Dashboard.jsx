import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import TimeSlotModal from '../../components/TimeSlotModal'; 
import Calendar from '../../components/Calendar';
import { generateTimeSlots, formatDateForDisplay } from '../../utils/timeUtils'; // <--- Importar

export default function StudentDashboard() {
  const navigate = useNavigate();
  
  // Estados de Datos
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  // Estados del Formulario
  const [formData, setFormData] = useState({ doctorId: '', date: '', time: '', reason: '' });
  const [busySlots, setBusySlots] = useState([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // <--- NUEVO ESTADO

  const [showCalendar, setShowCalendar] = useState(false);
  
  useEffect(() => {
    loadInitialData();
  }, []);

// Carga de Disponibilidad (cuando cambia Doctor o Fecha)
  useEffect(() => {
    if (formData.doctorId && formData.date) {
      loadBusySlots();
    } else {
      setBusySlots([]); // Limpiar si no hay fecha seleccionada
    }
  }, [formData.doctorId, formData.date]);

  const loadInitialData = async () => {
    try {
      const [apptRes, docRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/users/doctors')
      ]);
      // Ordenar por fecha descendente (más recientes primero) para el historial
      const sortedAppts = apptRes.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAppointments(sortedAppts);
      setDoctors(docRes.data);
      
      if (docRes.data.length > 0) {
        setFormData(prev => ({ ...prev, doctorId: docRes.data[0]._id }));
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

const loadBusySlots = async () => {
    // Validación extra: No llamar si falta info
    if (!formData.doctorId || !formData.date) return;

    try {
      console.log(`🔍 Buscando disponibilidad para Dr ${formData.doctorId} en ${formData.date}...`);
      
      const { data } = await api.get('/appointments/busy-slots', {
        params: { doctorId: formData.doctorId, date: formData.date }
      });
      
      console.log("🔒 Horarios ocupados recibidos:", data); // <--- MIRA ESTO EN LA CONSOLA DEL NAVEGADOR
      setBusySlots(data);
    } catch (error) {
      console.error("Error cargando disponibilidad", error);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!formData.time) return alert('Debes seleccionar un horario');

    try {
      const fullDate = new Date(`${formData.date}T${formData.time}`);
      await api.post('/appointments', {
        doctorId: formData.doctorId,
        date: fullDate,
        reason: formData.reason
      });
      
      alert('Cita solicitada exitosamente');
      
      // Recargar
      const apptRes = await api.get('/appointments');
      setAppointments(apptRes.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setFormData(prev => ({ ...prev, reason: '', time: '' }));
      loadBusySlots();
      setShowHistory(false); // Volver a ver activas al crear una nueva
    } catch (error) {
      alert(error.response?.data?.message || 'Error al agendar');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('¿Seguro que deseas cancelar esta cita?')) return;
    try {
      await api.put(`/appointments/${id}/cancel`);
      const apptRes = await api.get('/appointments');
      setAppointments(apptRes.data);
      loadBusySlots();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  // --- FILTRADO DE CITAS ---
  const filteredAppointments = appointments.filter(appt => {
    const isPast = ['ATENDIDA', 'CANCELADA'].includes(appt.status);
    return showHistory ? isPast : !isPast;
  });

  if (loading) return <div className="text-center p-10">Cargando panel...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hola, {appointments[0]?.studentId?.profile?.fullName || 'Estudiante'}</h1>
          <p className="text-gray-500">Gestiona tus citas y expediente médico.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/student/results')} 
            className="btn-secondary flex items-center gap-2 border-[#E37222] text-[#E37222] hover:bg-[#E37222] hover:text-white"
          >
            <span>🩺</span> Ver Resultados
          </button>
          
          <button 
            onClick={() => navigate('/student/history')} 
            className="btn-secondary flex items-center gap-2"
          >
            <span>📋</span> Mi Historial
          </button>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO (Solo visible si no estamos en historial, o siempre visible) */}
        <div className="lg:col-span-1">
          <div className="card-sqew sticky top-24 border-t-4 border-black">
            <h3 className="font-bold text-xl mb-6">Nueva Cita</h3>
            <form onSubmit={handleBook} className="space-y-5">
              
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Médico</label>
                <select 
                  className="input-sqew mt-1"
                  value={formData.doctorId}
                  onChange={e => setFormData({...formData, doctorId: e.target.value, time: ''})}
                >
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>
                      {doc.profile.fullName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 2. Fecha (Custom Calendar Picker) */}
              <div className="relative">
                 <label className="text-xs font-bold uppercase text-gray-500 ml-1">Fecha</label>
                 
                 {/* Input Simulado (Botón) */}
                 <button
                   type="button"
                   onClick={() => setShowCalendar(!showCalendar)}
                   className={`w-full mt-1 p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all bg-white
                     ${showCalendar ? 'ring-2 ring-black border-transparent' : 'border-gray-200 hover:border-gray-400'}`}
                 >
                   <span className={`text-sm font-medium ${formData.date ? 'text-gray-900' : 'text-gray-400'}`}>
                     {/* USAMOS LA NUEVA FUNCIÓN AQUÍ vvv */}
                     {formData.date 
                       ? formatDateForDisplay(formData.date) 
                       : 'Seleccionar fecha...'}
                   </span>
                   <span className="text-gray-400">📅</span>
                 </button>

                 {/* Popover del Calendario */}
                 {showCalendar && (
                   <div className="absolute top-full left-0 mt-2 z-50">
                     <Calendar 
                       value={formData.date}
                       onChange={(date) => {
                         setFormData({...formData, date, time: ''}); // Guardar fecha y limpiar hora
                       }}
                       onClose={() => setShowCalendar(false)}
                     />
                   </div>
                 )}
                 
                 {/* Backdrop invisible para cerrar al hacer clic afuera (opcional simple) */}
                 {showCalendar && (
                   <div 
                     className="fixed inset-0 z-40" 
                     onClick={() => setShowCalendar(false)} 
                   />
                 )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 ml-1 mb-1 block">Hora</label>
                <button
                  type="button"
                  onClick={() => {
                    if(!formData.date) return alert('Selecciona una fecha primero');
                    setShowTimeModal(true);
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl border text-left flex justify-between items-center transition-all shadow-sm
                    ${formData.time 
                      ? 'bg-black text-white border-black ring-2 ring-black ring-offset-2' 
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                >
                  <span className="font-medium text-lg">
                    {formData.time || 'Seleccionar Horario'}
                  </span>
                  <span className="text-xl opacity-70">
                    {formData.time ? '✓' : '▼'}
                  </span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Motivo</label>
                <input 
                  type="text" 
                  placeholder="Ej. Dolor de cabeza"
                  className="input-sqew mt-1" 
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                  required 
                />
              </div>

              <button className="btn-primary w-full mt-2 shadow-xl shadow-gray-300/50">
                Confirmar Cita
              </button>
            </form>
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA DE CITAS */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6 ml-1">
            <h3 className="font-bold text-xl">
              {showHistory ? '📚 Historial de Citas' : '📅 Citas Próximas'}
            </h3>
            
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm font-bold text-gray-500 hover:text-black bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full transition-all shadow-sm"
            >
              {showHistory ? '← Ver Activas' : 'Ver Citas Pasadas →'}
            </button>
          </div>

          <div className="space-y-4">
            {filteredAppointments.length === 0 && (
              <div className="text-center py-12 bg-white rounded-4xl border border-dashed border-gray-200">
                <p className="text-gray-400">
                  {showHistory ? 'No tienes citas pasadas.' : 'No tienes citas activas.'}
                </p>
              </div>
            )}
            
            {filteredAppointments.map(appt => (
              <div key={appt._id} className={`card-sqew flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow group ${showHistory ? 'opacity-80 hover:opacity-100' : ''}`}>
                <div className="flex items-center gap-5 w-full">
                  {/* Fecha Badge */}
                  <div className={`p-4 rounded-2xl text-center min-w-[85px] transition-colors ${showHistory ? 'bg-gray-100' : 'bg-gray-50 group-hover:bg-gray-100'}`}>
                    <p className="font-bold text-2xl text-gray-900">{new Date(appt.date).getDate()}</p>
                    <p className="text-xs uppercase font-bold text-gray-400">{new Date(appt.date).toLocaleString('es-ES', { month: 'short' })}</p>
                  </div>
                  
                  {/* Info */}
                  <div className="grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg text-gray-900">{appt.doctorId?.profile?.fullName}</p>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                          <span>🕒 {new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>{appt.reason}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 min-w-max">
                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border
                    ${appt.status === 'CONFIRMADA' ? 'bg-green-50 text-green-700 border-green-100' : 
                      appt.status === 'PENDIENTE' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                      appt.status === 'ATENDIDA' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {appt.status}
                  </span>
                  
                  {appt.status === 'PENDIENTE' && !showHistory && (
                    <button 
                      onClick={() => handleCancel(appt._id)} 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition border border-transparent hover:border-red-100"
                      title="Cancelar Cita"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TimeSlotModal 
        isOpen={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSelect={(time) => setFormData({ ...formData, time })}
        busySlots={busySlots}
      />
    </div>
  );
}