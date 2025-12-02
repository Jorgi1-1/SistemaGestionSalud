require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Importar Rutas
const userRoutes = require('./routes/userRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const clinicalRoutes = require('./routes/clinicalRoutes');

// Importar Workers
const notificationWorker = require('./services/notificationWorker');

// Conectar a Base de Datos
connectDB();

// Inicializar la App (¡Esta es la línea que te faltaba!)
const app = express();

// Middlewares Globales
app.use(express.json());
app.use(cors());

// Definir Rutas
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinical', clinicalRoutes);

// Iniciar Workers en segundo plano (Notificaciones)
try {
  notificationWorker.init();
  console.log('🤖 Workers de notificaciones iniciados');
} catch (error) {
  console.error('Error iniciando workers:', error);
}

// Arrancar Servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});