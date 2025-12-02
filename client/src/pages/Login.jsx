import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = await login(email, password);
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'doctor') navigate('/doctor/dashboard');
      else if (role === 'admin') navigate('/admin/dashboard');
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Error de conexión';
      alert(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#F2F4F7] p-4">
      <div className="w-full max-w-md bg-white rounded-4xl shadow-xl shadow-gray-200/50 p-10 border border-gray-100">
        
        <div className="flex justify-center mb-8">
           <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-bold text-xl">
              U
           </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">Bienvenido</h2>
        <p className="text-[#8E7953] text-center mb-8 text-sm">Sistema de Gestión de Salud Universitaria</p>
        

        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Correo</label>
            <input 
              type="email" 
              className="input-sqew"
              placeholder="usuario@u.edu"
              value={email} onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Contraseña</label>
            <input 
              type="password" 
              className="input-sqew"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>

          <button disabled={loading} className="btn-primary w-full mt-4 flex justify-center">
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-400 mt-8">
          © Jorge Tovar
        </p>
      </div>
    </div>
  );
}