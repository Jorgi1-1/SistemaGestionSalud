import { useState, useEffect } from 'react';

export default function Calendar({ value, onChange, onClose }) {
  // Inicializar con la fecha seleccionada o la actual, forzando interpretación local
  const [currentDate, setCurrentDate] = useState(value ? new Date(value + 'T12:00:00') : new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysOfWeek = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Lógica para obtener los días del mes
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; // Ajuste para que la semana empiece en Lunes
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Navegación
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Manejador de selección
  const handleDayClick = (day) => {
    // Construcción manual del string para evitar problemas de zona horaria
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const dateString = `${y}-${m}-${d}`;
    
    onChange(dateString);
    if (onClose) onClose();
  };

  return (
    <div className="bg-white p-6 rounded-4xl shadow-2xl border border-gray-100 w-full max-w-[320px] animate-fade-in select-none ring-1 ring-[#154734]/10">
      
      {/* Header: Mes Año y Flechas */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-[#154734] capitalize">
          {monthNames[month]} <span className="text-[#8E7953] font-medium">{year}</span>
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth} 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#154734] transition font-bold"
          >
            ‹
          </button>
          <button 
            onClick={nextMonth} 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-[#154734] transition font-bold"
          >
            ›
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map(d => (
          <div key={d} className="text-center text-xs font-bold text-[#008E87] h-8 flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de Días */}
      <div className="grid grid-cols-7 gap-1">
        {/* Espacios vacíos antes del día 1 */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Días del mes */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          
          // Construimos string para comparar visualmente
          const currentStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isSelected = value === currentStr;
          
          // Opcional: Validar días pasados
          const today = new Date();
          today.setHours(0,0,0,0);
          const checkDate = new Date(year, month, day);
          const isPast = checkDate < today;

          return (
            <button
              key={day}
              type="button"
              // disabled={isPast} // Descomenta si quieres bloquear fechas pasadas
              onClick={() => handleDayClick(day)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200
                ${isSelected 
                  ? 'bg-[#E37222] text-white shadow-lg shadow-orange-200 scale-110 font-bold' // Selección Naranja Institucional
                  : isPast 
                    ? 'text-gray-300' 
                    : 'text-[#154734] hover:bg-[#E37222]/10 hover:text-[#E37222]'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}