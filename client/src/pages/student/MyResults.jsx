import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function MyResults() {
  const navigate = useNavigate();
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      // 1. Obtener mi propio perfil para saber mi ID
      const { data: profile } = await api.get('/users/profile');
      
      // 2. Obtener mi expediente completo usando mi ID
      const { data: recordData } = await api.get(`/clinical/record/${profile._id}`);
      
      setEncounters(recordData.encounters);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando resultados", error);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando resultados...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/student/dashboard')} 
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition font-bold text-gray-600"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#154734]">Resultados de Consultas</h1>
            <p className="text-[#008E87] text-sm mt-1 font-medium">Historial de diagnósticos y tratamientos recibidos.</p>
          </div>
        </div>
      </div>

      {/* LISTA DE RESULTADOS */}
      <div className="grid gap-6">
        {encounters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-[#154734]/5 rounded-full flex items-center justify-center text-4xl mb-4">
              🩺
            </div>
            <h3 className="text-xl font-bold text-[#154734]">Sin resultados aún</h3>
            <p className="text-gray-400 max-w-sm mt-2">
              Cuando un médico atienda tus citas, aquí aparecerán tus diagnósticos y recetas.
            </p>
          </div>
        )}

        {encounters.map((encounter) => (
          <div key={encounter._id} className="card-sqew hover:shadow-lg hover:shadow-[#154734]/5 transition-all duration-300 relative overflow-hidden group">
            
            {/* Decoración lateral */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#E37222] group-hover:w-2 transition-all"></div>

            <div className="pl-4">
              {/* Encabezado de la Tarjeta */}
              <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs font-bold text-[#E37222] uppercase tracking-wider mb-1">
                    {new Date(encounter.createdAt).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <h3 className="text-xl font-bold text-[#154734]">
                    Dr. {encounter.doctorId?.profile?.fullName || 'Médico General'}
                  </h3>
                </div>
                <span className="bg-[#154734]/10 text-[#154734] px-3 py-1 rounded-lg text-xs font-bold">
                  Atendida
                </span>
              </div>

              {/* Contenido Médico */}
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Diagnóstico */}
                <div>
                  <h4 className="text-sm font-bold text-[#008E87] uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span>🔬</span> Diagnóstico
                  </h4>
                  <div className="space-y-2">
                    {encounter.diagnoses.map((diag, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="font-mono text-xs font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 mr-2">
                          {diag.code}
                        </span>
                        <span className="text-[#154734] font-medium text-sm">
                          {diag.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tratamiento */}
                <div>
                  <h4 className="text-sm font-bold text-[#008E87] uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span>💊</span> Plan y Receta
                  </h4>
                  <div className="bg-[#154734]/5 p-4 rounded-2xl border border-[#154734]/10">
                    <p className="text-sm text-[#1D2939] whitespace-pre-line leading-relaxed">
                      {encounter.clinicalNote?.treatmentPlan}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}