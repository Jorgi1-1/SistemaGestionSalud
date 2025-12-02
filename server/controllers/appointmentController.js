const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification'); 
const AuditLog = require('../models/AuditLog');

// @desc    Crear Cita (Estudiante)
// @route   POST /api/appointments
const createAppointment = async (req, res) => {
  const { doctorId, date, reason } = req.body;
  const studentId = req.user._id;
  const appointmentDate = new Date(date);

  try {
    // 1. Regla: Máx. 1 cita activa por día por estudiante
    const startOfDay = new Date(appointmentDate.setHours(0,0,0,0));
    const endOfDay = new Date(appointmentDate.setHours(23,59,59,999));

    const existingAppt = await Appointment.findOne({
      studentId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['PENDIENTE', 'CONFIRMADA'] }
    });

    if (existingAppt) {
      return res.status(400).json({ message: 'Ya tienes una cita activa para este día.' });
    }

    // 2. Validar disponibilidad (Slot ocupado)
    const slotOccupied = await Appointment.findOne({
      doctorId,
      date: new Date(date), 
      status: { $ne: 'CANCELADA' }
    });

    if (slotOccupied) {
      return res.status(400).json({ message: 'Slot no disponible, por favor refresca la agenda.' });
    }

    // 3. Crear Cita
    const appointment = await Appointment.create({
      studentId,
      doctorId,
      date: new Date(date),
      reason,
      status: 'PENDIENTE'
    });

    // 4. Crear Notificación pendiente para el médico (aviso)
    await Notification.create({
      userId: doctorId,
      type: 'APPT_CONFIRM', // Aviso al médico para confirmar
      message: `Nueva solicitud de cita para ${date}`,
      scheduledFor: new Date() // Enviar ahora
    });

    // Log
    await AuditLog.create({ userId: studentId, action: 'CREATE_APPT', resource: appointment._id });

    res.status(201).json(appointment);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancelar Cita (Cumpliendo reglas del documento)
// @route   PUT /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) return res.status(404).json({ message: 'Cita no encontrada' });
    
    const isStudent = appointment.studentId.toString() === req.user._id.toString();
    const isDoctor = appointment.doctorId.toString() === req.user._id.toString();

    // 1. Seguridad: Verificar que quien cancela es dueño de la cita
    if (!isStudent && !isDoctor) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar esta cita.' });
    }

    // 2. Regla de Negocio: Cancelaciones hasta 12h antes
    // Esta regla se aplica estrictamente al estudiante.
    // Al médico se le permite cancelar en cualquier momento por emergencias (gestión de agenda).
    if (isStudent) {
        const now = new Date();
        const apptDate = new Date(appointment.date);
        const diffHours = (apptDate - now) / 36e5; // Diferencia en horas

        if (diffHours < 12) {
            return res.status(400).json({ 
                message: 'Política de cancelación: Solo permitido con 12 horas de antelación.' 
            });
        }
    }

    // 3. Ejecutar Cancelación
    appointment.status = 'CANCELADA';
    await appointment.save();

    // 4. Notificar a la contraparte
    // Si cancela Estudiante -> Notificar Médico
    // Si cancela Médico -> Notificar Estudiante
    const targetUserId = isStudent ? appointment.doctorId : appointment.studentId;
    const cancelerRole = isStudent ? 'el estudiante' : 'el médico';

    await Notification.create({
      userId: targetUserId,
      type: 'CANCELLATION',
      message: `La cita programada ha sido cancelada por ${cancelerRole}.`,
      scheduledFor: new Date(),
      metadata: { 
          appointmentId: appointment._id,
          date: appointment.date 
      }
    });

    res.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Médico confirma cita 
// @route   PUT /api/appointments/:id/confirm
const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    // Validar que sea el médico asignado
    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Esta cita no te corresponde' });
    }

    appointment.status = 'CONFIRMADA';
    await appointment.save();

    // Agendar recordatorios T-24h y T-2h para el estudiante 
    const apptDate = new Date(appointment.date);
    
    // Recordatorio 24h antes
    const reminder24 = new Date(apptDate);
    reminder24.setHours(reminder24.getHours() - 24);
    
    // Recordatorio 2h antes
    const reminder2 = new Date(apptDate);
    reminder2.setHours(reminder2.getHours() - 2);

    // Crear notificaciones en DB
    await Notification.create([
      {
        userId: appointment.studentId,
        type: 'APPT_REMINDER',
        message: 'Recordatorio: Tu cita es mañana',
        scheduledFor: reminder24,
        metadata: { appointmentId: appointment._id }
      },
      {
        userId: appointment.studentId,
        type: 'APPT_REMINDER',
        message: 'Recordatorio: Tu cita es en 2 horas',
        scheduledFor: reminder2,
        metadata: { appointmentId: appointment._id }
      }
    ]);

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ver citas (Filtro por usuario)
const getAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.studentId = req.user._id;
    if (req.user.role === 'doctor') query.doctorId = req.user._id;

    const appointments = await Appointment.find(query)
      .populate('studentId', 'profile.fullName')
      .populate('doctorId', 'profile.fullName');
      
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Bloquear un horario (Médico)
const blockSlot = async (req, res) => {
  const { date } = req.body; // Esperamos fecha y hora completa
  const doctorId = req.user._id;

  try {
    // Verificar si ya existe algo ahí
    const existing = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      status: { $ne: 'CANCELADA' }
    });

    if (existing) {
      return res.status(400).json({ message: 'Ya existe una cita o bloqueo en ese horario.' });
    }

    // Crear el bloqueo (Usamos el ID del médico como studentId temporal para cumplir el Schema)
    await Appointment.create({
      studentId: doctorId, 
      doctorId,
      date: new Date(date),
      reason: 'Horario Bloqueado por Médico',
      status: 'BLOQUEADO'
    });

    res.json({ message: 'Horario bloqueado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Desbloquear horario (Eliminar el bloqueo)
// @route DELETE /api/appointments/block/:id
const unblockSlot = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Bloqueo no encontrado' });
    }

    // Verificar que el bloqueo pertenezca al médico que lo quiere borrar
    if (appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Solo permitir borrar si el estado es BLOQUEADO (por seguridad)
    if (appointment.status !== 'BLOQUEADO') {
      return res.status(400).json({ message: 'Solo se pueden eliminar bloqueos de agenda, no citas reales.' });
    }

    await appointment.deleteOne(); // Borrado físico para liberar el slot
    res.json({ message: 'Horario desbloqueado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtener horarios ocupados
// @route   GET /api/appointments/busy-slots
const getBusySlots = async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    return res.status(400).json({ message: 'Doctor y Fecha requeridos' });
  }

  try {
    // 1. Construir rango de fechas LOCALES (Año, Mes, Día)
    // Esto evita que 'new Date(string)' lo interprete como UTC y lo mueva de día
    const [year, month, day] = date.split('-').map(Number);
    
    // Crear fecha inicio: 00:00:00 hora local
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
    
    // Crear fecha fin: 23:59:59 hora local
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

    console.log(`🔍 Buscando citas entre: ${startOfDay.toISOString()} y ${endOfDay.toISOString()}`);

    // 2. Buscar en BD
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'CANCELADA' } // Ignoramos canceladas
    });

    console.log(`✅ Se encontraron ${appointments.length} citas ocupadas.`);

    // 3. Formatear a "HH:mm"
    const busyTimes = appointments.map(appt => {
      const d = new Date(appt.date);
      
      // Forzamos "2 dígitos" para horas y minutos (ej. "09:00" en vez de "9:0")
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    });

    res.json(busyTimes);

  } catch (error) {
    console.error('Error en getBusySlots:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Bloquear un RANGO de horarios
// @route POST /api/appointments/block-range
const blockSlotRange = async (req, res) => {
  const { date, startTime, endTime } = req.body; // Ej: "09:00", "11:00"
  const doctorId = req.user._id;

  if (!date || !startTime || !endTime) {
    return res.status(400).json({ message: 'Faltan datos (fecha, inicio, fin)' });
  }

  try {
    // 1. Generar todos los slots posibles del día (08:00 a 20:00)
    // Usamos una función auxiliar simple aquí mismo
    const allSlots = [];
    for (let h = 8; h < 20; h++) {
      allSlots.push(`${h.toString().padStart(2, '0')}:00`);
      allSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // 2. Filtrar los slots que caen dentro del rango seleccionado
    // La lógica es: start <= slot < end (El fin es exclusivo, ej: hasta las 11:00 no incluye las 11:00)
    const slotsToBlock = allSlots.filter(slot => slot >= startTime && slot < endTime);

    if (slotsToBlock.length === 0) {
      return res.status(400).json({ message: 'El rango seleccionado no es válido.' });
    }

    // 3. Iterar y crear bloqueos
    let blockedCount = 0;
    const errors = [];

    for (const time of slotsToBlock) {
      // Verificar si ya existe cita o bloqueo
      const existing = await Appointment.findOne({
        doctorId,
        date: new Date(`${date}T${time}`),
        status: { $ne: 'CANCELADA' }
      });

      if (!existing) {
        await Appointment.create({
          studentId: doctorId, // Placeholder
          doctorId,
          date: new Date(`${date}T${time}`),
          reason: 'Bloqueo Administrativo',
          status: 'BLOQUEADO'
        });
        blockedCount++;
      } else {
        // Si ya hay una cita, la ignoramos (no sobrescribimos citas de alumnos)
        // Opcional: Podrías guardar cuáles fallaron
      }
    }

    res.json({ 
      message: `Se han bloqueado ${blockedCount} horarios exitosamente.`,
      skipped: slotsToBlock.length - blockedCount 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAppointment, cancelAppointment, confirmAppointment, getAppointments, blockSlot, unblockSlot, getBusySlots, blockSlotRange };