import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [clinicalNote, setClinicalNote] = useState({ treatmentPlan: '', diagnosisCode: '', diagnosisDesc: '' });
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadAgenda();
  }, []);

  const loadAgenda = async () => {
    try {
      const { data } = await api.get('/appointments');
      // Filtramos BLOQUEADO, esos van a Disponibilidad
      const validAppts = data.filter(appt => appt.status !== 'BLOQUEADO');
      setAppointments(validAppts);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const confirmAppt = async (id) => {
    try {
      await api.put(`/appointments/${id}/confirm`);
      loadAgenda();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al confirmar');
    }
  };

  // --- FUNCIÓN: Cancelar Cita (Médico) ---
  const handleCancelAppt = async (id) => {
    if (!confirm('¿Seguro que deseas CANCELAR esta cita? Se notificará al estudiante.')) return;
    try {
      await api.put(`/appointments/${id}/cancel`);
      loadAgenda(); 
    } catch (error) {
      alert(error.response?.data?.message || 'Error al cancelar');
    }
  };

  const submitEncounter = async (e) => {
    e.preventDefault();
    if (!clinicalNote.diagnosisCode || !clinicalNote.treatmentPlan) {
      return alert('Diagnóstico y Tratamiento son obligatorios');
    }

    try {
      await api.post('/clinical/encounter', {
        appointmentId: selectedAppt._id,
        clinicalNote: { treatmentPlan: clinicalNote.treatmentPlan },
        diagnoses: [{ code: clinicalNote.diagnosisCode, description: clinicalNote.diagnosisDesc }]
      });
      
      alert('Consulta finalizada correctamente.');
      setSelectedAppt(null);
      setClinicalNote({ treatmentPlan: '', diagnosisCode: '', diagnosisDesc: '' });
      loadAgenda();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar nota clínica');
    }
  };

  // Filtrado y Ordenamiento
  const filteredAppointments = appointments.filter(appt => {
    const isPast = ['ATENDIDA', 'CANCELADA'].includes(appt.status);
    return showHistory ? isPast : !isPast;
  });

  const displayedAppointments = [...filteredAppointments].sort((a, b) => {
    return showHistory 
      ? new Date(b.date) - new Date(a.date) // Pasadas: Descendente
      : new Date(a.date) - new Date(b.date); // Activas: Ascendente
  });

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando agenda...</div>;

  return (
    <div className="animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {showHistory ? 'Historial de Citas' : 'Agenda del Día'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {showHistory ? 'Consultas finalizadas y canceladas.' : 'Revisa y atiende a tus pacientes.'}
          </p>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={() => setShowHistory(!showHistory)}
                className="btn-secondary px-4! flex items-center gap-2"
            >
                {showHistory ? '← Ver Agenda Activa' : '📜 Ver Citas Pasadas'}
            </button>

            {!showHistory && (
                <button 
                    onClick={() => navigate('/doctor/availability')}
                    className="btn-secondary flex items-center gap-2 px-4! shadow-sm hover:shadow-md border-black text-black"
                >
                    <span className="text-lg">📅</span> Disponibilidad
                </button>
            )}
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* EMPTY STATE */}
        {displayedAppointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">
              {showHistory ? '📭' : '☕'}
            </div>
            <h3 className="text-xl font-bold text-gray-900">
                {showHistory ? 'Historial vacío' : 'Todo tranquilo por ahora'}
            </h3>
            <p className="text-gray-500 max-w-sm mt-2">
              {showHistory ? 'No hay registros de citas pasadas.' : 'No tienes citas activas. Gestiona tu disponibilidad o descansa.'}
            </p>
          </div>
        )}
        
        {/* LISTA DE CITAS */}
        {displayedAppointments.map(appt => (
          <div key={appt._id} className={`card-sqew flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 transition-all duration-300 ${showHistory ? 'opacity-80 hover:opacity-100 bg-gray-50' : 'hover:shadow-lg hover:shadow-gray-200/50'}`}>
            
            <div className="flex items-start gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0ow-lg ${showHistory ? 'bg-gray-200 text-gray-500 shadow-none' : 'bg-black text-white shadow-gray-200'}`}>
                {appt.studentId.profile?.fullName.charAt(0)}
              </div>
              
              <div>
                <h3 className="font-bold text-xl text-gray-900">{appt.studentId.profile?.fullName}</h3>
                <p className="text-gray-500 text-sm mb-3">Motivo: <span className="text-gray-900 font-medium">"{appt.reason}"</span></p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide bg-white border border-gray-200 text-gray-600 w-fit px-4 py-2 rounded-full">
                   🕒 {new Date(appt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(appt.date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-end">
              
              <button 
                onClick={() => navigate(`/doctor/patient/${appt.studentId._id}`)} 
                className="btn-secondary mb-0! mr-0! text-xs px-5! py-3!"
              >
                Ver Historial
              </button>

              {!showHistory && appt.status === 'PENDIENTE' && (
                <button 
                  onClick={() => confirmAppt(appt._id)} 
                  className="btn-primary mb-0! mr-0! px-6! py-3! flex items-center gap-2"
                >
                  Confirmar
                </button>
              )}
              
              {!showHistory && appt.status === 'CONFIRMADA' && (
                <button 
                  onClick={() => setSelectedAppt(appt)} 
                  className="btn-primary mb-0! mr-0! px-6! py-3! flex items-center gap-2"
                >
                  Atender
                </button>
              )}

              {/* Botón Cancelar (NUEVO) - Solo visible en agenda activa */}
              {!showHistory && (
                <button 
                  onClick={() => handleCancelAppt(appt._id)} 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition"
                  title="Cancelar Cita"
                >
                  ✕
                </button>
              )}

              {['ATENDIDA', 'CANCELADA'].includes(appt.status) && (
                <span className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border
                  ${appt.status === 'ATENDIDA' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-100'}`}>
                  {appt.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE ATENCIÓN */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl border border-gray-100 relative overflow-hidden">
            
            <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">Consulta Médica</h2>
                 <p className="text-sm text-gray-500 mt-1">Paciente: <span className="font-semibold text-gray-900">{selectedAppt.studentId.profile?.fullName}</span></p>
               </div>
               <button onClick={() => setSelectedAppt(null)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition font-bold text-gray-400 hover:text-gray-900">✕</button>
            </div>
            
            <form onSubmit={submitEncounter} className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1 mb-2 block">Código de consulta</label>
                  <input placeholder="Ej. J00" className="input-sqew" value={clinicalNote.diagnosisCode} onChange={e => setClinicalNote({...clinicalNote, diagnosisCode: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-1 mb-2 block">Diagnóstico</label>
                  <input placeholder="Ej. Rinofaringitis" className="input-sqew" value={clinicalNote.diagnosisDesc} onChange={e => setClinicalNote({...clinicalNote, diagnosisDesc: e.target.value})} required />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-1 mb-2 block">Plan de Tratamiento</label>
                <textarea placeholder="Tratamiento..." className="input-sqew h-40 resize-none" value={clinicalNote.treatmentPlan} onChange={e => setClinicalNote({...clinicalNote, treatmentPlan: e.target.value})} required />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setSelectedAppt(null)} className="btn-secondary mb-0!">Cancelar</button>
                <button type="submit" className="btn-primary mb-0!">Finalizar & Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}