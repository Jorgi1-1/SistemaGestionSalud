// Colores institucionales
const COLORS = {
  brand: '#154734',   // Verde Institucional
  action: '#E37222',  // Naranja Acción
  bg: '#F2F4F7',      // Gris Fondo
  white: '#FFFFFF',
  text: '#1D2939'
};

// Plantilla Base (Header y Footer)
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${COLORS.bg}; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: ${COLORS.brand}; padding: 30px; text-align: center; }
    .content { padding: 40px 30px; color: ${COLORS.text}; line-height: 1.6; }
    .btn { display: inline-block; background-color: ${COLORS.action}; color: ${COLORS.white}; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 24px; font-weight: bold; color: ${COLORS.white};">
        U <span style="color: ${COLORS.action}">Health System</span>
      </div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      Este es un mensaje automático, por favor no respondas a este correo.
    </div>
  </div>
</body>
</html>
`;

// Generador de contenido según el tipo
const getEmailContent = (type, data) => {
  const { name, date, link } = data;
  const dateStr = date ? new Date(date).toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' }) : '';

  switch (type) {
    case 'APPT_CONFIRM':
      return baseTemplate(`
        <h2 style="color: ${COLORS.brand}; margin-top: 0;">Solicitud de Cita Recibida</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Has recibido una solicitud de cita.</p>
        <p>Revisa tu disponibilidad y actualiza el estatus de la cita.</p>
        <center><a href="${process.env.CLIENT_URL}/doctor/dashboard" class="btn">Ver Mis Citas</a></center>
      `);

    case 'APPT_REMINDER':
      return baseTemplate(`
        <h2 style="color: ${COLORS.brand}; margin-top: 0;">Recordatorio de Cita</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Este es un recordatorio amable de tu cita médica pendiente.</p>
        <p>Por favor llega 10 minutos antes.</p>
      `);

    case 'CANCELLATION':
      return baseTemplate(`
        <h2 style="color: #ef4444; margin-top: 0;">Cita Cancelada</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu cita programada ha sido cancelada.</p>
        <p>Si esto fue un error o deseas reagendar, por favor ingresa al sistema.</p>
        <center><a href="${process.env.CLIENT_URL}/student/dashboard" class="btn">Reagendar</a></center>
      `);

      case 'ENCOUNTER_STUDENT':
      return baseTemplate(`
        <h2 style="color: ${COLORS.brand}; margin-top: 0;">Consulta Atendida</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Tu consulta médica ha sido completada exitosamente.</p>
        <p>Tu médico ha registrado el diagnóstico y las instrucciones de tratamiento en tu expediente.</p>
        <p style="background: #e0f2f1; padding: 15px; border-radius: 8px; border-left: 4px solid ${COLORS.accent}; color: ${COLORS.brand};">
          <strong>Nota:</strong> Por privacidad, los detalles médicos solo están disponibles dentro de la plataforma.
        </p>
        <center><a href="${process.env.CLIENT_URL}/student/results" class="btn">Ver Mis Resultados</a></center>
      `);

    case 'ENCOUNTER_DOCTOR':
      return baseTemplate(`
        <h2 style="color: ${COLORS.brand}; margin-top: 0;">Cierre Exitoso</h2>
        <p>Hola Dr(a). <strong>${name}</strong>,</p>
        <p>La consulta ha sido registrada correctamente en el sistema y el expediente del paciente ha sido actualizado.</p>
        <p>Se ha notificado al estudiante para que revise sus instrucciones.</p>
        <center><a href="${process.env.CLIENT_URL}/doctor/dashboard" class="btn">Volver a la Agenda</a></center>
      `);

    default:
      return baseTemplate(`<p>Hola ${name}, tienes una nueva notificación en el sistema.</p>`);
  }
};

module.exports = { getEmailContent };