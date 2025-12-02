import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function PatientRecord() {
  const { id } = useParams(); // Obtenemos el ID del estudiante de la URL
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get(`/clinical/record/${id}`);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        alert('No se pudo cargar el expediente');
        navigate('/doctor/dashboard');
      }
    };
    loadData();
  }, [id, navigate]);

  if (loading) return <div className="p-6">Cargando expediente...</div>;

  const { record, encounters } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/doctor/dashboard')} className="text-blue-600 mb-4 hover:underline">
        &larr; Volver a la Agenda
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Resumen Médico (Solo Lectura) */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border-t-4 border-red-500">
            <h3 className="font-bold text-lg mb-3 text-red-800">⚠️ Alergias</h3>
            {record.allergies.length > 0 ? (
              <ul className="list-disc pl-5 text-red-700">
                {record.allergies.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            ) : <p className="text-gray-500 italic">Sin alergias registradas</p>}
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
            <h3 className="font-bold text-lg mb-3 text-blue-800">🏥 Condiciones</h3>
            {record.medicalConditions.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-700">
                {record.medicalConditions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            ) : <p className="text-gray-500 italic">Ninguna registrada</p>}
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
            <h3 className="font-bold text-lg mb-3 text-green-800">💉 Vacunas</h3>
            {record.vaccines.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {record.vaccines.map((a, i) => (
                  <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    {a}
                  </span>
                ))}
              </div>
            ) : <p className="text-gray-500 italic">Sin registro</p>}
          </div>
        </div>

        {/* COLUMNA DERECHA: Historial de Consultas (Encounters) */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Historial de Consultas</h2>
          
          <div className="space-y-4">
            {encounters.length === 0 && (
              <div className="bg-gray-50 p-8 rounded text-center text-gray-500">
                Este paciente no tiene consultas previas registradas en el sistema.
              </div>
            )}

            {encounters.map(encounter => (
              <div key={encounter._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                <div className="flex justify-between items-start border-b pb-2 mb-3">
                  <div>
                    <p className="font-bold text-lg text-blue-900">
                      {new Date(encounter.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">Dr. {encounter.doctorId?.profile?.fullName}</p>
                  </div>
                  {encounter.prescriptionUrl && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Receta Generada</span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-sm text-gray-500">Diagnóstico Principal</p>
                    <ul className="list-disc pl-5 text-gray-800">
                      {encounter.diagnoses.map((d, i) => (
                        <li key={i}><span className="font-mono text-xs bg-gray-200 px-1 rounded">{d.code}</span> {d.description}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-500">Plan de Tratamiento</p>
                    <p className="text-gray-800 whitespace-pre-line">{encounter.clinicalNote?.treatmentPlan}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}