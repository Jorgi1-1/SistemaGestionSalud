export const generateTimeSlots = (startHour = 8, endHour = 20) => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    // Formato HH:00
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    // Formato HH:30
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

// ... (tu función generateTimeSlots existente)

// NUEVA FUNCIÓN: Formatear fecha sin restar días por timezone
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  
  // Dividimos "2025-11-26" en partes [2025, 11, 26]
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Creamos la fecha usando el constructor local (año, mes-1, día)
  // Esto asegura que 26 sea 26 en tu reloj local, no en Londres
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};