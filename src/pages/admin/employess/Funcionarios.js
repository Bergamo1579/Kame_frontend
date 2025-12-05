import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Filter, X, Users, UserCheck, UserX, TrendingUp, Briefcase } from 'lucide-react';
import { employeesApi, rolesApi, accessLevelsApi } from '../../../services/api';
import Toast from '../../../components/Toast';

export default function Funcionarios() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role_id: '',
  });
  const [payroll, setPayroll] = useState({ totalSalary: 0, payDay20: 0, payDay5: 0 });

  // Modais para gerenciar funções
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // Estados para gerenciamento de funções
  const [roleForm, setRoleForm] = useState({ role_name: '', description: '' });
  const [editingRole, setEditingRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // Estados para níveis de acesso (apenas listagem)
  const [accessLevels, setAccessLevels] = useState([]);

  // Estado para notificações (toast)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Estados para modais de confirmação
  const [confirmModal, setConfirmModal] = useState({ show: false, employeeId: null, employeeName: '' });
  const [confirmRoleModal, setConfirmRoleModal] = useState({ show: false, roleId: null, roleName: '' });

  // Função para mostrar notificação
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Bloquear scroll quando modais estiverem abertos
  useEffect(() => {
    const hasModalOpen = showRoleModal || confirmModal.show || confirmRoleModal.show;
    
    if (hasModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showRoleModal, confirmModal.show, confirmRoleModal.show]);

  // Detectar mensagens de sucesso do location.state
  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      // Limpar o state para não mostrar novamente ao recarregar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    loadData();
  }, [searchTerm, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.role_id) params.role_id = filters.role_id;
      if (searchTerm) params.name = searchTerm;

      const [employeesRes, rolesRes, accessLevelsRes] = await Promise.all([
        employeesApi.getAll(params),
        rolesApi.getAll(),
        accessLevelsApi.getAll(),
      ]);

      const employeesData = employeesRes.data?.data || [];
      setEmployees(employeesData);
      setRoles(rolesRes.data || []);
      setAccessLevels(accessLevelsRes.data || []);

      setPayroll({
        totalSalary: Number(employeesRes.data?.totalSalary) || 0,
        payDay20: Number(employeesRes.data?.payDay20) || 0,
        payDay5: Number(employeesRes.data?.payDay5) || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setEmployees([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtering is handled by the backend; frontend will request with `searchTerm` and `filters`

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({ role_id: '' });
    setShowFilters(false);
  };

  const handleDeleteClick = (employee) => {
    setConfirmModal({ 
      show: true, 
      employeeId: employee.employee_id, 
      employeeName: employee.name 
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await employeesApi.delete(confirmModal.employeeId);
      setConfirmModal({ show: false, employeeId: null, employeeName: '' });
      showToast('Funcionário excluído com sucesso!', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showToast('Erro ao excluir funcionário', 'error');
    }
  };

  const getRoleName = (roleId) => {
    return roles.find(r => r.role_id === roleId)?.role_name || '-';
  };

  // ====== FUNÇÕES PARA GERENCIAR FUNÇÕES ======
  const handleOpenRoleModal = () => {
    setRoleForm({ role_name: '', description: '' });
    setEditingRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      role_name: role.role_name,
      description: role.description || ''
    });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.role_name.trim()) {
      showToast('Por favor, preencha o nome da função', 'error');
      return;
    }

    try {
      setRoleLoading(true);
      if (editingRole) {
        await rolesApi.update(editingRole.role_id, roleForm);
        showToast('Função atualizada com sucesso!', 'success');
      } else {
        await rolesApi.create(roleForm);
        showToast('Função criada com sucesso!', 'success');
      }
      setRoleForm({ role_name: '', description: '' });
      setEditingRole(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar função:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar função', 'error');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleDeleteRoleClick = (role) => {
    setConfirmRoleModal({
      show: true,
      roleId: role.role_id,
      roleName: role.role_name
    });
  };

  const handleDeleteRoleConfirm = async () => {
    try {
      setRoleLoading(true);
      await rolesApi.delete(confirmRoleModal.roleId);
      setConfirmRoleModal({ show: false, roleId: null, roleName: '' });
      showToast('Função excluída com sucesso!', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir função:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir função', 'error');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleCancelRoleEdit = () => {
    setEditingRole(null);
    setRoleForm({ role_name: '', description: '' });
  };

  // Estatísticas
  const totalEmployees = employees.length;
  const topRoles = roles.slice(0, 3).map(role => ({
    ...role,
    count: employees.filter(e => e.role_id === role.role_id).length
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Funcionários</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie os funcionários cadastrados</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenRoleModal}
                className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
                title="Gerenciar Funções"
              >
                <Briefcase size={16} />
                <span className="hidden sm:inline">Funções</span>
              </button>
              <button
                onClick={() => navigate('/admin/funcionarios/novo')}
                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Novo Funcionário</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Total</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalEmployees}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            {topRoles.map((role) => (
              <div key={role.role_id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">{role.role_name}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{role.count}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payroll Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Total Salários</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">R$ {payroll.totalSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Pagamento dia 20 (40%)</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">R$ {payroll.payDay20.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Pagamento dia 5 (60%)</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">R$ {payroll.payDay5.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserX className="text-red-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-3">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, CPF ou email..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm ${
                showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>

          {/* Painel de Filtros */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Função</label>
                  <select
                    value={filters.role_id}
                    onChange={(e) => setFilters({ ...filters, role_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todos</option>
                    {roles.map(role => (
                      <option key={role.role_id} value={role.role_id}>
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabela de Funcionários */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-indigo-600"></div>
              <p className="text-gray-600 mt-4">Carregando...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium">Nenhum funcionário encontrado</p>
            </div>
          ) : (
            <>
              {/* Mobile - Cards */}
              <div className="block md:hidden divide-y divide-gray-200">
                {employees.map((employee, index) => (
                  <div key={employee.employee_id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-semibold text-sm">
                            {employee.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{employee.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{employee.email || 'Sem email'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/admin/funcionarios/editar/${employee.employee_id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">CPF:</span>
                        <span className="font-mono text-gray-700">{employee.CPF || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Função:</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-800">
                          {getRoleName(employee.role_id)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Salário:</span>
                        <span className="font-semibold text-green-600">
                          {employee.salary ? `R$ ${Number(employee.salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop - Tabela */}
              <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Funcionário</th>
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">CPF</th>
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Função</th>
                        <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Salário</th>
                        <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {employees.map((employee) => (
                        <tr key={employee.employee_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-600 font-semibold">{employee.name?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                <div className="text-xs text-gray-500">{employee.email || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 font-mono">{employee.CPF || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {getRoleName(employee.role_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-green-600">
                              {employee.salary ? `R$ ${Number(employee.salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/funcionarios/editar/${employee.employee_id}`)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(employee)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {!loading && employees.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {employees.length} de {totalEmployees} funcionários
          </div>
        )}
      </div>

      {/* Modal de Funções - Ultra Compacto */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header Mini */}
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-purple-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Briefcase className="text-white" size={16} />
                <h2 className="text-base sm:text-lg font-bold text-white">Funções</h2>
              </div>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  handleCancelRoleEdit();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo Scrollável */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 sm:p-4 overflow-y-auto flex-1">
              {/* Formulário Mini - Fixo em Mobile */}
              <div className="flex-shrink-0">
                <div className="bg-purple-50 rounded-lg p-2.5 sm:p-3 border border-purple-200 sticky top-0 z-10">
                  <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    {editingRole ? <Edit size={14} /> : <Plus size={14} />}
                    {editingRole ? 'Editar' : 'Novo'}
                  </h3>
                  
                  <form onSubmit={handleSaveRole} className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={roleForm.role_name}
                        onChange={(e) => setRoleForm({ ...roleForm, role_name: e.target.value })}
                        placeholder="Ex: Vendedor"
                        className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        disabled={roleLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Descrição
                      </label>
                      <textarea
                        value={roleForm.description}
                        onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                        placeholder="Descreva as responsabilidades..."
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 resize-none"
                        disabled={roleLoading}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={roleLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 text-xs rounded font-medium transition-all disabled:opacity-50"
                      >
                        {roleLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            {editingRole ? <Edit size={12} /> : <Plus size={12} />}
                            {editingRole ? 'Atualizar' : 'Criar'}
                          </>
                        )}
                      </button>
                      
                      {editingRole && (
                        <button
                          type="button"
                          onClick={handleCancelRoleEdit}
                          className="px-2.5 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-all"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Lista Ultra Compacta com Scroll Independente */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Briefcase className="text-purple-600" size={14} />
                    Lista ({roles.length})
                  </h3>
                </div>

                {roles.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Briefcase size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-600 font-medium text-xs">Nenhuma Função cadastrada</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 overflow-y-auto pr-1 flex-1" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                    {roles.map((role) => {
                      const employeeCount = employees.filter(e => e.role_id === role.role_id).length;
                      const isEditing = editingRole?.role_id === role.role_id;
                      
                      return (
                        <div
                          key={role.role_id}
                          onClick={() => handleEditRole(role)}
                          className={`bg-white rounded p-2 border transition-all cursor-pointer ${
                            isEditing 
                              ? 'border-purple-500 shadow ring-1 ring-purple-200' 
                              : 'border-gray-200 hover:border-purple-300 hover:shadow-sm active:scale-[0.98]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Briefcase size={12} className="text-purple-600 flex-shrink-0" />
                                <h4 className="font-semibold text-gray-900 text-xs truncate">{role.role_name}</h4>
                                {isEditing && (
                                  <span className="px-1 py-0.5 bg-purple-600 text-white text-[9px] font-semibold rounded">
                                    Editando
                                  </span>
                                )}
                              </div>
                              
                              {role.description && (
                                <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">{role.description}</p>
                              )}
                              
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                <Users size={10} />
                                {employeeCount}
                                {employeeCount > 0 && <span className="ml-0.5">🔒</span>}
                              </span>
                            </div>
                            
                            <div className="flex gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditRole(role);
                                }}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                disabled={roleLoading}
                                title="Editar"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRoleClick(role);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                                disabled={roleLoading || employeeCount > 0}
                                title={employeeCount > 0 ? "Protegido" : "Excluir"}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Mini */}
            <div className="px-3 py-2 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  handleCancelRoleEdit();
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-medium transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Excluir Funcionário */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={() => setConfirmModal({ show: false, employeeId: null, employeeName: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Funcionário?</h3>
              
              <p className="text-xs text-gray-600 mb-1">
                Você está prestes a excluir:
              </p>
              <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                {confirmModal.employeeName}
              </p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmModal({ show: false, employeeId: null, employeeName: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Excluir Funções */}
      {confirmRoleModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={() => setConfirmRoleModal({ show: false, roleId: null, roleName: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Briefcase className="text-purple-600" size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Função?</h3>
              
              <p className="text-xs text-gray-600 mb-1">
                Você está prestes a excluir:
              </p>
              <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                {confirmRoleModal.roleName}
              </p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmRoleModal({ show: false, roleId: null, roleName: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteRoleConfirm}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
}
