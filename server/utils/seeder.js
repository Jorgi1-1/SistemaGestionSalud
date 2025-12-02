require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');

// Datos ficticios
const doctorsData = [
  { email: 'dr.house@u.edu', name: 'Gregory House', license: 'MED-001' },
  { email: 'dr.strange@u.edu', name: 'Stephen Strange', license: 'MED-002' },
  { email: 'dr.grey@u.edu', name: 'Meredith Grey', license: 'MED-003' }
];

const studentsData = [
  { email: 'peter.parker@u.edu', name: 'Peter Parker', id: '101102' },
  { email: 'miles.morales@u.edu', name: 'Miles Morales', id: '102102' }
];

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Limpiando base de datos...');
    await User.deleteMany({});
    await MedicalRecord.deleteMany({});
    await Appointment.deleteMany({});

    console.log('Creando Admin...');
    await User.create({
      email: 'admin@u.edu',
      password: 'adminpassword', // El modelo lo encriptará
      role: 'admin',
      profile: { fullName: 'Admin Principal' }
    });

    console.log('Creando Doctores...');
    const doctors = [];
    for (const dr of doctorsData) {
      const user = await User.create({
        email: dr.email,
        password: 'password123',
        role: 'doctor',
        profile: { fullName: dr.name, doctorLicense: dr.license }
      });
      doctors.push(user);
    }

    console.log('Creando Estudiantes y Expedientes...');
    const students = [];
    for (const st of studentsData) {
      const user = await User.create({
        email: st.email,
        password: 'password123',
        role: 'student',
        profile: { fullName: st.name, studentId: st.id }
      });
      
      // Regla 1:1 - Crear expediente vacío
      await MedicalRecord.create({ studentId: user._id });
      students.push(user);
    }

    console.log('Agendando citas de prueba...');
    // Cita 1: Mañana (Para probar notificación T-24h)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await Appointment.create({
      studentId: students[0]._id,
      doctorId: doctors[0]._id,
      date: tomorrow,
      reason: 'Dolor de cabeza arácnido',
      status: 'CONFIRMADA' // Ya confirmada para que el worker detecte el recordatorio
    });

    console.log('¡Datos importados exitosamente!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();