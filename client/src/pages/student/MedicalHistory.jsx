import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function MedicalHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    allergies: '',
    medicalConditions: '',
    vaccines: ''
  });

  useEffect(() => {
    loadRecord();
  }, []);

  const loadRecord = async () => {
    try {
      const userProfile = await api.get('/users/profile');
      const { data } = await api.get(`/clinical/record/${userProfile.data._id}`);
      
      setFormData({
        allergies: data.record.allergies.join(', '),
        medicalConditions: data.record.medicalConditions.join(', '),
        vaccines: data.record.vaccines.join(', ')
      });
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // --- FUNCIÓN AUXILIAR PARA CAPITALIZAR ---
  const formatText = (str) => {
    if (!str) return '';
    const trimmed = str.trim();
    // Primera letra mayúscula + resto del texto
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Aplicamos la función formatText a cada elemento del array
      const payload = {
        allergies: formData.allergies
          .split(',')
          .map(formatText) // <--- Aquí ocurre la magia
          .filter(s => s), // Eliminar vacíos
        
        medicalConditions: formData.medicalConditions
          .split(',')
          .map(formatText)
          .filter(s => s),

        vaccines: formData.vaccines
          .split(',')
          .map(formatText)
          .filter(s => s)
      };

      await api.put('/clinical/my-record', payload);
      alert('Historial actualizado correctamente');
      navigate('/student/dashboard'); 
    } catch (error) {
      alert('Error al actualizar');
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando expediente...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/student/dashboard')} 
          className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition font-bold text-gray-600"
        >
          ←
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Expediente Médico</h1>
          <p className="text-gray-500 text-sm">Información clínica para tus médicos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-sqew space-y-6 border-t-4 border-black">
        
        <div>
          <label className="text-xs font-bold uppercase text-gray-500 ml-1 mb-2 block">Alergias</label>
          <textarea 
            className="input-sqew resize-none"
            rows="2"
            value={formData.allergies}
            onChange={e => setFormData({...formData, allergies: e.target.value})}
            placeholder="Separa con comas (ej. penicilina, nueces)"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-gray-500 ml-1 mb-2 block">Condiciones Médicas</label>
          <textarea 
            className="input-sqew resize-none"
            rows="2"
            value={formData.medicalConditions}
            onChange={e => setFormData({...formData, medicalConditions: e.target.value})}
            placeholder="Ej. asma, diabetes"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-gray-500 ml-1 mb-2 block">Vacunas Recientes</label>
          <textarea 
            className="input-sqew resize-none"
            rows="2"
            value={formData.vaccines}
            onChange={e => setFormData({...formData, vaccines: e.target.value})}
            placeholder="Ej. influenza 2024"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="btn-primary shadow-lg shadow-gray-300">
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}