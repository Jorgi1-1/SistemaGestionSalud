import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'logs'
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: '', password: '', role: 'student', fullName: '', 
    studentId: '', doctorLicense: ''
  });

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'logs') loadLogs();
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) { console.error(error); }
  };

  const loadLogs = async () => {
    try {
      const { data } = await api.get('/users/audit-logs');
      setLogs(data);
    } catch (error) { console.error(error); }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const isActive = currentStatus === 'active';
    const action = isActive ? 'desactivar' : 'activar';
    const warning = isActive 
      ? ' El usuario perderá el acceso al sistema inmediatamente.' 
      : ' El usuario podrá volver a iniciar sesión.';

    if (!window.confirm(`¿Seguro que deseas ${action} a este usuario?${warning}`)) return;
    
    try {
      await api.put(`/users/${id}/status`);
      loadUsers();
    } catch (error) { alert(error.response?.data?.message); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('⚠️ ¡PELIGRO! Esto eliminará al usuario permanentemente.')) return;
    if (!window.confirm('¿Estás absolutamente seguro? Esta acción no se puede deshacer.')) return;

    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (error) { alert(error.response?.data?.message); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        ...newUser,
        studentId: newUser.role === 'student' ? newUser.studentId : undefined,
        doctorLicense: newUser.role === 'doctor' ? newUser.doctorLicense : undefined
      });
      alert('Usuario creado exitosamente');
      setShowForm(false);
      setNewUser({ email: '', password: '', role: 'student', fullName: '', studentId: '', doctorLicense: '' });
      loadUsers();
    } catch (error) { alert(error.response?.data?.message || 'Error al crear usuario'); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#154734]">Panel de Administración</h1>
          <p className="text-[#008E87] text-sm mt-1 font-medium">Gestión de usuarios y auditoría del sistema.</p>
        </div>
        
        {/* Tabs Estilo Pill */}
        <div className="flex bg-white p-1.5 rounded-full border border-gray-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 ${activeTab === 'users' ? 'bg-[#154734] text-white shadow-md' : 'text-gray-500 hover:text-[#154734]'}`}
          >
            Usuarios
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 ${activeTab === 'logs' ? 'bg-[#154734] text-white shadow-md' : 'text-gray-500 hover:text-[#154734]'}`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* --- PESTAÑA USUARIOS --- */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          <div className="flex justify-end">
            <button 
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2 shadow-orange-200"
            >
              <span className="text-lg font-bold">{showForm ? '✕' : '+'}</span> 
              {showForm ? 'Cerrar Formulario' : 'Nuevo Usuario'}
            </button>
          </div>

          {/* Formulario de Creación */}
          {showForm && (
            <div className="card-sqew border-t-4 border-[#E37222] animate-fade-in">
              <h3 className="font-bold text-xl mb-6 text-[#154734]">Dar de alta usuario</h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#154734] uppercase ml-1">Nombre Completo</label>
                  <input type="text" className="input-sqew" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#154734] uppercase ml-1">Correo Electrónico</label>
                  <input type="email" className="input-sqew" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#154734] uppercase ml-1">Contraseña</label>
                  <input type="password" className="input-sqew" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#154734] uppercase ml-1">Rol</label>
                  <select className="input-sqew" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="student">Estudiante</option>
                    <option value="doctor">Médico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {newUser.role === 'student' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-xs font-bold text-[#154734] uppercase ml-1">Matrícula (ID)</label>
                    <input type="text" className="input-sqew" value={newUser.studentId} onChange={e => setNewUser({...newUser, studentId: e.target.value})} required />
                  </div>
                )}
                
                {newUser.role === 'doctor' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-xs font-bold text-[#154734] uppercase ml-1">Cédula Profesional</label>
                    <input type="text" className="input-sqew" value={newUser.doctorLicense} onChange={e => setNewUser({...newUser, doctorLicense: e.target.value})} required />
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end pt-4">
                  <button type="submit" className="btn-primary w-full md:w-auto">Guardar Usuario</button>
                </div>
              </form>
            </div>
          )}

          {/* Tabla de Usuarios */}
          <div className="card-sqew overflow-hidden p-0 border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#154734] uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#154734] uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#154734] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#154734] uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#154734]">{user.profile?.fullName}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide 
                        ${user.role === 'admin' ? 'bg-[#8E7953]/10 text-[#8E7953] border border-[#8E7953]/20' : 
                          user.role === 'doctor' ? 'bg-[#008E87]/10 text-[#008E87] border border-[#008E87]/20' : 
                          'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-bold ${user.status === 'active' ? 'text-green-700' : 'text-red-700'}`}>
                          {user.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => handleToggleStatus(user._id, user.status)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                            user.status === 'active' 
                              ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {user.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                        
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-xs font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PESTAÑA LOGS --- */}
      {activeTab === 'logs' && (
        <div className="card-sqew overflow-hidden p-0 border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#154734] uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#154734] uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#154734] uppercase tracking-wider">Acción</th>

              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#154734]">{log.userId?.email || 'Sistema'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-xs font-bold bg-[#008E87]/10 text-[#008E87]">
                      {log.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <span className="text-4xl block mb-2">📋</span>
              No hay registros de auditoría disponibles.
            </div>
          )}
        </div>
      )}
    </div>
  );
}