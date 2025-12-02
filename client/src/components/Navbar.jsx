import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoClick = () => {
    if (!user) return navigate('/login');
    switch (user.role) {
      case 'student': return navigate('/student/dashboard');
      case 'doctor': return navigate('/doctor/dashboard');
      case 'admin': return navigate('/admin/dashboard');
      default: return navigate('/login');
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo Institucional */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLogoClick}>
            {/* Escudo simplificado: Fondo Verde, Texto Blanco/Dorado */}
            <div className="w-10 h-10 bg-[#154734] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105 border-2 border-[#E37222]">
              U
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight text-[#154734] tracking-tight">
                Sistema de Salud
              </span>
              <span className="text-[10px] font-medium text-[#E37222] uppercase tracking-widest">
                Universitario
              </span>
            </div>
          </div>

          {/* Perfil */}
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#154734]">{user?.profile?.fullName}</p>
              <p className="text-xs text-[#008E87] font-medium capitalize">
                {user?.role === 'student' ? 'Estudiante' : user?.role === 'doctor' ? 'Médico' : 'Admin'}
              </p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-5 py-2 rounded-full transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}