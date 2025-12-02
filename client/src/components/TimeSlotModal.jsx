import { generateTimeSlots } from '../utils/timeUtils';

export default function TimeSlotModal({ isOpen, onClose, onSelect, busySlots = [] }) {
  if (!isOpen) return null;

  // Generamos todos los slots del día (ej. 08:00, 08:30...)
  const allSlots = generateTimeSlots(8, 20); 

  return (
    <div className="fixed inset-0 bg-[#154734]/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 border border-white ring-1 ring-[#154734]/5 relative">
        
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[#154734]">Selecciona un Horario</h3>
            <p className="text-sm text-[#008E87] mt-1 font-medium">Los horarios en gris no están disponibles.</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-[#E37222] hover:text-white transition font-bold text-[#154734] shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Grilla de Horarios */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
          {allSlots.map((slot) => {
            // --- LÓGICA DE COMPARACIÓN ---
            const isBusy = busySlots.includes(slot);

            return (
              <button
                key={slot}
                disabled={isBusy}
                onClick={() => {
                  onSelect(slot);
                  onClose();
                }}
                className={`py-3.5 px-2 rounded-2xl text-sm font-bold transition-all duration-200 border
                  ${isBusy 
                    ? 'bg-gray-50 text-gray-300 border-transparent cursor-not-allowed' // Estilo OCUPADO
                    : 'bg-white text-[#154734] border-gray-200 hover:border-[#E37222] hover:bg-[#E37222] hover:text-white hover:shadow-lg hover:shadow-orange-200 hover:scale-105' // Estilo DISPONIBLE (Interacción de Marca)
                  }`}
              >
                {slot}
                {isBusy && <span className="block text-[10px] font-medium text-red-200 mt-0.5">Ocupado</span>}
              </button>
            );
          })}
        </div>
        
        {/* Pie de página sutil */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button onClick={onClose} className="text-xs font-bold text-[#8E7953] hover:text-[#E37222] tracking-widest uppercase transition-colors">
                Cancelar
            </button>
        </div>
      </div>
    </div>
  );
}