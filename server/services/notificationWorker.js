const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// ---------------------------------------------------------
// JOB 1: GENERADOR (Scheduler)
// Busca citas y crea las notificaciones en BD (Estado: PENDING)
// ---------------------------------------------------------
const scheduleNotifications = () => {
  // Ejecuta cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    const now = new Date();
    console.log('⏰ [Scheduler] Buscando recordatorios pendientes...');
    
    // Ventanas de tiempo (T-24h y T-2h)
    // Buscamos citas entre (Ahora + 24h) y (Ahora + 24h + 10min) para no duplicar
    const target24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const window24h = new Date(target24h.getTime() + 10 * 60 * 1000);
    
    const target2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const window2h = new Date(target2h.getTime() + 10 * 60 * 1000);

    const upcomingAppointments = await Appointment.find({
      status: 'CONFIRMADA',
      $or: [
        { date: { $gte: target24h, $lt: window24h } }, // Ventana 24h
        { date: { $gte: target2h, $lt: window2h } }    // Ventana 2h
      ]
    }).populate('studentId');

    for (const appt of upcomingAppointments) {
      // Evitar duplicados: Ver si ya existe notificación para esta cita hoy
      const exists = await Notification.findOne({
        'metadata.appointmentId': appt._id,
        type: 'APPT_REMINDER',
        createdAt: { $gte: new Date(now.setHours(0,0,0,0)) } // Creada hoy
      });

      if (!exists && appt.studentId) {
        await Notification.create({
          userId: appt.studentId._id,
          type: 'APPT_REMINDER',
          message: 'Recordatorio automático',
          scheduledFor: new Date(),
          metadata: { appointmentId: appt._id, date: appt.date }
        });
        console.log(`➕ Notificación encolada para ${appt.studentId.email}`);
      }
    }
  });
};

// ---------------------------------------------------------
// JOB 2: PROCESADOR (Sender con Backoff & DLQ)
// Revisa la cola y envía los correos reales
// ---------------------------------------------------------
const processQueue = () => {
  // Ejecuta CADA MINUTO
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    
    // Buscar: Pendientes O Fallidos cuyo tiempo de reintento ya pasó
    const queue = await Notification.find({
      status: { $in: ['PENDING', 'FAILED'] },
      $or: [
        { nextRetry: { $lte: now } },      // Es hora de reintentar
        { nextRetry: { $exists: false } }  // O es el primer intento
      ]
    }).populate('userId').limit(50); // Procesar por lotes de 50

    if (queue.length > 0) console.log(`⚙️ [Processor] Procesando ${queue.length} correos...`);

    for (const notif of queue) {
      try {
        if (!notif.userId || !notif.userId.email) {
          throw new Error('Usuario sin email o eliminado');
        }

        // Intentar Enviar
        await sendEmail(notif.userId.email, notif.type, {
          name: notif.userId.profile.fullName,
          date: notif.metadata?.date || new Date(),
          link: process.env.CLIENT_URL
        });

        // Éxito
        notif.status = 'SENT';
        notif.sentAt = new Date();
        await notif.save();

      } catch (error) {
        // Manejo de Errores y Backoff
        notif.attempts += 1;
        
        // Límite de 3 intentos -> DLQ
        if (notif.attempts >= 3) {
          notif.status = 'DLQ'; // Dead Letter Queue
          notif.errorMsg = error.message;
          console.error(`Notificación ${notif._id} movida a DLQ. Razón: ${error.message}`);
        } else {
          // Reintentar después (Backoff Exponencial simulado)
          notif.status = 'FAILED';
          
          let delayMinutes = 1;
          if (notif.attempts === 2) delayMinutes = 15; // 2do intento: espera 15 min
          if (notif.attempts === 3) delayMinutes = 1440; // 3er intento (si hubiera): 1 día
          
          notif.nextRetry = new Date(now.getTime() + delayMinutes * 60000);
          console.warn(`⚠️ Fallo intento ${notif.attempts}. Reintentando en ${delayMinutes} min.`);
        }
        await notif.save();
      }
    }
  });
};

module.exports = { init: () => { scheduleNotifications(); processQueue(); } };