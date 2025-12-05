import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../services/api';
import Icon from '../components/Icon';
import { AuthContext } from '../contexts/AuthContext';

const EyeIcon = ({ isOpen }) => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d={isOpen 
        ? "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59"
      }
    />
  </svg>
);

const InputField = ({ label, type, value, onChange, placeholder, icon, showToggle, onToggle }) => (
  <div className="mb-2">
    <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon path={icon} size="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-12 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-950 focus:border-blue-950 transition-colors bg-white text-sm"
        placeholder={placeholder}
        required
        autoComplete={type === 'password' ? 'current-password' : 'username'}
        style={{ WebkitTextSecurity: type === 'password' ? 'disc' : 'none' }}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-950 hover:text-blue-900 transition-colors focus:outline-none"
          style={{ height: '100%', width: '2.5rem', justifyContent: 'center' }}
        >
          <EyeIcon isOpen={type === 'text'} />
        </button>
      )}
    </div>
  </div>
);

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false); // new
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 8000);
    return () => clearTimeout(timer);
  }, [error]);

  // Verificar se já existe token válido
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Tenta navegar direto se tiver token
          navigate('/admin/dashboard/controle-efetivo', { replace: true });
        } catch (error) {
          // Se o token for inválido, limpa e continua no login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  // preload background image and show spinner until loaded (fallback after 5s)
  useEffect(() => {
    // Carregar imediatamente sem esperar imagem
    setImageLoaded(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setIsLoading(true);
    try {
      // Chama o login do AuthContext para atualizar o estado global
      await login({ username: username.trim(), password });
      navigate('/admin/dashboard/controle-efetivo');
    } catch (err) {
      setError(err.message || 'Credenciais inválidas. Verifique seu usuário e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    if (error) setError('');
    setter(e.target.value);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#0b1220]">
      {/* Background image (kept but hidden until loaded via opacity) */}
      <img 
        src="/industrial-machine.png" 
        alt="Máquina industrial" 
        className={`hidden sm:block absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Loading overlay while background loads */}
      {!imageLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111a]">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-xs text-gray-200">Carregando plano de fundo...</span>
          </div>
        </div>
      )}

      {/* Card de login centralizado, responsivo para mobile */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-xs bg-white rounded-none sm:rounded-2xl sm:border sm:border-gray-100 px-2 py-2 sm:px-5 sm:py-4 flex flex-col items-center mx-0 sm:mx-auto sm:drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]">

        {/* CSS para esconder ícones nativos de revelação de senha (IE/Edge/Chromium/WebKit) */}
        <style>{`
          /* IE / Edge */
          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear {
            display: none;
          }

          /* WebKit / Blink (Chrome, Safari) - tentativas de esconder botões nativos */
          input[type="password"]::-webkit-textfield-decoration-button,
          input[type="password"]::-webkit-password-toggle-button,
          input[type="password"]::-webkit-credentials-autofill-button {
            display: none !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }

          /* Garantir que o input não mostre botões de aparência nativa */
          input[type="password"] {
            -webkit-appearance: none;
            appearance: none;
          }
        `}</style>
        {/* Logo */}
        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-3 shadow-md border border-gray-200">
          <img 
            src="/logo.jpeg" 
            alt="KAME" 
            className="w-12 h-12 object-contain"
          />
        </div>
        {/* Título */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 tracking-wide text-center leading-tight">Bem-vindo</h1>
        <p className="text-gray-600 text-xs sm:text-sm text-center mb-3 leading-tight">Acesso ao sistema da empresa</p>
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <InputField
            label="Usuário"
            type="text"
            value={username}
            onChange={handleInputChange(setUsername)}
            placeholder="Digite seu usuário"
            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
          <InputField
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handleInputChange(setPassword)}
            placeholder="Digite sua senha"
            icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            showToggle
            onToggle={() => setShowPassword(!showPassword)}
          />
          {/* Error Message */}
          <div className="min-h-[32px] flex items-start">
            {error && (
              <div className="w-full text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <Icon path="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" size="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-xs">Erro de autenticação</p>
                    <p className="text-xs mt-0.5">{error}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  <Icon path="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" size="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-blue-950 to-blue-900 hover:from-blue-950 hover:to-blue-950 text-white rounded-xl text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-950 focus:ring-offset-2 shadow-md"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Autenticando...
              </>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-200 text-center w-full">
          <p className="text-xs text-gray-500 mb-1">Dúvidas? Contate nossa equipe de suporte</p>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} KAME. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
