import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, Calendar, FileText, User, Building, Cpu, Plus, Minus, Trash2, Layers } from 'lucide-react';
import { budgetApi, budgetTypesApi, clientsApi, employeesApi, ordersServiceApi, machineApi } from '../../../services/api';
import { createOrderServiceFromBudget as createOrderServiceHelper } from './createOrderService';
import Toast from '../../../components/Toast';

export default function OrcamentoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    client_id: '',
    employee_id: '',
    type_id: '',
    status: 'pending', // pending, approved, rejected
    value: '',
    description_budget: '',
    date_status_update: new Date().toISOString().split('T')[0],
  });

  const [budgetTypes, setBudgetTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableMachines, setAvailableMachines] = useState([]);
  const [availableMachinesLoading, setAvailableMachinesLoading] = useState(false);
  const [budgetMachines, setBudgetMachines] = useState([]);
  const [budgetMachinesLoading, setBudgetMachinesLoading] = useState(false);
  const [machineSelection, setMachineSelection] = useState({ category_id: '', machine_id: '', quantity: 1 });
  const [addingMachine, setAddingMachine] = useState(false);
  const [machineActions, setMachineActions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalEntryData, setOriginalEntryData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const UNCATEGORIZED_KEY = '__none__';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const normalizeApiResponse = (res) => {
    if (!res) return [];
    const payload = res.data;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    return [];
  };

  useEffect(() => {
    loadOptions();
    loadMachinesCatalog();
    if (id) {
      loadBudget();
    } else {
      setBudgetMachines([]);
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      const [typesRes, clientsRes, employeesRes] = await Promise.all([
        budgetTypesApi.getAll(),
        clientsApi.getAll(),
        employeesApi.getAll(),
      ]);
      const types = normalizeApiResponse(typesRes);
      const clientsData = normalizeApiResponse(clientsRes);
      const employeesData = normalizeApiResponse(employeesRes);

      setBudgetTypes(types);
      setClients(clientsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
      showToast('Erro ao carregar opções do formulário', 'error');
    }
  };

  const loadMachinesCatalog = async () => {
    try {
      setAvailableMachinesLoading(true);
      const response = await machineApi.getAll();
      setAvailableMachines(normalizeApiResponse(response));
    } catch (error) {
      console.error('Erro ao carregar máquinas disponíveis:', error);
      showToast('Não foi possível carregar a lista de máquinas', 'error');
    } finally {
      setAvailableMachinesLoading(false);
    }
  };

  const loadBudgetMachines = async (budgetId) => {
    if (!budgetId) return;
    try {
      setBudgetMachinesLoading(true);
      const response = await budgetApi.listMachines(budgetId);
      const items = normalizeApiResponse(response).map(item => ({ ...item, isLocal: false }));
      setBudgetMachines(items);
    } catch (error) {
      console.error('Erro ao carregar máquinas do orçamento:', error);
      showToast('Erro ao carregar máquinas vinculadas', 'error');
    } finally {
      setBudgetMachinesLoading(false);
    }
  };

  const loadBudget = async () => {
    try {
      setLoading(true);
      const response = await budgetApi.getById(id);
      const budget = response.data;
      
      // A API retorna objetos aninhados, então precisamos extrair os IDs corretos
      setFormData({
        client_id: budget?.client?.client_id || '',
        employee_id: budget?.employee?.employee_id || '',
        type_id: budget?.type?.type_id || '',
        status: budget.status || 'pending',
        value: budget.value || '',
        description_budget: budget.description_budget || '',
        date_status_update: budget.date_status_update ? budget.date_status_update.split('T')[0] : new Date().toISOString().split('T')[0],
      });
      setOriginalEntryData(budget);
      await loadBudgetMachines(budget?.budget_id || id);
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      showToast('Erro ao carregar orçamento', 'error');
      navigate('/admin/orcamentos');
    } finally {
      setLoading(false);
    }
  };

  const syncLocalMachines = async (budgetId) => {
    const pending = budgetMachines.filter(item => !item.budget_machine_id || item.isLocal);
    if (!pending.length) {
      return { success: true };
    }

    try {
      await Promise.all(
        pending.map(item => budgetApi.addMachine(budgetId, {
          machine_id: item.machine_id,
          quantity: item.quantity,
        })),
      );
      return { success: true };
    } catch (error) {
      console.error('Erro ao sincronizar máquinas do orçamento:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao vincular máquinas ao orçamento',
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Per DB schema several fields are nullable; no strict client requirement here.

    try {
      setSaving(true);
      const dataToSend = {
        client_id: formData.client_id || null,
        employee_id: formData.employee_id || null,
        type_id: formData.type_id ? parseInt(formData.type_id) : null,
        status: formData.status,
        value: formData.value ? parseFloat(formData.value) : null,
        description_budget: formData.description_budget || null,
        date_status_update: formData.date_status_update,
      };

      // Verificar se está mudando para "approved" (seja criação ou edição)
      const wasApproved = formData.status === 'approved';
      const previousStatus = originalEntryData?.status; // Para edição, verificar mudança de status
      const justApproved = wasApproved && (!isEditing || previousStatus !== 'approved');

      let savedBudget = null;

      let budgetIdForMachines = id;

      if (isEditing) {
        const response = await budgetApi.update(id, dataToSend);
        savedBudget = response.data;
        budgetIdForMachines = savedBudget?.budget_id || id;
        
        // Se acabou de aprovar (mudou de outro status para approved)
        if (justApproved) {
          await createOrderServiceFromBudget(savedBudget || { budget_id: id, ...dataToSend });
        }

        // Se o cliente mudou, atualizar o nome da OS vinculada
        if (originalEntryData?.client_id !== formData.client_id && formData.client_id) {
          await updateLinkedOrderServiceName(budgetIdForMachines, formData.client_id);
        }

        const syncResult = await syncLocalMachines(budgetIdForMachines);
        if (!syncResult.success) {
          showToast(syncResult.message, 'error');
        }

        navigate('/admin/orcamentos', {
          state: { 
            message: justApproved 
              ? syncResult.success
                ? 'Orçamento aprovado e OS criada automaticamente!' 
                : 'Orçamento aprovado, porém houve erro ao vincular máquinas.'
              : syncResult.success
                ? 'Orçamento atualizado com sucesso!' 
                : 'Orçamento atualizado, porém houve erro ao vincular máquinas.', 
            type: syncResult.success ? 'success' : 'warning' 
          }
        });
      } else {
        const response = await budgetApi.create(dataToSend);
        savedBudget = response.data;
        budgetIdForMachines = savedBudget?.budget_id;

        // Se já está sendo criado como aprovado
        if (wasApproved) {
          await createOrderServiceFromBudget(savedBudget);
        }

        let syncResult = { success: true };
        if (budgetIdForMachines) {
          syncResult = await syncLocalMachines(budgetIdForMachines);
          if (!syncResult.success) {
            showToast(syncResult.message, 'error');
          }
        }

        navigate('/admin/orcamentos', {
          state: { 
            message: wasApproved 
              ? syncResult.success
                ? 'Orçamento criado e OS gerada automaticamente!' 
                : 'Orçamento criado, OS gerada, porém houve erro ao vincular máquinas.'
              : syncResult.success
                ? 'Orçamento criado com sucesso!' 
                : 'Orçamento criado, porém houve erro ao vincular máquinas.', 
            type: syncResult.success ? 'success' : 'warning' 
          }
        });
      }
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar orçamento', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Use shared helper to create OS so behaviour is identical to inline flow
  const createOrderServiceFromBudget = async (budget) =>
    createOrderServiceHelper(budget, clients, employees, ordersServiceApi, showToast);

  // Atualizar nome da OS quando o cliente mudar
  const updateLinkedOrderServiceName = async (budgetId, newClientId) => {
    try {
      // Buscar a OS vinculada a este orçamento
      const ordersResponse = await ordersServiceApi.getAll();
      const allOrders = ordersResponse.data?.items || ordersResponse.data || [];
      const linkedOrder = allOrders.find(o => o.budget_id === budgetId);
      
      if (!linkedOrder) {
        return; // Não há OS vinculada ainda
      }

      // Buscar dados do novo cliente
      const client = clients.find(c => c.client_id === newClientId);
      if (!client) {
        return;
      }

      // Recalcular o nome da OS usando a mesma lógica do createOrderService
      const clientRef = (client.reference || client.name_client.replace(/\s+/g, '').substring(0, 3)).toUpperCase();
      
      // Buscar o orçamento atualizado para pegar o budget_number e data
      const budgetResponse = await budgetApi.getById(budgetId);
      const budget = budgetResponse.data;
      
      const budgetNumericId = budget.budget_number || budget.id || '0';
      const approvalDateRaw = budget.date_status_update || budget.created_at || new Date().toISOString();
      const approvalDate = new Date(approvalDateRaw);
      const monthAbbr = approvalDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
      const year2 = approvalDate.getFullYear().toString().slice(-2);
      
      const newOsName = `${clientRef}${budgetNumericId}${monthAbbr}${year2}`;
      
      // Atualizar a OS com o novo nome
      await ordersServiceApi.update(linkedOrder.os_id, { name_os: newOsName });
      
      console.log(`✅ Nome da OS atualizado de "${linkedOrder.name_os}" para "${newOsName}"`);
    } catch (error) {
      console.error('Erro ao atualizar nome da OS:', error);
      // Não exibir erro para o usuário, é uma atualização em background
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMachineSelectionChange = (event) => {
    const { name, value } = event.target;

    if (name === 'category_id') {
      setMachineSelection(prev => ({ ...prev, category_id: value, machine_id: '' }));
      return;
    }

    if (name === 'machine_id') {
      setMachineSelection(prev => ({ ...prev, machine_id: value }));
      return;
    }

    const numeric = Math.max(1, parseInt(value, 10) || 1);
    setMachineSelection(prev => ({ ...prev, quantity: numeric }));
  };

  const setMachineAction = (key, status) => {
    setMachineActions(prev => {
      if (!status) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: status };
    });
  };

  const handleAddMachine = async () => {
    const { category_id, machine_id, quantity } = machineSelection;

    if (!category_id) {
      showToast('Selecione uma categoria de maquinário', 'error');
      return;
    }

    if (!machine_id) {
      showToast('Selecione uma máquina para adicionar', 'error');
      return;
    }

    const machine = availableMachines.find(item => item.machine_id === machine_id);
    if (!machine) {
      showToast('Máquina não encontrada na lista disponível', 'error');
      return;
    }

    if (budgetMachines.some(item => item.machine_id === machine_id)) {
      showToast('Esta máquina já foi adicionada ao orçamento', 'error');
      return;
    }

    if (isEditing) {
      try {
        setAddingMachine(true);
        const response = await budgetApi.addMachine(id, { machine_id, quantity });
        const created = response.data || response;
        setBudgetMachines(prev => [...prev, { ...created, isLocal: false }]);
        showToast('Máquina adicionada ao orçamento!', 'success');
      } catch (error) {
        console.error('Erro ao adicionar máquina ao orçamento:', error);
        showToast(error.response?.data?.message || 'Erro ao adicionar máquina', 'error');
      } finally {
        setAddingMachine(false);
      }
    } else {
      const tempAssociation = {
        budget_machine_id: `temp-${Date.now()}`,
        budget_id: null,
        machine_id,
        quantity,
        machine,
        category_id,
        isLocal: true,
      };
      setBudgetMachines(prev => [...prev, tempAssociation]);
      showToast('Máquina adicionada. Ela será vinculada após salvar o orçamento.', 'success');
    }

    setMachineSelection({ category_id, machine_id: '', quantity: 1 });
  };

  const updateMachineQuantity = async (entry, newQuantity) => {
    if (newQuantity < 1) return;
    const key = entry.budget_machine_id || entry.machine_id;

    if (!entry.budget_machine_id || entry.isLocal || !isEditing) {
      setBudgetMachines(prev => prev.map(item =>
        item.budget_machine_id === entry.budget_machine_id || item.machine_id === entry.machine_id
          ? { ...item, quantity: newQuantity }
          : item,
      ));
      return;
    }

    const previous = entry.quantity;
    setBudgetMachines(prev => prev.map(item =>
      item.budget_machine_id === entry.budget_machine_id ? { ...item, quantity: newQuantity } : item,
    ));
    setMachineAction(key, 'updating');

    try {
      await budgetApi.updateMachine(id, entry.budget_machine_id, { quantity: newQuantity });
      showToast('Quantidade atualizada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar quantidade da máquina:', error);
      setBudgetMachines(prev => prev.map(item =>
        item.budget_machine_id === entry.budget_machine_id ? { ...item, quantity: previous } : item,
      ));
      showToast(error.response?.data?.message || 'Erro ao atualizar quantidade', 'error');
    } finally {
      setMachineAction(key, null);
    }
  };

  const handleRemoveMachine = async (entry) => {
    const key = entry.budget_machine_id || entry.machine_id;

    if (!entry.budget_machine_id || entry.isLocal || !isEditing) {
      setBudgetMachines(prev => prev.filter(item =>
        item.budget_machine_id !== entry.budget_machine_id && item.machine_id !== entry.machine_id,
      ));
      showToast('Máquina removida da lista', 'success');
      return;
    }

    setMachineAction(key, 'removing');
    try {
      await budgetApi.removeMachine(id, entry.budget_machine_id);
      setBudgetMachines(prev => prev.filter(item => item.budget_machine_id !== entry.budget_machine_id));
      showToast('Máquina removida do orçamento', 'success');
    } catch (error) {
      console.error('Erro ao remover máquina do orçamento:', error);
      showToast(error.response?.data?.message || 'Erro ao remover máquina', 'error');
    } finally {
      setMachineAction(key, null);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const machineCategories = useMemo(() => {
    const map = new Map();
    availableMachines.forEach(machine => {
      const categoryId = machine.category?.category_id ?? UNCATEGORIZED_KEY;
      if (!map.has(categoryId)) {
        map.set(categoryId, machine.category?.name ?? 'Sem categoria');
      }
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [availableMachines]);

  const filteredMachineOptions = useMemo(() => {
    if (!machineSelection.category_id) {
      return [];
    }

    return availableMachines
      .filter(machine => {
        const categoryId = machine.category?.category_id ?? UNCATEGORIZED_KEY;
        return categoryId === machineSelection.category_id;
      })
      .map(machine => ({
        value: machine.machine_id,
        label: machine.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [availableMachines, machineSelection.category_id]);

  const totalMachines = useMemo(() => (
    budgetMachines.reduce((total, item) => total + Number(item.quantity || 0), 0)
  ), [budgetMachines]);

  const hasLocalMachines = useMemo(() => (
    budgetMachines.some(item => item.isLocal)
  ), [budgetMachines]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="text-gray-600 mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-5xl lg:mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/orcamentos')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar para Orçamentos</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isEditing ? 'Atualize as informações do orçamento' : 'Preencha as informações para criar um novo orçamento'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Informações Básicas */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600" size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                      <option key={client.client_id} value={client.client_id}>
                        {client.name_client}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Funcionário Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aprovado por
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  
                  >
                    <option value="">Selecione um funcionário</option>
                    {employees.map(employee => (
                      <option key={employee.employee_id} value={employee.employee_id}>
                        {employee.name || employee.name_employee}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo de Orçamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Orçamento
                </label>
                <select
                  name="type_id"
                  value={formData.type_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                
                >
                  <option value="">Selecione um tipo</option>
                  {budgetTypes.map(type => (
                    <option key={type.type_id} value={type.type_id}>
                      {type.name_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* legacy backend-managed status selector removed; use process status enum below */}

              {/* Status (Enum) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status do Processo *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                
                >
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Valores */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Valores</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor do Orçamento
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
                {formData.value && (
                  <p className="text-xs text-gray-500 mt-1">
                    Valor: {formatCurrency(formData.value)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2.1: Máquinas */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Cpu className="text-emerald-600" size={18} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Máquinas do Orçamento</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                  Total de equipamentos: {totalMachines}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-3">
                <div className="w-full md:flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      name="category_id"
                      value={machineSelection.category_id}
                      onChange={handleMachineSelectionChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      disabled={availableMachinesLoading || addingMachine}
                    >
                      <option value="" disabled>
                        {availableMachinesLoading ? 'Carregando categorias...' : 'Selecione uma categoria'}
                      </option>
                      {machineCategories.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="w-full md:flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Máquina</label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      name="machine_id"
                      value={machineSelection.machine_id}
                      onChange={handleMachineSelectionChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      disabled={availableMachinesLoading || addingMachine || !machineSelection.category_id}
                    >
                      <option value="" disabled>
                        {!machineSelection.category_id
                          ? 'Escolha uma categoria primeiro'
                          : filteredMachineOptions.length
                            ? 'Selecione uma máquina'
                            : 'Nenhuma máquina disponível'}
                      </option>
                      {filteredMachineOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-end gap-3 w-full md:w-auto">
                  <div className="w-full md:w-24">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Qtd.</label>
                    <input
                      type="number"
                      min="1"
                      name="quantity"
                      value={machineSelection.quantity}
                      onChange={handleMachineSelectionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      disabled={addingMachine}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMachine}
                    disabled={addingMachine || availableMachinesLoading || !machineSelection.machine_id}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {addingMachine ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus size={16} />
                    )}
                    Adicionar
                  </button>
                </div>
              </div>

              {!isEditing && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-md">
                  As máquinas adicionadas serão vinculadas automaticamente após salvar o orçamento.
                </p>
              )}

              {budgetMachinesLoading ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg py-10 text-center text-sm text-gray-500">
                  Carregando máquinas vinculadas...
                </div>
              ) : budgetMachines.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg py-10 text-center text-sm text-gray-500">
                  Nenhuma máquina vinculada a este orçamento ainda.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {budgetMachines.map(entry => {
                    const actionKey = entry.budget_machine_id || entry.machine_id;
                    const actionStatus = machineActions[actionKey];
                    const isUpdating = actionStatus === 'updating';
                    const isRemoving = actionStatus === 'removing';
                    const disableControls = isUpdating || isRemoving;

                    return (
                      <div
                        key={actionKey}
                        className={`border rounded-md p-3 text-sm transition-all ${
                          disableControls
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1">
                            <div className="w-8 h-8 bg-emerald-100 rounded-md flex items-center justify-center flex-shrink-0">
                              <Cpu className="text-emerald-600" size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{entry.machine?.name || 'Máquina'}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {entry.machine?.category?.name || 'Categoria não informada'}
                              </p>
                              {entry.machine?.description && (
                                <p className="text-[11px] leading-tight text-gray-600 mt-1 line-clamp-2">{entry.machine.description}</p>
                              )}
                              {entry.isLocal && (
                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-semibold rounded-full uppercase tracking-wide">
                                  Pendente de sincronização
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMachine(entry)}
                            className="p-2 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                            disabled={disableControls}
                            title="Remover máquina"
                          >
                            {isRemoving ? (
                              <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-md border border-dashed border-emerald-200 px-2 py-1.5 bg-emerald-50/60">
                          <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Quantidade</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateMachineQuantity(entry, entry.quantity - 1)}
                              className="p-1 rounded-md border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={disableControls || entry.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-semibold text-gray-900 min-w-[28px] text-center">
                              {entry.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateMachineQuantity(entry, entry.quantity + 1)}
                              className="p-1 rounded-md border border-gray-300 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                              disabled={disableControls}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hasLocalMachines && isEditing && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-md">
                  Existem máquinas pendentes de sincronização. Clique em "Atualizar Orçamento" para salvar as alterações.
                </p>
              )}
            </div>
          </div>

          {/* Seção 3: Data */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-purple-600" size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Data de Atualização</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Atualização do Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Atualização do Status *
                </label>
                <input
                  type="date"
                  name="date_status_update"
                  value={formData.date_status_update}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Descrição */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="text-orange-600" size={18} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Descrição</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição do Orçamento
              </label>
              <textarea
                name="description_budget"
                value={formData.description_budget}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite informações adicionais sobre o orçamento..."
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/admin/orcamentos')}
              className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Atualizar Orçamento' : 'Criar Orçamento'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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
