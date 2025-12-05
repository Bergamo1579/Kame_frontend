import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Filter, X, FileText, CheckCircle, Clock, XCircle, DollarSign, Tag, Settings } from 'lucide-react';
import { budgetApi, budgetTypesApi, clientsApi, employeesApi, ordersServiceApi } from '../../../services/api';
import { createOrderServiceFromBudget as createOrderServiceHelper } from './createOrderService';
import Toast from '../../../components/Toast';

export default function Orcamentos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [budgets, setBudgets] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [budgetTypes, setBudgetTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatusMap, setUpdatingStatusMap] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    
    type_id: '',
    client_id: '',
    employee_id: '',
    status: '', // pending, approved, rejected
    specificDate: '',
    month_budget: '',
  });
  
  // Modal de detalhes do orçamento
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // Modal para gerenciar tipos de orçamento
  const [showTypeModal, setShowTypeModal] = useState(false);
  
  // Estados para gerenciamento de tipos de orçamento
  const [typeForm, setTypeForm] = useState({ name_type: '', description: '' });
  const [editingType, setEditingType] = useState(null);
  const [typeLoading, setTypeLoading] = useState(false);

  // Estado para notificações (toast)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Estado para modal de confirmação de exclusão
  const [confirmModal, setConfirmModal] = useState({ show: false, budgetId: null, budgetName: '' });
  const [confirmTypeModal, setConfirmTypeModal] = useState({ show: false, typeId: null, typeName: '' });

  // Função para mostrar notificação
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
    
    // Mostrar toast se vier da tela de formulário
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      // Limpar o state para não mostrar novamente ao recarregar
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, budgets]);

  // Bloquear scroll quando modais estiverem abertos
  useEffect(() => {
    if (showTypeModal || confirmModal.show || confirmTypeModal.show || showDetailsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showTypeModal, confirmModal.show, confirmTypeModal.show, showDetailsModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, typesRes, clientsRes, employeesRes] = await Promise.all([
        budgetApi.getAll(),
        budgetTypesApi.getAll(),
        clientsApi.getAll(),
        employeesApi.getAll(),
      ]);
      // Normalize responses: some endpoints return arrays, others return { data: [...] } or { items: [...] }
      const normalize = (res) => {
        if (!res) return [];
        const d = res.data;
        if (!d) return [];
        if (Array.isArray(d)) return d;
        if (Array.isArray(d.items)) return d.items;
        if (Array.isArray(d.data)) return d.data;
        return [];
      };

      // A API de budgets retorna um objeto { total, items } ou array
      const budgetsData = budgetsRes.data?.items || budgetsRes.data || [];
      const budgetsArray = Array.isArray(budgetsData) ? budgetsData : [];

      setBudgets(budgetsArray);
      setFilteredBudgets(budgetsArray);
      setBudgetTypes(normalize(typesRes));
      setClients(normalize(clientsRes));
      setEmployees(normalize(employeesRes));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setBudgets([]);
      setFilteredBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...budgets];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(budget => {
        const clientName = (budget?.client?.name_client || '').toLowerCase();
        const employeeName = (budget?.employee?.name || '').toLowerCase();
        const budgetNumber = (budget?.budget_number || '').toString().toLowerCase();
        return clientName.includes(term) || employeeName.includes(term) || budgetNumber.includes(term);
      });
    }

    // legacy status_id filter removed; use string `status` filter instead

    if (filters.type_id) {
      filtered = filtered.filter(budget => budget?.type?.type_id === parseInt(filters.type_id));
    }

    if (filters.client_id) {
      filtered = filtered.filter(budget => budget?.client?.client_id === filters.client_id);
    }

    if (filters.employee_id) {
      filtered = filtered.filter(budget => budget?.employee?.employee_id === filters.employee_id);
    }

    // Filtro por status (pending, approved, rejected)
    if (filters.status) {
      filtered = filtered.filter(budget => budget.status === filters.status);
    }

    // Filtro por data específica
    if (filters.specificDate) {
      filtered = filtered.filter(budget => {
        const budgetDate = new Date(budget.created_at || budget.date);
        const filterDate = new Date(filters.specificDate);
        return (
          budgetDate.getDate() === filterDate.getDate() &&
          budgetDate.getMonth() === filterDate.getMonth() &&
          budgetDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    // Filtro por mês (usando input type="month")
    if (filters.month_budget && !filters.specificDate) {
      filtered = filtered.filter(budget => {
        const budgetDate = new Date(budget.created_at || budget.date);
        const [year, month] = filters.month_budget.split('-');
        return budgetDate.getFullYear() === parseInt(year) && (budgetDate.getMonth() + 1) === parseInt(month);
      });
    }

    setFilteredBudgets(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({ type_id: '', client_id: '', employee_id: '', status: '', specificDate: '', month_budget: '' });
    setShowFilters(false);
  };

  // Gerar lista de anos (últimos 5 anos + próximo ano)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const handleRowClick = (budget) => {
    setSelectedBudget(budget);
    setShowDetailsModal(true);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDelete = (budget) => {
    const clientName = getClientName(budget);
    setConfirmModal({
      show: true,
      budgetId: budget.budget_id,
      budgetName: `Orçamento para ${clientName}`
    });
  };

  const confirmDelete = async () => {
    try {
      await budgetApi.delete(confirmModal.budgetId);
      showToast('Orçamento excluído com sucesso!', 'success');
      setConfirmModal({ show: false, budgetId: null, budgetName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showToast('Erro ao excluir orçamento', 'error');
      setConfirmModal({ show: false, budgetId: null, budgetName: '' });
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ show: false, budgetId: null, budgetName: '' });
  };

  const getClientName = (budget) => {
    // A API retorna o objeto client aninhado
    return budget?.client?.name_client || '-';
  };

  const getEmployeeName = (budget) => {
    // A API retorna o objeto employee aninhado com campo 'name'
    return budget?.employee?.name || '-';
  };

  const getTypeName = (budget) => {
    // A API retorna o objeto type aninhado
    return budget?.type?.name_type || '-';
  };

  const getStatusName = (budget) => {
    // Use the budget.status enum to return a localized label
    const labels = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado' };
    return labels[budget?.status] || '-';
  };

  const handleStatusChange = async (budgetId, newStatus, budget) => {
    try {
      setUpdatingStatusMap(prev => ({ ...prev, [budgetId]: true }));
      // Send minimal patch to avoid overwriting other fields
      const patchData = { status: newStatus };
      if (newStatus === 'approved') {
        patchData.date_status_update = new Date().toISOString().split('T')[0];
      }
      console.debug('PATCH budget', budgetId, patchData);
      const resp = await budgetApi.update(budgetId, patchData);
      console.debug('PATCH response', resp?.data);

      // helper: wait until the budget is persisted with status 'approved'
      const waitForApproved = async (id, maxMs = 8000, interval = 400) => {
        const deadline = Date.now() + maxMs;
        while (Date.now() < deadline) {
          try {
            const r = await budgetApi.getById(id);
            const b = r?.data;
            if (b && b.status === 'approved') return b;
            // if status changed to something else, return it
            if (b && b.status !== undefined && b.status !== null && newStatus !== 'approved') return b;
          } catch (e) {
            // ignore transient errors
            console.debug('waitForApproved GET failed, retrying...', e?.message || e);
          }
          await new Promise(res => setTimeout(res, interval));
        }
        // final attempt
        try {
          const final = await budgetApi.getById(id);
          return final?.data || null;
        } catch (e) {
          console.warn('waitForApproved final GET failed', e?.message || e);
          return resp?.data || budget;
        }
      };

      let savedBudget = null;
      if (newStatus === 'approved') {
        savedBudget = await waitForApproved(budgetId, 8000, 400);
        if (!savedBudget || savedBudget.status !== 'approved') {
          console.warn('Status not confirmed as approved after waiting, aborting OS creation', savedBudget);
        }
      } else {
        // For non-approved statuses just fetch once
        try {
          const getResp = await budgetApi.getById(budgetId);
          savedBudget = getResp.data || resp.data || null;
        } catch (err) {
          console.warn('Falha ao buscar orçamento atualizado, usando resposta do PATCH', err);
          savedBudget = resp?.data || budget;
        }
      }

      // Update local list with the saved budget (preserve previous values when missing)
      setBudgets(prev => prev.map(b => {
        if (b.budget_id !== budgetId) return b;
        const server = savedBudget || {};
        return {
          ...b,
          status: server.status ?? newStatus,
          client: server.client ?? b.client,
          type: server.type ?? b.type,
          employee: server.employee ?? b.employee,
          date_status_update: server.date_status_update ?? b.date_status_update,
        };
      }));
      setFilteredBudgets(prev => prev.map(b => {
        if (b.budget_id !== budgetId) return b;
        const server = savedBudget || {};
        return {
          ...b,
          status: server.status ?? newStatus,
          client: server.client ?? b.client,
          type: server.type ?? b.type,
          employee: server.employee ?? b.employee,
          date_status_update: server.date_status_update ?? b.date_status_update,
        };
      }));

      // If approved, try create OS (only if savedBudget confirms approved)
      if (newStatus === 'approved' && savedBudget && savedBudget.status === 'approved') {
        const budgetData = savedBudget || resp.data || budget;
        try {
          await createOrderServiceHelper(budgetData, clients, employees, ordersServiceApi, showToast);
        } catch (err) {
          console.error('Erro ao criar OS via helper (inline):', err);
        }
      } else if (newStatus === 'approved') {
        showToast('Status alterado, mas não foi confirmado como aprovado em tempo — OS não criada automaticamente', 'warning');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showToast('Erro ao alterar status', 'error');
    } finally {
      setUpdatingStatusMap(prev => {
        const copy = { ...prev };
        delete copy[budgetId];
        return copy;
      });
    }
  };

  // ====== FUNÇÕES PARA GERENCIAR TIPOS DE ORÇAMENTO ======
  const handleOpenTypeModal = () => {
    setTypeForm({ name_type: '', description: '' });
    setEditingType(null);
    setShowTypeModal(true);
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      name_type: type.name_type,
      description: type.description || ''
    });
  };

  const handleSaveType = async (e) => {
    e.preventDefault();
    if (!typeForm.name_type.trim()) {
      showToast('Por favor, preencha o nome do tipo de orçamento', 'error');
      return;
    }

    try {
      setTypeLoading(true);
      if (editingType) {
        await budgetTypesApi.update(editingType.type_id, typeForm);
        showToast('Tipo de orçamento atualizado com sucesso!', 'success');
      } else {
        await budgetTypesApi.create(typeForm);
        showToast('Tipo de orçamento criado com sucesso!', 'success');
      }
      setTypeForm({ name_type: '', description: '' });
      setEditingType(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar tipo de orçamento:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar tipo de orçamento', 'error');
    } finally {
      setTypeLoading(false);
    }
  };

  const handleDeleteType = (type) => {
    setConfirmTypeModal({
      show: true,
      typeId: type.type_id,
      typeName: type.name_type
    });
  };

  const confirmDeleteType = async () => {
    try {
      setTypeLoading(true);
      await budgetTypesApi.delete(confirmTypeModal.typeId);
      showToast('Tipo de orçamento excluído com sucesso!', 'success');
      setConfirmTypeModal({ show: false, typeId: null, typeName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir tipo de orçamento:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir tipo de orçamento', 'error');
      setConfirmTypeModal({ show: false, typeId: null, typeName: '' });
    } finally {
      setTypeLoading(false);
    }
  };

  const cancelDeleteType = () => {
    setConfirmTypeModal({ show: false, typeId: null, typeName: '' });
  };

  const handleCancelTypeEdit = () => {
    setEditingType(null);
    setTypeForm({ name_type: '', description: '' });
  };

  // Formatação de moeda
  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Estatísticas baseadas nos orçamentos FILTRADOS
  const totalBudgets = filteredBudgets.length;
  const approvedBudgets = filteredBudgets.filter(b => b.status === 'approved').length;
  const pendingBudgets = filteredBudgets.filter(b => b.status === 'pending').length;
  const rejectedBudgets = filteredBudgets.filter(b => b.status === 'rejected').length;
  const totalValue = filteredBudgets.reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);
  
  // Valores por status
  const approvedValue = filteredBudgets.filter(b => b.status === 'approved').reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);
  const pendingValue = filteredBudgets.filter(b => b.status === 'pending').reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);
  const rejectedValue = filteredBudgets.filter(b => b.status === 'rejected').reduce((sum, b) => sum + (parseFloat(b.value) || 0), 0);

  // Verificar se há filtros ativos
  const hasActiveFilters = Boolean(
    filters.status || filters.type_id || filters.month_budget || filters.specificDate || searchTerm
  );

  // Gerar texto do filtro ativo
  const getActiveFilterText = () => {
    const parts = [];
    
    if (filters.specificDate) {
      parts.push(`📅 ${formatDate(filters.specificDate)}`);
    } else if (filters.month_budget) {
      const [year, month] = filters.month_budget.split('-');
      const monthNames = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      parts.push(`📅 ${monthNames[parseInt(month)]}/${year}`);
    }
    
    if (filters.status) {
      const statusLabels = { pending: 'Pendente', approved: 'Aprovado', rejected: 'Rejeitado' };
      parts.push(`Status: ${statusLabels[filters.status]}`);
    }
    
    if (filters.type_id) {
      const type = budgetTypes.find(t => t.type_id === parseInt(filters.type_id));
      if (type) parts.push(`Tipo: ${type.name_type}`);
    }
    
    if (searchTerm) {
      parts.push(`Busca: "${searchTerm}"`);
    }
    
    return parts.join(' • ');
  };

  // Orçamentos por tipo (top 3)
  const budgetsByType = budgetTypes.map(type => ({
    name: type.name_type,
    count: budgets.filter(b => b?.type?.type_id === type.type_id).length
  })).sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Orçamentos</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie seus orçamentos</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleOpenTypeModal}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Tag size={16} />
                <span className="hidden sm:inline">Tipos</span>
              </button>
              <button
                onClick={() => navigate('/admin/orcamentos/novo')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Novo Orçamento</span>
              </button>
            </div>
          </div>

          {/* Indicador de Filtro Ativo */}
          {hasActiveFilters && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-3 mb-4 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Filter className="text-white" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium opacity-90">Filtros Ativos</p>
                    <p className="text-white font-semibold text-sm truncate">{getActiveFilterText()}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-all text-xs font-medium flex-shrink-0"
                >
                  <X size={14} />
                  Limpar
                </button>
              </div>
            </div>
          )}

          {/* Cards de Estatísticas - Responsivo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
            {/* Card Valor Total */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Valor Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="text-gray-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500">{totalBudgets} orçamentos</p>
            </div>

            {/* Card Aprovados */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-green-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-600 truncate font-medium">Aprovados</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(approvedValue)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-green-600">{approvedBudgets} orçamentos</p>
            </div>

            {/* Card Pendentes */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-yellow-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-yellow-600 truncate font-medium">Pendentes</p>
                  <p className="text-lg font-bold text-yellow-600">{formatCurrency(pendingValue)}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="text-yellow-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-yellow-600">{pendingBudgets} orçamentos</p>
            </div>

            {/* Card Rejeitados */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-red-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-600 truncate font-medium">Rejeitados</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(rejectedValue)}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <XCircle className="text-red-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-red-600">{rejectedBudgets} orçamentos</p>
            </div>
          </div>

          {/* Top Tipos */}
          {budgetsByType.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-100 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Tag size={16} className="text-blue-600" />
                Top Tipos de Orçamento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {budgetsByType.map((type, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2.5 shadow-sm">
                    <p className="text-xs text-gray-600 font-medium truncate">{type.name}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">{type.count} orçamentos</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Busca e Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-3">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por número, cliente ou funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>

          {showFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="pending">Pendente</option>
                    <option value="approved">Aprovado</option>
                    <option value="rejected">Rejeitado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                  <select
                    value={filters.type_id}
                    onChange={(e) => setFilters({ ...filters, type_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {budgetTypes.map(type => (
                      <option key={type.type_id} value={type.type_id}>
                        {type.name_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mês do Orçamento</label>
                  <input
                    type="month"
                    value={filters.month_budget}
                    onChange={(e) => setFilters({ ...filters, month_budget: e.target.value, specificDate: '' })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Selecione o mês"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg"
                  >
                    <X size={18} />
                    Limpar
                  </button>
                </div>
              </div>
              
              {/* Filtro por Data Específica */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  📅 Filtrar por Dia Específico
                </label>
                <input
                  type="date"
                  value={filters.specificDate}
                  onChange={(e) => setFilters({ ...filters, specificDate: e.target.value, month_budget: '' })}
                  className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Selecione uma data"
                />
                {filters.specificDate && (
                  <p className="text-xs text-blue-600 mt-2">
                    📌 Filtrando por: {formatDate(filters.specificDate)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lista/Tabela de Orçamentos */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="text-gray-600 mt-4">Carregando...</p>
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium">Nenhum orçamento encontrado</p>
            </div>
          ) : (
            <>
              {/* Mobile - Cards com Scroll */}
              <div className={`block md:hidden divide-y divide-gray-200 ${filteredBudgets.length > 5 ? 'overflow-y-auto' : ''}`} style={{ maxHeight: filteredBudgets.length > 5 ? '400px' : 'none' }}>
                {filteredBudgets.map((budget) => (
                  <div key={budget.budget_id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-sm">
                            #{budget.budget_number || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h3 className="font-semibold text-gray-900 text-sm truncate" title={getClientName(budget)}>{getClientName(budget)}</h3>
                          <p className="text-xs text-gray-500 truncate" title={getEmployeeName(budget)}>{getEmployeeName(budget)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/admin/orcamentos/editar/${budget.budget_id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(budget)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-500 flex-shrink-0">Tipo:</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-800 truncate max-w-[150px]" title={getTypeName(budget)}>
                          {getTypeName(budget)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-gray-500 flex-shrink-0">Valor:</span>
                        <span className="font-semibold text-emerald-700">{formatCurrency(budget.value)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status:</span>
                        {(() => {
                          const statusColors = {
                            pending: { bg: '#FEF3C7', color: '#D97706' },
                            approved: { bg: '#D1FAE5', color: '#059669' },
                            rejected: { bg: '#FEE2E2', color: '#DC2626' }
                          };
                          const statusLabels = {
                            pending: 'Pendente',
                            approved: 'Aprovado',
                            rejected: 'Rejeitado'
                          };
                          const statusStyle = statusColors[budget.status] || statusColors.pending;
                          return (
                            <span 
                              className="px-2 py-0.5 text-[10px] font-semibold rounded-full flex items-center gap-1"
                              style={{ 
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color
                              }}
                            >
                              <span 
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: statusStyle.color }}
                              ></span>
                              {statusLabels[budget.status] || budget.status}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop - Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Nº</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Cliente</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Funcionário</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Tipo</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Valor</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBudgets.map((budget) => (
                      <tr key={budget.budget_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(budget)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold text-xs">
                              #{budget.budget_number || '?'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-xs">
                                {getClientName(budget)?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span 
                              className="text-sm font-medium text-gray-900 truncate max-w-[200px]" 
                              title={getClientName(budget)}
                            >
                              {getClientName(budget)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="text-sm text-gray-700 truncate block max-w-[180px]"
                            title={getEmployeeName(budget)}
                          >
                            {getEmployeeName(budget)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 truncate block max-w-[120px]">
                            {getTypeName(budget)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-emerald-700">{formatCurrency(budget.value)}</span>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            {updatingStatusMap[budget.budget_id] ? (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock size={16} className="animate-spin" />
                                Atualizando...
                              </div>
                            ) : (
                              <select
                                value={budget.status || 'pending'}
                                onChange={(e) => handleStatusChange(budget.budget_id, e.target.value, budget)}
                                className="px-2 py-1 text-sm border border-gray-300 rounded-lg bg-white"
                              >
                                <option value="pending">Pendente</option>
                                <option value="approved">Aprovado</option>
                                <option value="rejected">Rejeitado</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/orcamentos/editar/${budget.budget_id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(budget)}
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
            </>
          )}
        </div>
        {/* Footer: show counts below the table */}
        {!loading && filteredBudgets.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {filteredBudgets.length} de {budgets.length} orçamentos
          </div>
        )}
      </div>

      {/* Modal de Tipos de Orçamento - Ultra Compacto */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header Mini */}
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-purple-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="text-white" size={16} />
                <h2 className="text-base sm:text-lg font-bold text-white">Tipos de Orçamento</h2>
              </div>
              <button
                onClick={() => {
                  setShowTypeModal(false);
                  handleCancelTypeEdit();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo Scrollável */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 sm:p-4 overflow-y-auto flex-1">
              {/* Formulário Mini */}
              <div>
                <div className="bg-purple-50 rounded-lg p-2.5 sm:p-3 border border-purple-200 sticky top-0">
                  <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    {editingType ? <Edit size={14} /> : <Plus size={14} />}
                    {editingType ? 'Editar' : 'Novo'}
                  </h3>
                  
                  <form onSubmit={handleSaveType} className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={typeForm.name_type}
                        onChange={(e) => setTypeForm({ ...typeForm, name_type: e.target.value })}
                        placeholder="Ex: Manutenção"
                        className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        disabled={typeLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Descrição
                      </label>
                      <textarea
                        value={typeForm.description}
                        onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                        placeholder="Descreva..."
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 resize-none"
                        disabled={typeLoading}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={typeLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 text-xs rounded font-medium transition-all disabled:opacity-50"
                      >
                        {typeLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            {editingType ? <Edit size={12} /> : <Plus size={12} />}
                            {editingType ? 'Atualizar' : 'Criar'}
                          </>
                        )}
                      </button>
                      
                      {editingType && (
                        <button
                          type="button"
                          onClick={handleCancelTypeEdit}
                          className="px-2.5 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-all"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Lista Ultra Compacta */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Tag className="text-purple-600" size={14} />
                    Lista ({budgetTypes.length})
                  </h3>
                </div>

                {budgetTypes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Tag size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-600 font-medium text-xs">Nenhum tipo cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[calc(85vh-160px)] overflow-y-auto pr-1">
                    {budgetTypes.map((type) => {
                      const budgetCount = budgets.filter(b => b?.type?.type_id === type.type_id).length;
                      const isEditing = editingType?.type_id === type.type_id;
                      
                      return (
                        <div
                          key={type.type_id}
                          className={`bg-white rounded p-2 border transition-all ${
                            isEditing 
                              ? 'border-purple-500 shadow ring-1 ring-purple-200' 
                              : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h4 className="font-semibold text-gray-900 text-xs truncate">{type.name_type}</h4>
                                {isEditing && (
                                  <span className="px-1 py-0.5 bg-purple-600 text-white text-[9px] font-semibold rounded">
                                    Editando
                                  </span>
                                )}
                              </div>
                              
                              {type.description && (
                                <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">{type.description}</p>
                              )}
                              
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                <FileText size={10} />
                                {budgetCount}
                                {budgetCount > 0 && <span className="ml-0.5">🔒</span>}
                              </span>
                            </div>
                            
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => handleEditType(type)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                disabled={typeLoading}
                                title="Editar"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteType(type)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                                disabled={typeLoading || budgetCount > 0}
                                title={budgetCount > 0 ? "Protegido" : "Excluir"}
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
                  setShowTypeModal(false);
                  handleCancelTypeEdit();
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-medium transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Orçamento */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={cancelDelete}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Orçamento?</h3>
              
              <p className="text-xs text-gray-600 mb-1">
                Você está prestes a excluir:
              </p>
              <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                {confirmModal.budgetName}
              </p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Tipo */}
      {confirmTypeModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={cancelDeleteType}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Tag className="text-purple-600" size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Tipo?</h3>
              
              <p className="text-xs text-gray-600 mb-1">
                Você está prestes a excluir:
              </p>
              <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                {confirmTypeModal.typeName}
              </p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDeleteType}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteType}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Orçamento */}
      {showDetailsModal && selectedBudget && (
        <div className="print-container fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white print:block" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden print:max-w-full print:shadow-none print:rounded-none print:max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between print:bg-white print:border-b-2 print:border-blue-600 print:px-3 print:py-2">
              <div className="flex items-center gap-3 print:gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center print:w-8 print:h-8 print:bg-blue-100">
                  <FileText className="text-white print:text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white print:text-blue-900 print:text-lg">Orçamento #{selectedBudget.budget_number || '?'}</h2>
                  <p className="text-blue-100 text-sm print:text-gray-600 print:text-xs">ID: {selectedBudget.budget_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white print:hidden"
                  title="Imprimir"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white print:hidden"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] print:p-3 print:overflow-visible print:max-h-full">
              {/* Status Badge com Tooltip */}
              <div className="mb-4 flex items-center gap-3 flex-wrap print:mb-2 print:gap-2">
                {(() => {
                  const statusColors = {
                    pending: { bg: '#FEF3C7', color: '#D97706', label: 'Pendente' },
                    approved: { bg: '#D1FAE5', color: '#059669', label: 'Aprovado' },
                    rejected: { bg: '#FEE2E2', color: '#DC2626', label: 'Rejeitado' }
                  };
                  const statusStyle = statusColors[selectedBudget.status] || statusColors.pending;
                  const statusInfo = selectedBudget?.statusBudget;
                  const tooltipText = statusInfo?.description 
                    ? `${statusStyle.label}: ${statusInfo.description}` 
                    : statusStyle.label;
                  
                  return (
                    <div className="relative group">
                      <span 
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full cursor-help print:px-2 print:py-1 print:text-xs print:gap-1"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                      >
                        <span className="w-2 h-2 rounded-full print:w-1.5 print:h-1.5" style={{ backgroundColor: statusStyle.color }}></span>
                        {statusStyle.label}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none print:hidden">
                        {tooltipText}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-4px] border-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  );
                })()}
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 print:px-2 print:text-[10px]">
                  {getTypeName(selectedBudget)}
                </span>
              </div>

              {/* Descrição Destaque */}
              {(selectedBudget.description_budget || selectedBudget.description || selectedBudget.notes) && (
                <div className="mb-4 space-y-3 print:mb-2 print:space-y-2">
                  {selectedBudget.description_budget && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200 print:p-2 print:border print:bg-white">
                      <div className="flex items-center gap-2 mb-1.5 print:mb-1">
                        <svg className="w-4 h-4 text-indigo-600 print:w-3 print:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs font-bold text-indigo-900 uppercase print:text-[10px]">Descrição do Orçamento</p>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap print:text-[11px] print:leading-tight">{selectedBudget.description_budget}</p>
                    </div>
                  )}

                  {selectedBudget.description && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 print:p-2 print:border print:bg-white">
                      <div className="flex items-center gap-2 mb-1.5 print:mb-1">
                        <svg className="w-4 h-4 text-blue-600 print:w-3 print:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs font-bold text-blue-900 uppercase print:text-[10px]">Detalhes</p>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap print:text-[11px] print:leading-tight">{selectedBudget.description}</p>
                    </div>
                  )}
                  
                  {selectedBudget.notes && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 print:p-2 print:border print:bg-white">
                      <div className="flex items-center gap-2 mb-1.5 print:mb-1">
                        <svg className="w-4 h-4 text-yellow-600 print:w-3 print:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <p className="text-xs font-bold text-yellow-700 uppercase print:text-[10px]">Observações</p>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap print:text-[11px] print:leading-tight">{selectedBudget.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                {/* Cliente */}
                <div className="bg-blue-50 rounded-lg p-3 print:p-2 print:border print:bg-white">
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-2 print:text-[10px] print:mb-1">Cliente</p>
                  <div className="flex items-center gap-3 print:gap-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 print:w-8 print:h-8">
                      <span className="text-blue-600 font-bold text-lg print:text-sm">
                        {getClientName(selectedBudget)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate print:text-sm">{getClientName(selectedBudget)}</p>
                      <p className="text-sm text-gray-600 truncate print:text-[10px]">{selectedBudget.client?.email || '-'}</p>
                      <p className="text-sm text-gray-600 print:text-[10px]">{selectedBudget.client?.phone || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Funcionário */}
                <div className="bg-purple-50 rounded-lg p-3 print:p-2 print:border print:bg-white">
                  <p className="text-xs font-semibold text-purple-600 uppercase mb-2 print:text-[10px] print:mb-1">Funcionário Responsável</p>
                  <div className="flex items-center gap-3 print:gap-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 print:w-8 print:h-8">
                      <span className="text-purple-600 font-bold text-lg print:text-sm">
                        {getEmployeeName(selectedBudget)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate print:text-sm">{getEmployeeName(selectedBudget)}</p>
                      <p className="text-sm text-gray-600 truncate print:text-[10px]">{selectedBudget.employee?.email || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Valor */}
                <div className="bg-emerald-50 rounded-lg p-3 print:p-2 print:border print:bg-white">
                  <p className="text-xs font-semibold text-emerald-600 uppercase mb-2 print:text-[10px] print:mb-1">Valor do Orçamento</p>
                  <p className="text-3xl font-bold text-emerald-600 print:text-xl">{formatCurrency(selectedBudget.value)}</p>
                </div>

                {/* Data */}
                <div className="bg-gray-50 rounded-lg p-3 print:p-2 print:border print:bg-white">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-2 print:text-[10px] print:mb-1">Data de Criação</p>
                  <p className="text-2xl font-bold text-gray-900 print:text-lg">{formatDate(selectedBudget.created_at || selectedBudget.date)}</p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="mt-4 flex gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-all font-medium"
                  title="Imprimir Orçamento"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    navigate(`/admin/orcamentos/editar/${selectedBudget.budget_id}`);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-all font-medium"
                >
                  <Edit size={18} />
                  Editar
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Estilos de Impressão */}
            <style jsx>{`
              @media print {
                @page {
                  size: A4;
                  margin: 8mm;
                }
                
                body * {
                  visibility: hidden;
                }
                
                .print-container,
                .print-container * {
                  visibility: visible;
                }
                
                .print-container {
                  position: static !important;
                  background: white !important;
                  padding: 0 !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                  overflow: visible !important;
                  page-break-inside: avoid !important;
                  page-break-before: avoid !important;
                  page-break-after: avoid !important;
                  break-inside: avoid !important;
                  break-before: avoid !important;
                  break-after: avoid !important;
                  transform: scale(0.78);
                  transform-origin: top left;
                }
                
                .fixed.z-\\[9999\\],
                .fixed.z-\\[9999\\] * {
                  visibility: visible;
                }
                
                .fixed.z-\\[9999\\] {
                  position: static !important;
                  background: white !important;
                  padding: 0 !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                  overflow: visible !important;
                }
                
                .print\\:hidden {
                  display: none !important;
                }
                
                .print\\:p-0 {
                  padding: 0 !important;
                }
                
                .print\\:block {
                  display: block !important;
                }
                
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                
                /* Compactar espaçamentos MÁXIMO */
                .print\\:mb-1 {
                  margin-bottom: 0.15rem !important;
                }
                
                .print\\:mb-2 {
                  margin-bottom: 0.3rem !important;
                }
                
                .print\\:gap-2 {
                  gap: 0.3rem !important;
                }
                
                .print\\:p-2 {
                  padding: 0.3rem !important;
                }
                
                .print\\:p-3 {
                  padding: 0.4rem !important;
                }
                
                .print\\:py-1 {
                  padding-top: 0.15rem !important;
                  padding-bottom: 0.15rem !important;
                }
                
                .print\\:py-2 {
                  padding-top: 0.3rem !important;
                  padding-bottom: 0.3rem !important;
                }
                
                .print\\:px-2 {
                  padding-left: 0.3rem !important;
                  padding-right: 0.3rem !important;
                }
                
                .print\\:px-3 {
                  padding-left: 0.4rem !important;
                  padding-right: 0.4rem !important;
                }
                
                /* Ajustar tamanhos de texto - MENORES */
                .print\\:text-xs {
                  font-size: 0.65rem !important;
                  line-height: 0.9rem !important;
                }
                
                .print\\:text-sm {
                  font-size: 0.75rem !important;
                  line-height: 1rem !important;
                }
                
                .print\\:text-lg {
                  font-size: 0.9rem !important;
                  line-height: 1.2rem !important;
                }
                
                .print\\:text-xl {
                  font-size: 1rem !important;
                  line-height: 1.3rem !important;
                }
                
                .print\\:text-\\[10px\\] {
                  font-size: 8px !important;
                  line-height: 11px !important;
                }
                
                .print\\:text-\\[11px\\] {
                  font-size: 9px !important;
                  line-height: 12px !important;
                }
                
                .print\\:leading-tight {
                  line-height: 1.1 !important;
                }
                
                /* Ajustar grids */
                .print\\:space-y-2 > * + * {
                  margin-top: 0.3rem !important;
                }
                
                .print\\:gap-2 {
                  gap: 0.3rem !important;
                }
                
                /* Garantir backgrounds */
                .print\\:bg-white {
                  background-color: white !important;
                }
                
                .print\\:border {
                  border: 1px solid #d1d5db !important;
                }
                
                .print\\:border-b-2 {
                  border-bottom: 1.5px solid !important;
                }
                
                /* Reduzir tamanho dos avatares */
                .print\\:w-8 {
                  width: 1.5rem !important;
                  height: 1.5rem !important;
                }
                
                .print\\:h-8 {
                  height: 1.5rem !important;
                }
                
                /* Reduzir rounded */
                .print\\:rounded-none {
                  border-radius: 0 !important;
                }
                
                /* Compactar grid */
                .print\\:overflow-visible {
                  overflow: visible !important;
                }
                
                .print\\:max-h-full {
                  max-height: 100% !important;
                }
                
                /* Forçar quebra de página */
                .print\\:p-3 {
                  page-break-inside: avoid !important;
                }
                
                /* Reduzir ainda mais espaços em branco */
                .bg-gradient-to-r.print\\:bg-white {
                  padding-top: 0.3rem !important;
                  padding-bottom: 0.3rem !important;
                }
                
                .bg-gradient-to-br.print\\:bg-white,
                .bg-blue-50.print\\:bg-white,
                .bg-purple-50.print\\:bg-white,
                .bg-emerald-50.print\\:bg-white,
                .bg-gray-50.print\\:bg-white,
                .bg-yellow-50.print\\:bg-white {
                  margin-bottom: 0.25rem !important;
                  padding: 0.3rem !important;
                }
              }
            `}</style>
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
