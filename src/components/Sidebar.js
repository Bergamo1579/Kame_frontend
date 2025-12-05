import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Truck,
  ClipboardList,
  Folder,
  Layers,
  Cpu,
  LogOut,
  X,
  Menu,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

const menuItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
  { name: 'Clientes', path: '/admin/clientes', icon: Users },
  { name: 'Funcionários', path: '/admin/funcionarios', icon: Users },
  { name: 'Fornecedores', path: '/admin/fornecedores', icon: Truck },
  { name: 'Orçamentos', path: '/admin/orcamentos', icon: FileText },
  { name: 'Ordens de Serviço', path: '/admin/ordens-servico', icon: ClipboardList },
  { name: 'Categorias', path: '/admin/categorias', icon: Folder },
  { name: 'Maquinário', path: '/admin/maquinas', icon: Cpu },
  { name: 'Financeiro', path: '/admin/financeiro', icon: Wallet },
  { name: 'Entradas', path: '/admin/entradas', icon: TrendingUp },
  { name: 'Despesas', path: '/admin/despesas', icon: TrendingDown },
];

const financeItems = [
  { path: '/admin/orcamentos', Icon: Layers, label: 'Orçamentos' },
  { path: '/admin/fornecedores', Icon: Briefcase, label: 'Fornecedores' },
  { path: '/admin/entradas', Icon: TrendingUp, label: 'Entradas' },
  { path: '/admin/despesas', Icon: TrendingDown, label: 'Despesas' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Adiciona classe ao body para controlar o layout
  useEffect(() => {
    if (open) {
      document.body.classList.add('sidebar-open');
      document.body.classList.remove('sidebar-closed');
    } else {
      document.body.classList.add('sidebar-closed');
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.classList.remove('sidebar-open', 'sidebar-closed');
    };
  }, [open]);

  const handleLogout = () => {
    logout && logout();
    navigate('/login');
  };

  const renderNavItems = (onClickClose, showLabels = true) =>
    menuItems.map(({ path, icon: Icon, name }) => {
      const active = location.pathname === path || location.pathname.startsWith(path + '/');
      // Dashboard item gets special handling for submenu
      if (path === '/admin/dashboard') {
        const subActive = location.pathname.startsWith('/admin/dashboard');
        return (
          <li key={path} className="relative">
            <div className={`flex items-center justify-between px-2 py-1 rounded-lg ${subActive ? 'bg-white/5 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
              {/* Parent link navigates to Controle Efetivo */}
              <Link
                to="/admin/dashboard/controle-efetivo"
                onClick={() => onClickClose && onClickClose()}
                className="flex items-center gap-3"
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className={`text-sm font-medium ${showLabels && open ? '' : 'opacity-0 w-0 overflow-hidden'}`}>Dashboard</span>
              </Link>
              <button onClick={() => setDashboardExpanded(s => !s)} className="p-1 rounded hover:bg-white/5 text-gray-300">
                <ChevronDown size={16} className={`${dashboardExpanded ? 'rotate-180' : ''} transition-transform`} />
              </button>
            </div>
            {dashboardExpanded && (
              <ul className="mt-2 ml-6 space-y-1">
                {/* Visão Geral desativada temporariamente
                <li className="relative">
                  <Link
                    to="/admin/dashboard"
                    onClick={() => onClickClose && onClickClose()}
                    className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors ${location.pathname === '/admin/dashboard' ? 'bg-white/5 text-white' : 'text-gray-300 hover:bg-white/3 hover:text-white'}`}
                  >
                    <Home size={14} className="flex-shrink-0" />
                    <span className={`truncate ${showLabels && open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Visão Geral</span>
                  </Link>
                  {location.pathname === '/admin/dashboard' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md" />}
                </li>
                */}
                <li className="relative">
                  <Link
                    to="/admin/dashboard/controle-efetivo"
                    onClick={() => onClickClose && onClickClose()}
                    className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors ${location.pathname === '/admin/dashboard/controle-efetivo' ? 'bg-white/5 text-white' : 'text-gray-300 hover:bg-white/3 hover:text-white'}`}
                  >
                    <ClipboardList size={16} className="flex-shrink-0" />
                    <span className={`truncate ${showLabels && open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Controle Efetivo</span>
                  </Link>
                  {location.pathname === '/admin/dashboard/controle-efetivo' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md" />}
                </li>
                <li className="relative">
                  <Link
                    to="/admin/dashboard/resumo-anual"
                    onClick={() => onClickClose && onClickClose()}
                    className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors ${location.pathname === '/admin/dashboard/resumo-anual' ? 'bg-white/5 text-white' : 'text-gray-300 hover:bg-white/3 hover:text-white'}`}
                  >
                    <BarChart3 size={16} className="flex-shrink-0" />
                    <span className={`truncate ${showLabels && open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>Boletim</span>
                  </Link>
                  {location.pathname === '/admin/dashboard/resumo-anual' && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md" />}
                </li>
              </ul>
            )}
          </li>
        );
      }

      return (
        <li key={path} className="relative">
          <Link
            to={path}
            onClick={() => onClickClose && onClickClose()}
            title={name}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              active 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className={`text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              showLabels && open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
            }`}>{name}</span>
          </Link>
          {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-md" />}
        </li>
      );
    });

  return (
    <>
      <style>{`
        .sidebar-scroll {
          /* Firefox */
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.12) transparent;
        }
        /* Webkit browsers */
        .sidebar-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.10);
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.18);
        }
      `}</style>
      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-[#0f1724] border-r border-gray-800 transition-all duration-300 ease-in-out hidden md:flex flex-col ${
          open ? 'w-56' : 'w-16'
        }`}
      >
        {/* Header */}
        <div className={`h-16 flex items-center border-b border-gray-800 ${open ? 'justify-between px-4' : 'justify-center'}`}>
          <span className={`text-white font-bold text-xl transition-all duration-300 ${
            open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          }`}>
            KAME
          </span>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors flex-shrink-0"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 sidebar-scroll">
          <ul className="space-y-1">{renderNavItems()}</ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            title="Sair"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-all duration-200 ${
              open ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span className={`text-sm font-medium transition-all duration-300 whitespace-nowrap ${
              open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
            }`}>
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-3 rounded-lg bg-[#0f1724] text-white shadow-lg border border-gray-700 hover:bg-[#1a2332] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        {mobileOpen && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fadeIn"
            />
            <aside className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-[#0f1724] flex flex-col shadow-2xl border-r border-gray-800 animate-slideInLeft">
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
                <span className="text-white font-bold text-xl">KAME</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-300 transition-colors"
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-1">{renderNavItems(() => setMobileOpen(false), true)}</ul>
              </nav>
              <div className="p-3 border-t border-gray-800">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                >
                  <LogOut size={20} />
                  <span className="text-sm font-medium">Sair</span>
                </button>
              </div>
            </aside>
          </>
        )}
      </div>
    </>
  );
}