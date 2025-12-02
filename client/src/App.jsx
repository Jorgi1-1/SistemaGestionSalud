import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // <--- Importar Layout
import Login from './pages/Login';
import StudentDashboard from './pages/student/Dashboard';
import DoctorDashboard from './pages/doctor/Dashboard';
import AdminDashboard from './pages/admin/Dashboard'; // <--- IMPORTAR
import MedicalHistory from './pages/student/MedicalHistory'; // <--- NUEVO
import PatientRecord from './pages/doctor/PatientRecord';    // <--- NUEVO
import Availability from './pages/doctor/Availability'; // <--- Importar
import MyResults from './pages/student/MyResults'; // <--- IMPORTAR

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Protegidas (Envueltas en Layout) */}
          <Route element={<Layout />}> {/* <--- Nuevo envoltorio visual */}
            
            {/* Rutas Estudiante */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/history" element={<MedicalHistory />} /> {/* <--- RUTA NUEVA */}
              <Route path="/student/results" element={<MyResults />} /> {/* <--- NUEVA RUTA */}
            </Route>

            {/* Rutas Médico */}
            <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/patient/:id" element={<PatientRecord />} /> {/* <--- RUTA NUEVA */}
              <Route path="/doctor/availability" element={<Availability />} /> {/* <--- NUEVA */}
            </Route>

            {/* Rutas ADMIN */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
               <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;