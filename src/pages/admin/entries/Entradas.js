import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, X, TrendingUp, DollarSign, Calendar, Building, FileText, AlertCircle, CheckCircle, Clock, Filter, Settings, CreditCard, ChevronRight, ChevronDown } from 'lucide-react';
import { installmentsApi } from '../../../services/api';
import { entriesApi, employeesApi, accountsApi, paymentSituationApi, ordersServiceApi } from '../../../services/api';
import Toast from '../../../components/Toast';
import { EntryModal } from './EntryModal';

export default function Entradas() {
  const location = useLocation();
  
  // Estado para expand/collapse de parcelas
  const [expandedRows, setExpandedRows] = useState({});
  // Estado para edição de parcela
  const [editingInstallment, setEditingInstallment] = useState(null);
  const [installmentEditForm, setInstallmentEditForm] = useState({ value: '', due_date: '', payment_date: '' });
  const [installmentActionLoading, setInstallmentActionLoading] = useState(false);

  // Função para expandir/colapsar parcelas
  const toggleExpandRow = (entryId) => {
    setExpandedRows(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  // Função para marcar parcela como paga
  const handleMarkInstallmentPaid = async (installment) => {
    if (!window.confirm('Deseja marcar esta parcela como paga?')) return;
    setInstallmentActionLoading(true);
    try {
      await installmentsApi.update(installment.installment_id, {
        payment_date: new Date().toISOString().split('T')[0],
        payment_status_id: 1
      });
      showToast('Parcela marcada como paga!', 'success');
      loadData();
    } catch (err) {
      showToast('Erro ao marcar parcela como paga', 'error');
    } finally {
      setInstallmentActionLoading(false);
    }
  };

  // Função para abrir modal de edição de parcela
  const handleEditInstallment = (installment) => {
    setEditingInstallment(installment);
    setInstallmentEditForm({
      value: installment.value,
      due_date: installment.due_date,
      payment_date: installment.payment_date || ''
    });
  };

  // Função para salvar edição de parcela
  const handleSaveInstallmentEdit = async () => {
    setInstallmentActionLoading(true);
    try {
      await installmentsApi.update(editingInstallment.installment_id, {
        value: installmentEditForm.value,
        due_date: installmentEditForm.due_date,
        payment_date: installmentEditForm.payment_date || null
      });
      showToast('Parcela atualizada!', 'success');
      setEditingInstallment(null);
      loadData();
    } catch (err) {
      showToast('Erro ao atualizar parcela', 'error');
    } finally {
      setInstallmentActionLoading(false);
    }
  };
  // Estado para fluxo de parcelamento
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptCount, setInstallPromptCount] = useState(2);
  const [selectedPaymentType, setSelectedPaymentType] = useState(null); // null | 'vista' | 'parcelado'
  const [step, setStep] = useState('prompt'); // 'prompt' | 'general' | 'installments'

  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentSituations, setPaymentSituations] = useState([]);
  const [ordersService, setOrdersService] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    employee_id: '',
    account_id: '',
    payment_situation_id: '',
    os_id: '',
    month_faturamento: '',
    payment_date: '',
  });
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  
  const [showModal, setShowModal] = useState(false);
  const [entryForm, setEntryForm] = useState({
    employee_id: '',
    NF: '',
    account_id: '',
    company: '',
    value: 0,
    date_faturamento: '',
    due_date: '',
    payment_situation_id: '',
    date_payment: '',
    os_id: ''
  });
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installments, setInstallments] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [originalEntryData, setOriginalEntryData] = useState(null); // Armazena dados originais
  const [entryLoading, setEntryLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, company: '' });
  
  // Modal e estados para Situação de Pagamento
  const [showSituationModal, setShowSituationModal] = useState(false);
  const [situationForm, setSituationForm] = useState({ name: '', description: '' });
  const [editingSituation, setEditingSituation] = useState(null);
  const [situationLoading, setSituationLoading] = useState(false);
  const [confirmSituationModal, setConfirmSituationModal] = useState({ show: false, situationId: null, situationName: '' });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [osSearchTerm, setOsSearchTerm] = useState('');
  const [osFilterSearchTerm, setOsFilterSearchTerm] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar por data quando vier da URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      setFilters(prev => ({ ...prev, payment_date: dateParam }));
    }
  }, [location.search]);

  useEffect(() => {
    if (showModal || confirmModal.show || showSituationModal || confirmSituationModal.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, confirmModal.show, showSituationModal, confirmSituationModal.show]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesRes, employeesRes, accountsRes, situationsRes, ordersRes] = await Promise.all([
        entriesApi.getAll(),
        employeesApi.getAll(),
        accountsApi.getAll(),
        paymentSituationApi.getAll(),
        ordersServiceApi.getAll(),
      ]);
      
      const entriesData = entriesRes.data?.items || entriesRes.data || [];
      
      setEntries(entriesData);
      setTotalItems(entriesData.length);
      // Normalize responses to arrays to avoid runtime errors when using .map
      const normalizeList = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        // Fallback: if object, wrap in array
        if (typeof res === 'object') return [res];
        return [];
      };

      setEmployees(normalizeList(employeesRes.data));
      setAccounts(normalizeList(accountsRes.data));
      setPaymentSituations(normalizeList(situationsRes.data));
      setOrdersService(normalizeList(ordersRes.data));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Marcar entrada como recebida
  const handleReceiveEntry = async (entry) => {
    try {
      const today = new Date();
      const isoDate = today.toISOString().split('T')[0];
      // Atualizar backend
      await entriesApi.update(entry.entries_id, { date_payment: isoDate });
      // Atualizar estado local
      setEntries(prev => prev.map(e => e.entries_id === entry.entries_id ? { ...e, date_payment: isoDate } : e));
      showToast('Entrada marcada como recebida', 'success');
    } catch (err) {
      console.error('Erro ao marcar como recebida:', err);
      showToast('Erro ao marcar como recebida', 'error');
    }
  };

  // Ao abrir modal, mostra prompt de parcelamento
  const handleOpenModal = () => {
    setEntryForm({
      employee_id: '',
      NF: '',
      account_id: '',
      company: '',
      value: 0,
      date_faturamento: '',
      due_date: '',
      payment_situation_id: '',
      date_payment: '',
      os_id: ''
    });
    setIsInstallment(false);
    setInstallmentCount(1);
    setEditingEntry(null);
    setOriginalEntryData(null);
    setInstallPromptCount(2);
    setSelectedPaymentType(null); // Reset selection
    setShowInstallPrompt(true);
    setStep('prompt');
    setShowModal(false);
  };

  // Prompt de parcelamento
  const renderInstallPrompt = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header com fundo gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 relative">
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Fechar"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <DollarSign size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Nova Entrada</h2>
            <p className="text-white/80 text-sm mt-1">Como deseja registrar?</p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Opção: À Vista */}
          <button
            onClick={() => setSelectedPaymentType('vista')}
            className={`w-full group relative overflow-hidden border-2 rounded-lg p-4 transition-all duration-200 transform hover:scale-105 ${
              selectedPaymentType === 'vista'
                ? 'bg-emerald-100 border-emerald-500 shadow-lg'
                : 'bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-emerald-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedPaymentType === 'vista'
                  ? 'bg-emerald-500/30'
                  : 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
              }`}>
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-base font-bold text-gray-900">À Vista</p>
                <p className="text-xs text-gray-600 mt-0.5">Pagamento único e imediato</p>
              </div>
              {selectedPaymentType === 'vista' && (
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-white" />
                </div>
              )}
            </div>
          </button>

          {/* Opção: Parcelado */}
          <button
            onClick={() => setSelectedPaymentType('parcelado')}
            className={`w-full group relative overflow-hidden border-2 rounded-lg p-4 transition-all duration-200 transform hover:scale-105 ${
              selectedPaymentType === 'parcelado'
                ? 'bg-blue-100 border-blue-500 shadow-lg'
                : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedPaymentType === 'parcelado'
                  ? 'bg-blue-500/30'
                  : 'bg-blue-500/20 group-hover:bg-blue-500/30'
              }`}>
                <CreditCard size={24} className="text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-base font-bold text-gray-900">Parcelado</p>
                <p className="text-xs text-gray-600 mt-0.5">Dividir em múltiplas parcelas</p>
              </div>
              {selectedPaymentType === 'parcelado' && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-white" />
                </div>
              )}
            </div>
          </button>

          {/* Campo de Parcelas (aparece APENAS quando parcelado é selecionado) */}
          {selectedPaymentType === 'parcelado' && (
            <div className="pt-2 border-t border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-semibold text-gray-700">
                Quantidade de Parcelas
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={installPromptCount}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val) || val <= 0) {
                      setInstallPromptCount('');
                    } else if (val > 36) {
                      setInstallPromptCount(36);
                    } else {
                      setInstallPromptCount(val);
                    }
                  }}
                  className="w-full px-4 py-3 text-center text-lg font-bold border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  parcelas
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (selectedPaymentType === 'vista') {
                setIsInstallment(false);
                setInstallmentCount(1);
                setShowInstallPrompt(false);
                setStep('general');
                setShowModal(true);
              } else if (selectedPaymentType === 'parcelado') {
                setIsInstallment(true);
                setInstallmentCount(Number(installPromptCount));
                setShowInstallPrompt(false);
                setStep('general');
                setShowModal(true);
              }
            }}
            disabled={!selectedPaymentType}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium text-sm flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  // Renderização condicional do modal de entrada
  const renderEntryModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-white" size={20} />
            <h2 className="text-lg font-bold text-white">
              {editingEntry ? 'Editar Entrada' : 'Nova Entrada'}
            </h2>
              <span className="ml-2 inline-block text-xs bg-white/20 text-white px-2 py-0.5 rounded">
                {step}
              </span>
          </div>
          <button
            onClick={() => { setShowModal(false); setStep('prompt'); }}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSaveEntry} className="p-4 sm:p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Etapa 1: Informações gerais (exceto valores/datas) */}
          {step === 'general' && (
            <>
              {/* ...inputs para Empresa, NF, Ordem de Serviço, etc... */}
              {/* Valor total e datas gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Exemplo: */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor Total</label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    required
                    value={entryForm.value}
                    onChange={e => setEntryForm({ ...entryForm, value: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isInstallment}
                  />
                </div>
                {/* ...outros campos gerais... */}
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setStep('prompt'); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </>
          )}
          {/* Etapa 2: Parcelas */}
          {isInstallment && step === 'installments' && (
            <>
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-blue-600" />
                Parcelas
              </h3>
              <div className="space-y-2">
                {Array.from({ length: installmentCount }).map((_, idx) => (
                  <div key={idx} className="border-b pb-2 mb-2">
                    <div className="text-xs text-gray-600 font-medium mb-2">{installments[idx]?.installment_info || `${idx + 1}/${installmentCount}`}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor {idx + 1}/{installmentCount}</label>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          required
                          value={installments[idx]?.value || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setInstallments(insts => {
                              const arr = [...insts];
                              arr[idx] = { ...arr[idx], value: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Data Faturamento</label>
                        <input
                          type="date"
                          required
                          value={installments[idx]?.date_faturamento || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setInstallments(insts => {
                              const arr = [...insts];
                              arr[idx] = { ...arr[idx], date_faturamento: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Data Vencimento</label>
                        <input
                          type="date"
                          required
                          value={installments[idx]?.due_date || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setInstallments(insts => {
                              const arr = [...insts];
                              arr[idx] = { ...arr[idx], due_date: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setStep('prompt'); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  Salvar Parcelas
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );


  // --- O RESTANTE DO CÓDIGO DA FUNÇÃO CONTINUA ABAIXO ---

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    const formData = {
      employee_id: entry.employee?.employee_id || '',
      NF: entry.NF || '',
      account_id: entry.account?.account_id || '',
      company: entry.company || '',
      value: entry.value || 0,
      date_faturamento: entry.date_faturamento ? entry.date_faturamento.split('T')[0] : '',
      due_date: entry.due_date ? entry.due_date.split('T')[0] : '',
      payment_situation_id: entry.payment_situation?.payment_situation_id || '',
      date_payment: entry.date_payment ? entry.date_payment.split('T')[0] : '',
      os_id: entry.orders_service?.os_id || ''
    };
    setEntryForm(formData);
    setOriginalEntryData(formData); // Salva os dados originais

    // Se há parcelas (nova estrutura)
    if (entry.installments && entry.installments.length > 0) {
      const total = entry.installments.length;
      setIsInstallment(total > 1);
      setInstallmentCount(total);
      // Carrega as parcelas existentes
      const formattedInstallments = entry.installments.map(inst => ({
        index: inst.installment_number,
        value: inst.value || '',
        due_date: inst.due_date ? inst.due_date.split('T')[0] : '',
        payment_date: inst.payment_date ? inst.payment_date.split('T')[0] : null,
      }));
      setInstallments(formattedInstallments);
    } else {
      // Estrutura antiga (compatibilidade)
      setIsInstallment(false);
      setInstallmentCount(1);
      setInstallments([]);
    }

    setShowModal(true);
  };

    // When parcelado is toggled or installmentCount changes, initialize per-installment rows
    useEffect(() => {
      if (!isInstallment) {
        setInstallments([]);
        return;
      }

      const total = Math.max(1, Math.min(36, parseInt(String(installmentCount || '1'), 10)));
      // If current installments already match and have data, keep them
      if (Array.isArray(installments) && installments.length === total && installments.some(i => i.value || i.due_date)) {
        return;
      }

      const base = parseFloat(entryForm.value);
      const hasBase = !Number.isNaN(base) && base > 0;

      let newInst;
      if (hasBase) {
        const per = Math.floor((base / total) * 100) / 100;
        const totalAssigned = per * total;
        const remainder = Math.round((base - totalAssigned) * 100) / 100;

        newInst = Array.from({ length: total }).map((_, i) => ({
          index: i + 1,
          value: parseFloat((per + (i === 0 ? remainder : 0)).toFixed(2)),
          due_date: entryForm.due_date || '',
          payment_date: null,
        }));
      } else {
        newInst = Array.from({ length: total }).map((_, i) => ({
          index: i + 1,
          value: '',
          due_date: '',
          payment_date: null,
        }));
      }

      setInstallments(newInst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInstallment, installmentCount]);

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    
    if (editingEntry) {
      // PATCH: Envia apenas os campos modificados
      const changedFields = {};
      
      Object.keys(entryForm).forEach(key => {
        const currentValue = entryForm[key];
        const originalValue = originalEntryData[key];
        
        // Compara valores (convertendo para string para comparação consistente)
        if (String(currentValue) !== String(originalValue)) {
          // Formata o valor dependendo do tipo de campo
          if (key === 'value') {
            changedFields[key] = parseFloat(currentValue) || 0;
          } else if (key === 'NF') {
            changedFields[key] = currentValue ? parseInt(currentValue, 10) : null;
          } else if (key === 'payment_situation_id') {
            changedFields[key] = parseInt(currentValue, 10);
          } else if (key === 'employee_id' || key === 'account_id' || key === 'os_id') {
            changedFields[key] = currentValue;
          } else if (key === 'date_payment') {
            changedFields[key] = currentValue || null;
          } else {
            changedFields[key] = currentValue;
          }
        }
      });
      
      // Se não houver alterações, não faz a requisição
      if (Object.keys(changedFields).length === 0) {
        showToast('Nenhuma alteração foi feita', 'info');
        setShowModal(false);
        return;
      }
      
      console.log('Campos alterados:', changedFields); // Debug
      
      try {
        setEntryLoading(true);
        await entriesApi.update(editingEntry.entries_id, changedFields);
        showToast('Entrada atualizada com sucesso!', 'success');
        setShowModal(false);
        setOriginalEntryData(null);
        loadData();
      } catch (error) {
        console.error('Erro ao salvar entrada:', error);
        showToast(error.response?.data?.message || 'Erro ao salvar entrada', 'error');
      } finally {
        setEntryLoading(false);
      }
    } else {
      // POST: Criação de nova entrada

      // If this is an installment flow and we're in the general step, advance to installments
      if (isInstallment && step === 'general') {
        // Minimal validations for general step
        if (!entryForm.account_id) {
          showToast('Por favor, selecione uma conta', 'error');
          return;
        }
        if (!entryForm.os_id) {
          showToast('Por favor, selecione uma ordem de serviço', 'error');
          return;
        }
        // Initialize installments (useEffect will pick up installmentCount and isInstallment)
        setStep('installments');
        // ensure installments array is initialized with empty values
        const total = Math.max(1, Math.min(36, parseInt(String(installmentCount || '1'), 10)));
        const newInst = Array.from({ length: total }).map((_, i) => ({
          index: i + 1,
          value: '',
          due_date: '',
          payment_date: null,
        }));
        setInstallments(newInst);
        return;
      }

      // If we're on the installments step, skip the global validations (they're per-parcel)
      if (!(isInstallment && step === 'installments')) {
        if (!entryForm.value || parseFloat(entryForm.value) <= 0) {
          showToast('Por favor, preencha um valor válido', 'error');
          return;
        }
        if (!entryForm.account_id) {
          showToast('Por favor, selecione uma conta', 'error');
          return;
        }
        if (!entryForm.date_faturamento) {
          showToast('Por favor, preencha a data de faturamento', 'error');
          return;
        }
        // due_date é opcional quando há parcelas (usa última parcela como referência)
        if (!isInstallment && !entryForm.due_date) {
          showToast('Por favor, preencha a data de vencimento', 'error');
          return;
        }
        if (!entryForm.os_id) {
          showToast('Por favor, selecione uma ordem de serviço', 'error');
          return;
        }
      }

      try {
        setEntryLoading(true);

        if (!isInstallment || installmentCount <= 1) {
          // Entrada única (à vista)
          const payload = {
            employee_id: entryForm.employee_id || null,
            NF: entryForm.NF ? parseInt(entryForm.NF, 10) : null,
            account_id: entryForm.account_id,
            company: entryForm.company || null,
            value: parseFloat(entryForm.value),
            date_faturamento: entryForm.date_faturamento,
            due_date: entryForm.due_date,
            payment_situation_id: entryForm.payment_situation_id ? parseInt(entryForm.payment_situation_id, 10) : null,
            date_payment: entryForm.date_payment || null,
            os_id: entryForm.os_id || null,
          };

          await entriesApi.create(payload);
        } else {
          // Entrada com parcelas
          const provided = installments || [];
          if (provided.length !== installmentCount) {
            showToast('Preencha todas as parcelas', 'error');
            return;
          }

          // Validate and prepare payloads
          const installmentRecords = [];
          let totalValue = 0;

          for (let i = 0; i < installmentCount; i++) {
            const inst = provided[i] || {};
            const val = parseFloat(inst.value);
            if (Number.isNaN(val) || val <= 0) {
              showToast(`Por favor, preencha um valor válido na parcela ${i + 1}`, 'error');
              return;
            }
            if (!inst.due_date) {
              showToast(`Por favor, preencha a data de vencimento na parcela ${i + 1}`, 'error');
              return;
            }

            totalValue += val;
            installmentRecords.push({
              installment_number: i + 1,
              installment_total: installmentCount,
              due_date: inst.due_date,
              value: val,
              payment_date: inst.payment_date || null,
            });
          }

          // Create entry with installments
          const payload = {
            employee_id: entryForm.employee_id || null,
            NF: entryForm.NF ? parseInt(entryForm.NF, 10) : null,
            account_id: entryForm.account_id,
            company: entryForm.company || null,
            value: totalValue,
            date_faturamento: entryForm.date_faturamento || new Date().toISOString().split('T')[0],
            // due_date pode ser omitido quando há parcelas - o service usará a última parcela
            ...(entryForm.due_date && { due_date: entryForm.due_date }),
            payment_situation_id: entryForm.payment_situation_id ? parseInt(entryForm.payment_situation_id, 10) : null,
            date_payment: null,
            os_id: entryForm.os_id || null,
            installments: installmentRecords,
          };

          await entriesApi.create(payload);
        }

        showToast('Entrada(s) criada(s) com sucesso!', 'success');
        setShowModal(false);
        setOriginalEntryData(null);
        loadData();
      } catch (error) {
        console.error('Erro ao salvar entrada:', error);
        showToast(error.response?.data?.message || 'Erro ao salvar entrada', 'error');
      } finally {
        setEntryLoading(false);
      }
    }
  };

  // Handle next step when creating an installment flow (triggered by the "Próximo" button)
  const handleNextStep = (e) => {
    // Prevent any default if called from a button inside a form
    if (e && e.preventDefault) e.preventDefault();

    console.log('handleNextStep called', { isInstallment, installmentCount, entryForm, step });

    // Minimal validations for general step
    if (!entryForm.account_id) {
      showToast('Por favor, selecione uma conta', 'error');
      return;
    }
    if (!entryForm.os_id) {
      showToast('Por favor, selecione uma ordem de serviço', 'error');
      return;
    }

    setStep('installments');
    const total = Math.max(1, Math.min(36, parseInt(String(installmentCount || '1'), 10)));
    const newInst = Array.from({ length: total }).map((_, i) => ({
      index: i + 1,
      value: '',
      date_faturamento: entryForm.date_faturamento || '',
      due_date: entryForm.due_date || '',
      installment_info: `${i + 1}/${total}`,
    }));
    setInstallments(newInst);
    console.log('installments initialized', newInst);
  };

  const handleDeleteEntry = (entry) => {
    setConfirmModal({
      show: true,
      id: entry.entries_id,
      company: entry.company
    });
  };

  const confirmDeleteEntry = async () => {
    try {
      await entriesApi.delete(confirmModal.id);
      showToast('Entrada excluída com sucesso!', 'success');
      setConfirmModal({ show: false, id: null, company: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir entrada', 'error');
      setConfirmModal({ show: false, id: null, company: '' });
    }
  };

  // Função para determinar status automático baseado nas regras
  const getAutoStatus = (entry) => {
    // Se for parcelada, só está paga se todas as parcelas estiverem pagas
    if (entry.installments && entry.installments.length > 1) {
      const allPaid = entry.installments.every(inst => !!inst.payment_date);
      if (allPaid) return { status: 'paid', label: 'Recebido', color: 'emerald' };
      const anyOverdue = entry.installments.some(inst => !inst.payment_date && new Date(inst.due_date) < new Date());
      if (anyOverdue) return { status: 'overdue', label: 'Vencido', color: 'red' };
      return { status: 'pending', label: 'Pendente', color: 'orange' };
    }
    // Entrada à vista (sem parcelas ou só 1)
    if (entry.date_payment) return { status: 'paid', label: 'Recebido', color: 'emerald' };
    if (!entry.due_date) return { status: 'pending', label: 'Pendente', color: 'orange' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(entry.due_date);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) return { status: 'overdue', label: 'Vencido', color: 'red' };
    return { status: 'pending', label: 'Pendente', color: 'orange' };
  };

  // Função para calcular dias vencidos ou a vencer
  const getDaysOverdue = (entry) => {
    if (!entry.due_date) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(entry.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - dueDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Função para formatar texto de dias vencidos
  const formatDaysOverdue = (days) => {
    if (days === null) return '-';
    if (days === 0) return 'Vence hoje';
    if (days < 0) return `${Math.abs(days)} dias para vencer`;
    if (days === 1) return '1 dia vencido';
    return `${days} dias vencidos`;
  };

  // Filtros
  const getStatusColor = (entry) => {
    const isPaid = entry.payment_situation?.name?.toLowerCase().includes('pago');
    const isOverdue = !isPaid && entry.due_date && new Date(entry.due_date) < new Date();
    
    if (isPaid) return 'success';
    if (isOverdue) return 'danger';
    return 'warning';
  };

  const getStatusIcon = (status) => {
    if (status === 'success') return <CheckCircle size={16} />;
    if (status === 'danger') return <AlertCircle size={16} />;
    return <Clock size={16} />;
  };

  // Novo: transformar cada parcela em uma "entrada" apenas para estatísticas
  const allEntries = entries.flatMap(entry => {
    if (entry.installments && entry.installments.length > 0) {
      return entry.installments.map(inst => ({
        ...entry,
        value: inst.value,
        due_date: inst.due_date,
        date_payment: inst.payment_date,
        installment_number: inst.installment_number,
        installment_total: inst.installment_total,
        installment_id: inst.installment_id,
        isInstallment: true,
        _parentEntry: entry,
        _installment: inst
      }));
    }
    return [{ ...entry, isInstallment: false }];
  });

  // Listagem principal: filtrar apenas as entradas originais
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      (entry.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.NF?.toString() || '').includes(searchTerm) ||
      (entry.employee?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filters.employee_id && entry.employee?.employee_id !== filters.employee_id) return false;
    if (filters.account_id && entry.account?.account_id !== filters.account_id) return false;
    if (filters.payment_situation_id && entry.payment_situation?.payment_situation_id !== parseInt(filters.payment_situation_id)) return false;
    if (filters.os_id && entry.orders_service?.os_id !== filters.os_id) return false;
    if (filters.month_faturamento && entry.date_faturamento) {
      const entryDate = new Date(entry.date_faturamento);
      const [year, month] = filters.month_faturamento.split('-');
      if (entryDate.getFullYear() !== parseInt(year) || (entryDate.getMonth() + 1) !== parseInt(month)) {
        return false;
      }
    }
    // Filtro por data de pagamento específica
    if (filters.payment_date) {
      // Verifica se a entrada tem parcelas
      if (entry.installments && entry.installments.length > 0) {
        // Se tem parcelas, verifica se alguma parcela tem payment_date igual ao filtro
        const hasMatchingPayment = entry.installments.some(inst => {
          if (!inst.payment_date) return false;
          const instPaymentDate = inst.payment_date.split('T')[0];
          return instPaymentDate === filters.payment_date;
        });
        if (!hasMatchingPayment) return false;
      } else {
        // Se não tem parcelas, verifica a date_payment da entrada principal
        if (!entry.date_payment) return false;
        const entryPaymentDate = entry.date_payment.split('T')[0];
        if (entryPaymentDate !== filters.payment_date) return false;
      }
    }
    if (filterStatus === 'all') return true;
    const autoStatus = getAutoStatus(entry);
    if (filterStatus === 'paid') return autoStatus.status === 'paid';
    if (filterStatus === 'overdue') return autoStatus.status === 'overdue';
    if (filterStatus === 'pending') return autoStatus.status === 'pending';
    return true;
  });

  // Estatísticas baseadas em todas as parcelas (ou entradas à vista)
  const stats = {
    total: allEntries.length,
    totalValue: allEntries.reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0),
    paid: allEntries.filter(e => !!e.date_payment).length,
    paidValue: allEntries.filter(e => !!e.date_payment).reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0),
    overdue: allEntries.filter(e => !e.date_payment && e.due_date && new Date(e.due_date) < new Date()).length,
    overdueValue: allEntries.filter(e => !e.date_payment && e.due_date && new Date(e.due_date) < new Date()).reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0),
    pending: allEntries.filter(e => !e.date_payment && (!e.due_date || new Date(e.due_date) >= new Date())).length,
    pendingValue: allEntries.filter(e => !e.date_payment && (!e.due_date || new Date(e.due_date) >= new Date())).reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0),
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    // Pega apenas YYYY-MM-DD e formata sem timezone issues
    const datePart = date instanceof Date ? date.toISOString().split('T')[0] : date.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  };

  // ====== FUNÇÕES PARA GERENCIAR SITUAÇÕES DE PAGAMENTO ======
  const handleOpenSituationModal = () => {
    setSituationForm({ name: '', description: '' });
    setEditingSituation(null);
    setShowSituationModal(true);
  };

  const handleEditSituation = (situation) => {
    setEditingSituation(situation);
    setSituationForm({
      name: situation.name,
      description: situation.description || ''
    });
  };

  const handleSaveSituation = async (e) => {
    e.preventDefault();
    if (!situationForm.name.trim()) {
      showToast('Por favor, preencha o nome da situação', 'error');
      return;
    }

    try {
      setSituationLoading(true);
      if (editingSituation) {
        await paymentSituationApi.update(editingSituation.payment_situation_id, situationForm);
        showToast('Situação atualizada com sucesso!', 'success');
      } else {
        await paymentSituationApi.create(situationForm);
        showToast('Situação criada com sucesso!', 'success');
      }
      setSituationForm({ name: '', description: '' });
      setEditingSituation(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar situação:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar situação', 'error');
    } finally {
      setSituationLoading(false);
    }
  };

  const handleDeleteSituation = (situation) => {
    setConfirmSituationModal({
      show: true,
      situationId: situation.payment_situation_id,
      situationName: situation.name
    });
  };

  const confirmDeleteSituation = async () => {
    try {
      setSituationLoading(true);
      await paymentSituationApi.delete(confirmSituationModal.situationId);
      showToast('Situação excluída com sucesso!', 'success');
      setConfirmSituationModal({ show: false, situationId: null, situationName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir situação:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir situação', 'error');
      setConfirmSituationModal({ show: false, situationId: null, situationName: '' });
    } finally {
      setSituationLoading(false);
    }
  };

  const handleCancelSituationEdit = () => {
    setEditingSituation(null);
    setSituationForm({ name: '', description: '' });
  };

  const handleClearFilters = () => {
    setFilters({
      employee_id: '',
      account_id: '',
      payment_situation_id: '',
      os_id: '',
      month_faturamento: '',
    });
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Entradas</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie suas entradas financeiras</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleOpenSituationModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Situações</span>
              </button>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Entrada</span>
              </button>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-blue-600" size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-green-100 col-span-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs text-green-600 truncate font-medium">Valor Total</p>
                  <p className="text-base sm:text-lg font-bold text-green-600 truncate" title={formatCurrency(stats.totalValue)}>{formatCurrency(stats.totalValue)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="text-green-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-green-600">Soma das entradas</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-emerald-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs text-emerald-600 truncate font-medium">Recebidas</p>
                  <p className="text-lg font-bold text-emerald-600">{stats.paid}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-emerald-600" size={20} />
                </div>
              </div>
              <p className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold truncate">{formatCurrency(stats.paidValue)}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-orange-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs text-orange-600 truncate font-medium">Pendentes</p>
                  <p className="text-lg font-bold text-orange-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="text-orange-600" size={20} />
                </div>
              </div>
              <p className="text-[9px] sm:text-[10px] text-orange-600 font-semibold truncate">{formatCurrency(stats.pendingValue)}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-red-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs text-red-600 truncate font-medium">Vencidas</p>
                  <p className="text-lg font-bold text-red-600">{stats.overdue}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
              </div>
              <p className="text-[9px] sm:text-[10px] text-red-600 font-semibold truncate">{formatCurrency(stats.overdueValue)}</p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 border border-gray-100">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por empresa, NF ou funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
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
            </div>

            {showFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Funcionário</label>
                    <select
                      value={filters.employee_id}
                      onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option key="all-employees" value="">Todos</option>
                      {(Array.isArray(employees) ? employees : []).map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Conta</label>
                    <select
                      value={filters.account_id}
                      onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option key="all-accounts-filter" value="">Todas</option>
                      {(Array.isArray(accounts) ? accounts : []).map(acc => (
                        <option key={acc.account_id} value={acc.account_id}>{acc.name_account}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Situação</label>
                    <select
                      value={filters.payment_situation_id}
                      onChange={(e) => setFilters({ ...filters, payment_situation_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option key="all-situations-filter" value="">Todas</option>
                      {paymentSituations.map(sit => (
                        <option key={sit.payment_situation_id} value={sit.payment_situation_id}>{sit.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ordem de Serviço</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Digite o ID da OS..."
                        value={osFilterSearchTerm}
                        onChange={(e) => setOsFilterSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-t-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <select
                        value={filters.os_id}
                        onChange={(e) => {
                          setFilters({ ...filters, os_id: e.target.value });
                          setOsFilterSearchTerm('');
                        }}
                        size="4"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 border-t-0"
                      >
                        <option key="all-os-filter" value="">Todas</option>
                        {(Array.isArray(ordersService) ? ordersService : [])
                          .filter(os => {
                            if (!osFilterSearchTerm) return true;
                            const osId = os.id?.toString() || '';
                            return osId.includes(osFilterSearchTerm);
                          })
                          .sort((a, b) => (a.id || 0) - (b.id || 0))
                          .map(os => (
                            <option key={os.os_id} value={os.os_id}>OS #{os.id || os.os_id.slice(0, 8)}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-end">
                    <button
                      onClick={handleClearFilters}
                      className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg"
                    >
                      <X size={18} />
                      Limpar Filtros
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mês de Faturamento</label>
                    <input
                      type="month"
                      value={filters.month_faturamento}
                      onChange={(e) => setFilters({ ...filters, month_faturamento: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Selecione o mês"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Pagamento</label>
                    <input
                      type="date"
                      value={filters.payment_date}
                      onChange={(e) => setFilters({ ...filters, payment_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Filtrar por data de pagamento"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'all'
                    ? 'bg-gray-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'paid'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Recebidas
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'pending'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilterStatus('overdue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === 'overdue'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Vencidas
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Entradas */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-green-600"></div>
            <p className="text-gray-600 mt-4">Carregando...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 font-medium">Nenhuma entrada encontrada</p>
          </div>
        ) : (
          <>
            {/* Mobile - Cards com Scroll */}
            <div className={`block md:hidden bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-200 ${filteredEntries.length > 5 ? 'overflow-y-auto' : ''}`} style={{ maxHeight: filteredEntries.length > 5 ? '480px' : 'none' }}>
              {filteredEntries.map((entry) => {
                const autoStatus = getAutoStatus(entry);
                
                // Só mostra cartão para entrada à vista (sem parcelas ou só 1 parcela)
                if (entry.installments && entry.installments.length > 1) {
                  // Para parceladas, mostrar card com contador de parcelas pagas
                  const total = entry.installments.length;
                  const pagas = entry.installments.filter(inst => !!inst.payment_date).length;
                  return (
                    <div key={entry.entries_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Building className="text-green-600" size={18} />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="font-semibold text-gray-900 text-sm truncate" title={entry.company}>{entry.company}</h3>
                            {entry.employee?.name && (
                              <p className="text-xs text-gray-500 truncate" title={entry.employee.name}>{entry.employee.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">NF:</span>
                          <span className="font-mono text-gray-700">{entry.NF || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Valor:</span>
                          <span className="font-bold text-green-600">{formatCurrency(entry.value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vencimento:</span>
                          <span className="text-gray-700">{formatDate(entry.due_date)}</span>
                        </div>
                        {!entry.date_payment && entry.due_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Prazo:</span>
                            <span className={`font-semibold ${
                              getDaysOverdue(entry) > 0 ? 'text-red-600' : 
                              getDaysOverdue(entry) === 0 ? 'text-orange-600' : 
                              'text-blue-600'
                            }`}>
                              {formatDaysOverdue(getDaysOverdue(entry))}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Status:</span>
                          <div className="relative group inline-block">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-${autoStatus.color}-100 text-${autoStatus.color}-700`}>
                              {autoStatus.status === 'paid' && <CheckCircle size={12} />}
                              {autoStatus.status === 'overdue' && <AlertCircle size={12} />}
                              {autoStatus.status === 'pending' && <Clock size={12} />}
                              {autoStatus.label}
                            </span>
                            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-9 z-20">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-1 shadow-lg whitespace-nowrap">
                                {entry.date_payment ? (
                                  `Pago em ${formatDate(entry.date_payment)}`
                                ) : (
                                  formatDaysOverdue(getDaysOverdue(entry))
                                )}
                              </div>
                              <div className="w-2 h-2 bg-gray-900 rotate-45 mt-[-6px] mx-auto" />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Situação:</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                            {entry.payment_situation?.name || 'Sem situação'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Conta:</span>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                            {entry.account?.name_account || '-'}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-200 flex gap-2">
                          <span className="flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border bg-gray-100 text-gray-700 border-gray-200 text-center">
                            {pagas}/{total} parcelas pagas
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                // À vista (sem parcelas ou só 1 parcela)
                return (
                  <div key={entry.entries_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building className="text-green-600" size={18} />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h3 className="font-semibold text-gray-900 text-sm truncate" title={entry.company}>{entry.company}</h3>
                          {entry.employee?.name && (
                            <p className="text-xs text-gray-500 truncate" title={entry.employee.name}>{entry.employee.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">NF:</span>
                        <span className="font-mono text-gray-700">{entry.NF || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor:</span>
                        <span className="font-bold text-green-600">{formatCurrency(entry.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vencimento:</span>
                        <span className="text-gray-700">{formatDate(entry.due_date)}</span>
                      </div>
                      {!entry.date_payment && entry.due_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Prazo:</span>
                          <span className={`font-semibold ${
                            getDaysOverdue(entry) > 0 ? 'text-red-600' : 
                            getDaysOverdue(entry) === 0 ? 'text-orange-600' : 
                            'text-blue-600'
                          }`}>
                            {formatDaysOverdue(getDaysOverdue(entry))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status:</span>
                        <div className="relative group inline-block">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-${autoStatus.color}-100 text-${autoStatus.color}-700`}>
                            {autoStatus.status === 'paid' && <CheckCircle size={12} />}
                            {autoStatus.status === 'overdue' && <AlertCircle size={12} />}
                            {autoStatus.status === 'pending' && <Clock size={12} />}
                            {autoStatus.label}
                          </span>

                          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-9 z-20">
                            <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-1 shadow-lg whitespace-nowrap">
                              {entry.date_payment ? (
                                `Pago em ${formatDate(entry.date_payment)}`
                              ) : (
                                formatDaysOverdue(getDaysOverdue(entry))
                              )}
                            </div>
                            <div className="w-2 h-2 bg-gray-900 rotate-45 mt-[-6px] mx-auto" />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Situação:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                          {entry.payment_situation?.name || 'Sem situação'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Conta:</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-800">
                          {entry.account?.name_account || '-'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => autoStatus.status !== 'paid' && handleReceiveEntry(entry)}
                          disabled={autoStatus.status === 'paid'}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border ${autoStatus.status === 'paid' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-green-700 border-green-200 hover:bg-green-50'}`}
                        >
                          {autoStatus.status === 'paid' ? 'Recebido' : 'Receber'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop - Tabela com Scroll após 5 entradas */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
              <div className={filteredEntries.length > 5 ? "overflow-y-auto" : ""} style={{ maxHeight: filteredEntries.length > 5 ? '480px' : 'none' }}>
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50 w-[22%]">Empresa</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50 w-[10%]">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50 w-[13%]">Vencimento</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50 w-[13%]">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50 w-[14%]">Situação</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50 w-[13%]">Receber</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase bg-gray-50 w-[15%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEntries.map((entry) => {
                      const autoStatus = getAutoStatus(entry);
                      const hasInstallments = entry.installments && entry.installments.length > 0;
                      return (
                        <React.Fragment key={entry.entries_id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center overflow-hidden">
                                {hasInstallments && (
                                  <button
                                    onClick={() => toggleExpandRow(entry.entries_id)}
                                    className="mr-2 p-1 rounded hover:bg-gray-200"
                                    title={expandedRows[entry.entries_id] ? 'Ocultar parcelas' : 'Mostrar parcelas'}
                                  >
                                    {expandedRows[entry.entries_id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  </button>
                                )}
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Building className="text-green-600" size={14} />
                                </div>
                                <div className="ml-2 min-w-0 overflow-hidden">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{entry.company}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                                      <FileText size={10} />
                                      OS #{entry.orders_service?.id || entry.orders_service?.os_id?.slice(0, 8) || '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold text-green-600">{formatCurrency(entry.value)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-sm text-gray-900">
                                <Calendar size={12} className="text-gray-400" />
                                <span className="truncate">{formatDate(entry.due_date)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {(() => {
                                const statusColors = {
                                  paid: { bg: '#D1FAE5', color: '#059669' },
                                  pending: { bg: '#FED7AA', color: '#EA580C' },
                                  overdue: { bg: '#FEE2E2', color: '#DC2626' }
                                };
                                const statusLabels = {
                                  paid: 'Recebido',
                                  pending: 'Pendente',
                                  overdue: 'Vencido'
                                };
                                const statusStyle = statusColors[autoStatus.status] || statusColors.pending;
                                return (
                                  <div className="relative group inline-block">
                                    <span 
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full`}
                                      style={{ 
                                        backgroundColor: statusStyle.bg,
                                        color: statusStyle.color
                                      }}
                                    >
                                      {autoStatus.status === 'paid' && <CheckCircle size={14} />}
                                      {autoStatus.status === 'overdue' && <AlertCircle size={14} />}
                                      {autoStatus.status === 'pending' && <Clock size={14} />}
                                      {statusLabels[autoStatus.status] || autoStatus.label}
                                    </span>
                                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-9 z-20">
                                      <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-1 shadow-lg whitespace-nowrap">
                                        {entry.date_payment ? (
                                          `Pago em ${formatDate(entry.date_payment)}`
                                        ) : (
                                          formatDaysOverdue(getDaysOverdue(entry))
                                        )}
                                      </div>
                                      <div className="w-2 h-2 bg-gray-900 rotate-45 mt-[-6px] mx-auto" />
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-3 overflow-hidden">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 truncate max-w-full">
                                {entry.payment_situation?.name || 'Sem situação'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {/* Botão removido. Exibe status ou contador de parcelas pagas para parceladas. */}
                              {entry.installments && entry.installments.length > 1 ? (
                                (() => {
                                  const total = entry.installments.length;
                                  const pagas = entry.installments.filter(inst => !!inst.payment_date).length;
                                  return (
                                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 border border-gray-200">
                                      {pagas}/{total} parcelas pagas
                                    </span>
                                  );
                                })()
                              ) : (
                                <button
                                  onClick={() => autoStatus.status !== 'paid' && handleReceiveEntry(entry)}
                                  disabled={autoStatus.status === 'paid'}
                                  className={`px-3 py-1 text-sm font-medium rounded-lg border ${autoStatus.status === 'paid' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-green-700 border-green-200 hover:bg-green-50'}`}
                                >
                                  {autoStatus.status === 'paid' ? 'Recebido' : 'Receber'}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center overflow-hidden">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditEntry(entry)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEntry(entry)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Parcelas (subtópico) */}
                          {hasInstallments && expandedRows[entry.entries_id] && entry.installments.map((inst, idx) => {
                            const isPaid = !!inst.payment_date;
                            return (
                              <tr key={inst.installment_id} className="bg-gray-50 border-t border-b border-gray-200 text-[11px] h-7 min-h-[24px]">
                                <td className="pl-6 py-1" colSpan={2}>
                                  <span className="font-semibold text-gray-700">Parcela {inst.installment_number} de {inst.installment_total}</span>
                                </td>
                                <td className="py-1">{formatDate(inst.due_date)}</td>
                                <td className="py-1">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isPaid ? 'bg-green-100 text-green-700' : (new Date(inst.due_date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}`}>{isPaid ? 'Pago' : (new Date(inst.due_date) < new Date() ? 'Vencido' : 'Pendente')}</span>
                                </td>
                                <td className="py-1">{formatCurrency(inst.value)}</td>
                                <td className="py-1">{isPaid ? formatDate(inst.payment_date) : '-'}</td>
                                <td className="py-1 text-center">
                                  <div className="flex items-center gap-1 justify-center">
                                    {!isPaid && (
                                      <button
                                        onClick={() => handleMarkInstallmentPaid(inst)}
                                        className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all text-[10px] font-semibold disabled:opacity-60 min-w-[0] h-6"
                                        style={{ minWidth: 0, height: 20, lineHeight: '16px' }}
                                        disabled={installmentActionLoading}
                                      >
                                        <CheckCircle size={11} />
                                        Receber
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleEditInstallment(inst)}
                                      className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-700 h-6"
                                      style={{ height: 20, lineHeight: '16px' }}
                                    >
                                      Editar
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                        {/* Modal de edição de parcela */}
                        {editingInstallment && (
                          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setEditingInstallment(null)}>
                            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 m-4" onClick={e => e.stopPropagation()}>
                              <h3 className="text-lg font-bold mb-2 text-gray-900">Editar Parcela</h3>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                  <input
                                    type="number"
                                    min={0.01}
                                    step="0.01"
                                    value={installmentEditForm.value}
                                    onChange={e => setInstallmentEditForm(f => ({ ...f, value: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    disabled={installmentActionLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Data Vencimento</label>
                                  <input
                                    type="date"
                                    value={installmentEditForm.due_date}
                                    onChange={e => setInstallmentEditForm(f => ({ ...f, due_date: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    disabled={installmentActionLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Data Pagamento</label>
                                  <input
                                    type="date"
                                    value={installmentEditForm.payment_date || ''}
                                    onChange={e => setInstallmentEditForm(f => ({ ...f, payment_date: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                    disabled={installmentActionLoading}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-3 mt-5">
                                <button
                                  onClick={() => setEditingInstallment(null)}
                                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                                  disabled={installmentActionLoading}
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={handleSaveInstallmentEdit}
                                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                  disabled={installmentActionLoading}
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && filteredEntries.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {filteredEntries.length} de {entries.length} entradas
          </div>
        )}
      </div>

      {/* Modal de Entrada */}
      {showInstallPrompt && renderInstallPrompt()}

      <EntryModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingEntry={editingEntry}
        entryForm={entryForm}
        setEntryForm={setEntryForm}
        isInstallment={isInstallment}
        installmentCount={installmentCount}
        installments={installments}
        setInstallments={setInstallments}
        employees={employees}
        accounts={accounts}
        paymentSituations={paymentSituations}
        ordersService={ordersService}
        step={step}
        setStep={setStep}
        handleSaveEntry={handleSaveEntry}
        handleNextStep={handleNextStep}
        entryLoading={entryLoading}
        osSearchTerm={osSearchTerm}
        setOsSearchTerm={setOsSearchTerm}
      />

      {/* Modal de Confirmação */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmModal({ show: false, id: null, company: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Entrada?</h3>
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmModal.company}</p>
              <p className="text-xs text-red-600 mb-4">⚠️ Esta ação não pode ser desfeita</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmModal({ show: false, id: null, company: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteEntry}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} className="form-checkbox" disabled={entryLoading} />
                    <span>Parcelado</span>
                  </label>
                  {isInstallment && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Parcelas</label>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(Math.max(1, Math.min(36, parseInt(e.target.value || '1', 10))))}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        disabled={entryLoading}
                      />
                    </div>
                  )}
                </div>
          </div>
        </div>
      )}

      {/* Modal de Situações de Pagamento - Ultra Compacto */}
      {showSituationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header Mini */}
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-indigo-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="text-white" size={16} />
                <h2 className="text-base sm:text-lg font-bold text-white">Situações de Pagamento</h2>
              </div>
              <button
                onClick={() => {
                  setShowSituationModal(false);
                  handleCancelSituationEdit();
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
                <div className="bg-indigo-50 rounded-lg p-2.5 sm:p-3 border border-indigo-200 sticky top-0">
                  <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    {editingSituation ? <Edit size={14} /> : <Plus size={14} />}
                    {editingSituation ? 'Editar' : 'Nova'}
                  </h3>
                  
                  <form onSubmit={handleSaveSituation} className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={situationForm.name}
                        onChange={(e) => setSituationForm({ ...situationForm, name: e.target.value })}
                        placeholder="Ex: Pago"
                        className="w-full px-2.5 py-1.5 text-xs border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={situationLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Descrição
                      </label>
                      <textarea
                        value={situationForm.description}
                        onChange={(e) => setSituationForm({ ...situationForm, description: e.target.value })}
                        placeholder="Descreva..."
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-xs border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 resize-none"
                        disabled={situationLoading}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={situationLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 text-xs rounded font-medium transition-all disabled:opacity-50"
                      >
                        {situationLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            {editingSituation ? <Edit size={12} /> : <Plus size={12} />}
                            {editingSituation ? 'Atualizar' : 'Criar'}
                          </>
                        )}
                      </button>
                      
                      {editingSituation && (
                        <button
                          type="button"
                          onClick={handleCancelSituationEdit}
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
                    <Settings className="text-indigo-600" size={14} />
                    Lista ({paymentSituations.length})
                  </h3>
                </div>

                {paymentSituations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Settings size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-600 font-medium text-xs">Nenhuma situação</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[calc(85vh-160px)] overflow-y-auto pr-1">
                    {paymentSituations.map((situation) => {
                      const entryCount = entries.filter(e => e.payment_situation?.payment_situation_id === situation.payment_situation_id).length;
                      const isEditing = editingSituation?.payment_situation_id === situation.payment_situation_id;
                      
                      return (
                        <div
                          key={situation.payment_situation_id}
                          className={`bg-white rounded p-2 border transition-all ${
                            isEditing 
                              ? 'border-indigo-500 shadow ring-1 ring-indigo-200' 
                              : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h4 className="font-semibold text-gray-900 text-xs truncate">{situation.name}</h4>
                                {isEditing && (
                                  <span className="px-1 py-0.5 bg-indigo-600 text-white text-[9px] font-semibold rounded">
                                    Editando
                                  </span>
                                )}
                              </div>
                              
                              {situation.description && (
                                <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">{situation.description}</p>
                              )}
                              
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                <FileText size={10} />
                                {entryCount}
                                {entryCount > 0 && <span className="ml-0.5">🔒</span>}
                              </span>
                            </div>
                            
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => handleEditSituation(situation)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                disabled={situationLoading}
                                title="Editar"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteSituation(situation)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                                disabled={situationLoading || entryCount > 0}
                                title={entryCount > 0 ? "Protegido" : "Excluir"}
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
                  setShowSituationModal(false);
                  handleCancelSituationEdit();
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-medium transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão - Situação */}
      {confirmSituationModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmSituationModal({ show: false, situationId: null, situationName: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <Settings className="text-indigo-600" size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Situação?</h3>
              
              <p className="text-xs text-gray-600 mb-1">
                Você está prestes a excluir:
              </p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">
                {confirmSituationModal.situationName}
              </p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmSituationModal({ show: false, situationId: null, situationName: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteSituation}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
}
