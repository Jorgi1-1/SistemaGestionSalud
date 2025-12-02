require('dotenv').config();
const connectDB = require('../config/db');

// Importar Modelos
const Appointment = require('../models/Appointment');
const Encounter = require('../models/Encounter');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const MedicalRecord = require('../models/MedicalRecord');

const cleanupData = async () => {
  try {
    await connectDB();

    console.log('\n🧹 --- INICIANDO PROTOCOLO DE LIMPIEZA ---');
    console.log('⚠️  Se borrarán todas las citas, consultas y logs. Los usuarios se conservarán.\n');

    // 1. Eliminar Citas (Agenda limpia)
    const deletedAppts = await Appointment.deleteMany({});
    console.log(`✅ Citas eliminadas: ${deletedAppts.deletedCount}`);

    // 2. Eliminar Consultas/Notas Clínicas (Historial limpio)
    const deletedEncounters = await Encounter.deleteMany({});
    console.log(`✅ Consultas médicas eliminadas: ${deletedEncounters.deletedCount}`);

    // 3. Eliminar Notificaciones (Bandeja limpia)
    const deletedNotifs = await Notification.deleteMany({});
    console.log(`✅ Notificaciones eliminadas: ${deletedNotifs.deletedCount}`);

    // 4. Eliminar Logs de Auditoría (Rastro limpio)
    const deletedLogs = await AuditLog.deleteMany({});
    console.log(`✅ Logs de auditoría eliminados: ${deletedLogs.deletedCount}`);

    // 5. Reiniciar Expedientes Médicos (Borrar alergias/vacunas de prueba)
    // NOTA: No borramos el documento 'MedicalRecord' porque rompería la relación con el usuario.
    // Solo vaciamos sus arrays internos.
    const updatedRecords = await MedicalRecord.updateMany({}, {
      $set: { 
        allergies: [], 
        medicalConditions: [], 
        vaccines: [] 
      }
    });
    console.log(`✅ Expedientes reiniciados (datos clínicos borrados): ${updatedRecords.modifiedCount}`);

    console.log('\n✨ ¡LISTO! El sistema está inmaculado para tu presentación.');
    process.exit();
  } catch (error) {
    console.error(`❌ Error durante la limpieza: ${error.message}`);
    process.exit(1);
  }
};

cleanupData();