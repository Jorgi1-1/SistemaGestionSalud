import { useEffect, useRef } from 'react';

export default function TimeSpinner({ slots, selectedTime, onSelect }) {
  const containerRef = useRef(null);

  // Efecto: Cuando cambia la selección externa, scrollear suavemente hacia ese elemento
  useEffect(() => {
    if (selectedTime && containerRef.current) {
      const selectedEl = document.getElementById(`time-slot-${selectedTime}`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedTime]);

  return (
    <div className="relative h-48 w-full max-w-[200px] mx-auto">
      {/* Gradiente Superior (Efecto desvanecimiento) */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-linear-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />

      {/* Indicador de Selección (Líneas centrales) */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-10 border-t border-b border-gray-200 pointer-events-none z-0 bg-gray-50/50" />

      {/* Contenedor con Scroll Snap */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide py-[calc(50%-1.25rem)]" // Padding para centrar el primero y último
        style={{ scrollBehavior: 'smooth' }}
      >
        {slots.map((slot) => {
          const isSelected = selectedTime === slot;
          
          return (
            <div
              key={slot}
              id={`time-slot-${slot}`}
              onClick={() => onSelect(slot)}
              className={`snap-center h-10 flex items-center justify-center cursor-pointer transition-all duration-300 transform
                ${isSelected 
                  ? 'text-xl font-bold text-black scale-110 z-20' 
                  : 'text-sm text-gray-400 hover:text-gray-600'
                }`}
            >
              {slot}
            </div>
          );
        })}
      </div>

      {/* Gradiente Inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
      
      {/* Estilo para ocultar scrollbar nativa */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}