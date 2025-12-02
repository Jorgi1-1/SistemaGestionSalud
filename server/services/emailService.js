// Simulación robusta para desarrollo
// Si configuras MAILERSEND_API_KEY en .env, intentará usarlo real.

const sendTestEmail = async (to, subject, text) => {
  console.log(`\n📨 --- INTENTO DE ENVÍO DE CORREO ---`);
  console.log(`Para: ${to}`);
  console.log(`Asunto: ${subject}`);
  console.log(`Cuerpo: ${text}`);
  
  // Aquí iría la lógica real de Mailersend/Nodemailer
  // Por ahora simulamos éxito siempre (o fallo aleatorio si quieres probar DLQ)
  return true; 
};

const nodemailer = require('nodemailer');
const { getEmailContent } = require('./emailTemplates');

// Configuración del Transporter (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar conexión al iniciar (Opcional pero recomendado para debug)
transporter.verify().then(() => {
  console.log('📧 Servicio de Correo Listo (SMTP)');
}).catch(err => {
  console.error('❌ Error conectando a SMTP:', err.message);
});

/**
 * Envía un correo electrónico utilizando plantillas
 * @param {string} to - Email del destinatario
 * @param {string} type - Tipo de notificación (APPT_CONFIRM, etc)
 * @param {object} data - Datos para la plantilla { name, date, link }
 */
const sendEmail = async (to, type, data) => {
  try {
    const htmlContent = getEmailContent(type, data);
    const subjects = {
      'APPT_CONFIRM': 'Confirmación de Solicitud de Cita',
      'APPT_REMINDER': 'Recordatorio: Tu cita médica se acerca',
      'CANCELLATION': 'Aviso de Cancelación de Cita',
      'ENCOUNTER_STUDENT': 'Consulta atendida - Revisa tus instrucciones', // <--- Asunto para el Estudiante
      'ENCOUNTER_DOCTOR': 'Confirmación de cierre exitoso'    
    };

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: to,
      subject: subjects[type] || 'Notificación Health System',
      html: htmlContent,
    });

    console.log(`✅ Correo enviado a ${to} | ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Fallo envío a ${to}:`, error.message);
    throw error; // Lanzar error para que el Worker maneje el reintento
  }
};

module.exports = { sendTestEmail, sendEmail };