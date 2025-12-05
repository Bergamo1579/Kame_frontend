import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, X, TrendingDown, DollarSign, Calendar, Building, FileText, AlertCircle, CheckCircle, Clock, Filter, CreditCard, ChevronRight, ChevronDown } from 'lucide-react';
import { expensesApi, expenseInstallmentsApi, supplierApi, accountsApi, subCategoriesApi, typePaymentApi, cardsApi, ordersServiceApi } from '../../../services/api';
import Toast from '../../../components/Toast';
import ExpenseModal from './ExpenseModal';

export default function Despesa() {
  const location = useLocation();

  const [expandedRows, setExpandedRows] = useState({});
  // Estado para edição de parcela
  const [editingInstallment, setEditingInstallment] = useState(null);
  const [installmentEditForm, setInstallmentEditForm] = useState({ value: '', due_date: '', payment_date: '' });
  const [installmentActionLoading, setInstallmentActionLoading] = useState(false);

  // Função para expandir/colapsar parcelas
  const toggleExpandRow = (expenseId) => {
    setExpandedRows(prev => ({ ...prev, [expenseId]: !prev[expenseId] }));
  };

  // Função para marcar parcela como paga
  const handleMarkInstallmentPaid = (installment) => {
    setConfirmInstallmentPaymentModal({ show: true, installment });
  };

  const confirmMarkInstallmentPaid = async () => {
    const installment = confirmInstallmentPaymentModal.installment;
    setConfirmInstallmentPaymentModal({ show: false, installment: null });
    setInstallmentActionLoading(true);
    try {
      await expenseInstallmentsApi.update(installment.installment_id, {
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
      await expenseInstallmentsApi.update(editingInstallment.installment_id, {
        value: parseFloat(installmentEditForm.value),
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

  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [typePayments, setTypePayments] = useState([]);
  const [cards, setCards] = useState([]);
  const [ordersService, setOrdersService] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    supplier_id: '',
    account_id: '',
    sub_category_id: '',
    type_payment_id: '',
    card_id: '',
    os_id: '',
    month_expense: '',
    payment_date: '',
  });
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  
  const [showModal, setShowModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    total_value: 0,
    date_expense: '',
    means_due_date: '',
    payment_date: '',
    NF: '',
    NR: '',
    recorrencia: false,
    imprevist: false,
    expense_fixed: false,
    sub_category_id: '', // Obrigatório
    type_payment_id: '', // Opcional
    account_id: '', // Obrigatório
    supplier_id: '',
    card_id: '',
    client_id: '',
    os_id: ''
  });
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installments, setInstallments] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [originalExpenseData, setOriginalExpenseData] = useState(null);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null, description: '' });
  
  // Modal e estados para Tipo de Pagamento
  const [showTypePaymentModal, setShowTypePaymentModal] = useState(false);
  const [typePaymentForm, setTypePaymentForm] = useState({ name_type_payment: '', description: '' });
  const [editingTypePayment, setEditingTypePayment] = useState(null);
  const [typePaymentLoading, setTypePaymentLoading] = useState(false);
  const [confirmTypePaymentModal, setConfirmTypePaymentModal] = useState({ show: false, typePaymentId: null, typePaymentName: '' });
  const [confirmInstallmentPaymentModal, setConfirmInstallmentPaymentModal] = useState({ show: false, installment: null });
  
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      setFilters(prev => ({ ...prev, payment_date: dateParam }));
    }
  }, [location.search]);

  useEffect(() => {
    if (showModal || confirmModal.show || showTypePaymentModal || confirmTypePaymentModal.show || confirmInstallmentPaymentModal.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, confirmModal.show, showTypePaymentModal, confirmTypePaymentModal.show]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesRes, suppliersRes, accountsRes, subCategoriesRes, typePaymentsRes, cardsRes, ordersRes] = await Promise.all([
        expensesApi.getAll(),
        supplierApi.getAll(),
        accountsApi.getAll(),
        subCategoriesApi.getAll(),
        typePaymentApi.getAll(),
        cardsApi.getAll(),
        ordersServiceApi.getAll(),
      ]);
      
      const expensesData = expensesRes.data?.items || expensesRes.data || [];
      
      setExpenses(expensesData);
      
      // Normalize responses to arrays to avoid runtime errors when using .map
      const normalizeList = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.items && Array.isArray(res.items)) return res.items;
        if (typeof res === 'object') return [res];
        return [];
      };

      setSuppliers(normalizeList(suppliersRes.data));
      setAccounts(normalizeList(accountsRes.data));
      setSubCategories(normalizeList(subCategoriesRes.data));
      setTypePayments(normalizeList(typePaymentsRes.data));
      setCards(normalizeList(cardsRes.data));
      setOrdersService(normalizeList(ordersRes.data));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Marcar despesa como paga
  const handlePayExpense = async (expense) => {
    try {
      const today = new Date();
      const isoDate = today.toISOString().split('T')[0];
      // Atualizar backend
      await expensesApi.update(expense.expense_id, { payment_date: isoDate });
      // Atualizar estado local
      setExpenses(prev => prev.map(e => e.expense_id === expense.expense_id ? { ...e, payment_date: isoDate } : e));
      showToast('Despesa marcada como paga', 'success');
    } catch (err) {
      console.error('Erro ao marcar como paga:', err);
      showToast('Erro ao marcar como paga', 'error');
    }
  };

  // Ao abrir modal, mostra prompt de parcelamento
  const handleOpenModal = () => {
    setExpenseForm({
      description: '',
      total_value: 0,
      date_expense: '',
      means_due_date: '',
      payment_date: '',
      NF: '',
      NR: '',
      recorrencia: false,
      imprevist: false,
      expense_fixed: false,
      sub_category_id: '',
      type_payment_id: '',
      account_id: '',
      supplier_id: '',
      card_id: '',
      client_id: '',
      os_id: ''
    });
    setIsInstallment(false);
    setInstallmentCount(1);
    setEditingExpense(null);
    setOriginalExpenseData(null);
    setInstallPromptCount(2);
    setSelectedPaymentType(null);
    setShowInstallPrompt(true);
    setStep('prompt');
    setShowModal(false);
  };

  // Prompt de parcelamento
  const renderInstallPrompt = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 relative">
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Fechar"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <TrendingDown size={24} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">Nova Despesa</h2>
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

          <button
            onClick={() => setSelectedPaymentType('parcelado')}
            className={`w-full group relative overflow-hidden border-2 rounded-lg p-4 transition-all duration-200 transform hover:scale-105 ${
              selectedPaymentType === 'parcelado'
                ? 'bg-red-100 border-red-500 shadow-lg'
                : 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedPaymentType === 'parcelado'
                  ? 'bg-red-500/30'
                  : 'bg-red-500/20 group-hover:bg-red-500/30'
              }`}>
                <CreditCard size={24} className="text-red-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-base font-bold text-gray-900">Parcelado</p>
                <p className="text-xs text-gray-600 mt-0.5">Dividir em múltiplas parcelas</p>
              </div>
              {selectedPaymentType === 'parcelado' && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
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
                  className="w-full px-4 py-3 text-center text-lg font-bold border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition-all"
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
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium text-sm flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    const normalizedImprevist = expense.imprevist === true;
    const normalizedFixed = expense.expense_fixed === true && !normalizedImprevist;
    const formData = {
      description: expense.description || '',
      total_value: expense.total_value || 0,
      date_expense: expense.date_expense ? expense.date_expense.split('T')[0] : '',
      means_due_date: expense.means_due_date ? expense.means_due_date.split('T')[0] : '',
      payment_date: expense.payment_date ? expense.payment_date.split('T')[0] : '',
      NF: expense.NF || '',
      NR: expense.NR || '',
      recorrencia: expense.recorrencia || false,
      imprevist: normalizedImprevist,
      expense_fixed: normalizedFixed,
      sub_category_id: expense.sub_category?.sub_category_id || expense.sub_category_id || '',
      type_payment_id: expense.type_payment?.type_payment_id || expense.type_payment_id || '',
      account_id: expense.account?.account_id || expense.account_id || '',
      supplier_id: expense.supplier?.supplier_id || expense.supplier_id || '',
      card_id: expense.card?.card_id || expense.card_id || '',
      client_id: expense.client?.client_id || expense.client_id || '',
      os_id: expense.orders_service?.os_id || expense.os_id || ''
    };
    setExpenseForm(formData);
    setOriginalExpenseData(formData);

    if (expense.installments && expense.installments.length > 0) {
      const total = expense.installments.length;
      setIsInstallment(total > 1);
      setInstallmentCount(total);
      const formattedInstallments = expense.installments.map(inst => ({
        installment_id: inst.installment_id,
        installment_number: inst.installment_number,
        installment_total: inst.installment_total,
        value: inst.value || '',
        due_date: inst.due_date ? inst.due_date.split('T')[0] : '',
        payment_date: inst.payment_date ? inst.payment_date.split('T')[0] : null,
        imprevist: normalizedFixed ? false : (inst.imprevist ?? false),
      }));
      setInstallments(formattedInstallments);
    } else {
      setIsInstallment(false);
      setInstallmentCount(1);
      setInstallments([]);
    }

    setShowModal(true);
    setStep('general');
  };

    // When parcelado is toggled or installmentCount changes, initialize per-installment rows
    useEffect(() => {
      if (!showModal) {
        return;
      }

      if (!isInstallment) {
        if (installments.length > 0) {
          setInstallments([]);
        }
        return;
      }

      if (editingExpense) {
        return;
      }

      const total = Math.max(1, Math.min(36, parseInt(String(installmentCount || '1'), 10)));
      
      // Evita recriar se já temos exatamente o número correto de parcelas
      if (Array.isArray(installments) && installments.length === total) {
        return;
      }

      const base = Number(expenseForm.total_value);
      const hasBase = Number.isFinite(base) && base > 0;

      const perValue = hasBase ? Number((base / total).toFixed(2)) : '';

      const newInst = Array.from({ length: total }).map((_, index) => ({
        installment_number: index + 1,
        installment_total: total,
        value: perValue,
        due_date: expenseForm.means_due_date || '',
        payment_date: null,
        imprevist: Boolean(expenseForm.imprevist),
      }));

      setInstallments(newInst);
    }, [showModal, isInstallment, installmentCount, expenseForm.total_value, expenseForm.means_due_date, editingExpense]);

  const toNumberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const sanitizeExpenseForm = (form) => {
    const sanitized = {};

    // Campos obrigatórios sempre presentes
    sanitized.total_value = Number((toNumberOrNull(form?.total_value) ?? 0).toFixed(2));
    sanitized.date_expense = form?.date_expense || '';

    // Campos obrigatórios condicionais - só adicionar se tiverem valor válido
    if (form?.sub_category_id) sanitized.sub_category_id = Number(form.sub_category_id);
    if (form?.account_id) sanitized.account_id = form.account_id;

    // Campos opcionais - só incluir se tiverem valor real (não string vazia)
    const description = form?.description?.trim();
    if (description) sanitized.description = description;
    
    if (form?.means_due_date) sanitized.means_due_date = form.means_due_date;
    if (form?.payment_date) sanitized.payment_date = form.payment_date;
    
    const nf = form?.NF?.trim();
    if (nf) sanitized.NF = nf;
    
    const nrValue = toNumberOrNull(form?.NR);
    if (nrValue !== null) sanitized.NR = nrValue;
    
    if (form?.recorrencia) sanitized.recorrencia = true;
    if (form?.imprevist !== undefined) sanitized.imprevist = !!form.imprevist;
    if (form?.expense_fixed !== undefined) sanitized.expense_fixed = !!form.expense_fixed;

    if (sanitized.imprevist === true) {
      sanitized.expense_fixed = false;
    } else if (sanitized.expense_fixed === true) {
      sanitized.imprevist = false;
    }
    
    // Só adiciona type_payment_id se houver valor válido (não vazio e não zero)
    if (form?.type_payment_id && form.type_payment_id !== '') {
      const typePaymentId = Number(form.type_payment_id);
      if (!isNaN(typePaymentId) && typePaymentId > 0) {
        sanitized.type_payment_id = typePaymentId;
      }
    }
    
    if (form?.card_id && form.card_id !== '') sanitized.card_id = form.card_id;
    if (form?.supplier_id && form.supplier_id !== '') sanitized.supplier_id = form.supplier_id;
    if (form?.client_id && form.client_id !== '') sanitized.client_id = form.client_id;
    if (form?.os_id && form.os_id !== '') sanitized.os_id = form.os_id;

    return sanitized;
  };

  const sanitizeForComparison = (form) => {
    const sanitized = sanitizeExpenseForm(form);
    return {
      ...sanitized,
      total_value: sanitized.total_value ?? null,
      NR: sanitized.NR ?? null,
      sub_category_id: sanitized.sub_category_id ?? null,
      type_payment_id: sanitized.type_payment_id ?? null,
      account_id: sanitized.account_id ?? null,
      supplier_id: sanitized.supplier_id ?? null,
      card_id: sanitized.card_id ?? null,
      client_id: sanitized.client_id ?? null,
      os_id: sanitized.os_id ?? null,
      imprevist: sanitized.imprevist ?? false,
      expense_fixed: sanitized.expense_fixed ?? false,
    };
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const sanitizedForm = sanitizeExpenseForm(expenseForm);

    // Validações dos campos obrigatórios conforme banco de dados
    if (sanitizedForm.total_value === null || sanitizedForm.total_value <= 0) {
      showToast('Por favor, informe um valor total válido', 'error');
      return;
    }

    if (!sanitizedForm.date_expense) {
      showToast('Por favor, informe a data da despesa', 'error');
      return;
    }

    if (!sanitizedForm.sub_category_id) {
      showToast('Por favor, selecione uma subcategoria', 'error');
      return;
    }

    if (!sanitizedForm.account_id) {
      showToast('Por favor, selecione uma conta', 'error');
      return;
    }

    if (editingExpense) {
      const current = sanitizeForComparison(expenseForm);
      const original = sanitizeForComparison(originalExpenseData || {});
      const changedFields = {};

      Object.keys(current).forEach((key) => {
        if (current[key] !== original[key]) {
          changedFields[key] = current[key];
        }
      });
      
      // Se não houver alterações, não faz a requisição
      if (Object.keys(changedFields).length === 0) {
        showToast('Nenhuma alteração foi feita', 'info');
        setShowModal(false);
        return;
      }
      
      try {
        setExpenseLoading(true);
        await expensesApi.update(editingExpense.expense_id, changedFields);
        showToast('Despesa atualizada com sucesso!', 'success');
        setShowModal(false);
        setOriginalExpenseData(null);
        loadData();
      } catch (error) {
        console.error('Erro ao salvar despesa:', error);
        showToast(error.response?.data?.message || 'Erro ao salvar despesa', 'error');
      } finally {
        setExpenseLoading(false);
      }
    } else {
      // POST: Criação de nova despesa
      if (isInstallment && step === 'general') {
        setStep('installments');
        return;
      }

      try {
        setExpenseLoading(true);

        // Garantir precisão do total_value
        const createPayload = {
          ...sanitizedForm,
          total_value: Number((sanitizedForm.total_value ?? 0).toFixed(2)),
        };

        if (!isInstallment || installmentCount <= 1) {
          // Despesa à vista - envia payload direto
          await expensesApi.create(createPayload);
        } else {
          const provided = Array.isArray(installments) ? installments : [];
          if (provided.length !== installmentCount) {
            showToast('Preencha todas as parcelas', 'error');
            setExpenseLoading(false);
            return;
          }

          const installmentRecords = [];
          let installmentsTotal = 0;

          for (let index = 0; index < installmentCount; index += 1) {
            const currentInstallment = provided[index] || {};
            const value = toNumberOrNull(currentInstallment.value);

            if (value === null || value <= 0) {
              showToast(`Por favor, informe um valor válido para a parcela ${index + 1}`, 'error');
              setExpenseLoading(false);
              return;
            }

            if (!currentInstallment.due_date) {
              showToast(`Por favor, informe a data de vencimento da parcela ${index + 1}`, 'error');
              setExpenseLoading(false);
              return;
            }

            installmentsTotal += value;
            installmentRecords.push({
              // Backend validator exige expense_id como string, mas serviço ignora e substitui.
              // Enviamos string vazia para satisfazer @IsString sem conhecer o UUID ainda.
              expense_id: '',
              installment_number: index + 1,
              installment_total: installmentCount,
              due_date: currentInstallment.due_date,
              value,
              payment_date: currentInstallment.payment_date || null,
              imprevist: Boolean(
                currentInstallment.imprevist ?? expenseForm.imprevist
              ),
            });
          }

          const payloadWithInstallments = {
            ...createPayload,
            total_value: Number(installmentsTotal.toFixed(2)),
            installments: installmentRecords,
          };

          await expensesApi.create(payloadWithInstallments);
        }

        showToast('Despesa criada com sucesso!', 'success');
        setShowModal(false);
        setOriginalExpenseData(null);
        loadData();
      } catch (error) {
        console.error('Erro ao salvar despesa:', error);
        showToast(error.response?.data?.message || 'Erro ao salvar despesa', 'error');
      } finally {
        setExpenseLoading(false);
      }
    }
  };

  // Handle next step when creating an installment flow (triggered by the "Próximo" button)
  const handleNextStep = (e) => {
    // Prevent any default if called from a button inside a form
    if (e && e.preventDefault) e.preventDefault();

    if (!expenseForm.account_id) {
      showToast('Por favor, selecione uma conta', 'error');
      return;
    }

    setStep('installments');
    const total = Math.max(1, Math.min(36, parseInt(String(installmentCount || '1'), 10)));
    const newInst = Array.from({ length: total }).map((_, i) => ({
      index: i + 1,
      value: '',
      due_date: expenseForm.means_due_date || '',
      installment_info: `${i + 1}/${total}`,
      imprevist: Boolean(expenseForm.imprevist),
    }));
    setInstallments(newInst);
  };

  const handleDeleteExpense = (expense) => {
    setConfirmModal({
      show: true,
      id: expense.expense_id,
      description: expense.description
    });
  };

  const confirmDeleteExpense = async () => {
    try {
      await expensesApi.delete(confirmModal.id);
      showToast('Despesa excluída com sucesso!', 'success');
      setConfirmModal({ show: false, id: null, description: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir despesa', 'error');
      setConfirmModal({ show: false, id: null, description: '' });
    }
  };

  // Função para determinar status automático baseado nas regras
  const getAutoStatus = (expense) => {
    // Se for parcelada, só está paga se todas as parcelas estiverem pagas
    if (expense.installments && expense.installments.length > 1) {
      const allPaid = expense.installments.every(inst => !!inst.payment_date);
      if (allPaid) return { status: 'paid', label: 'Paga', color: 'text-green-700', bg: 'bg-green-100' };
      const anyOverdue = expense.installments.some(inst => !inst.payment_date && new Date(inst.due_date) < new Date());
      if (anyOverdue) return { status: 'overdue', label: 'Vencida', color: 'text-red-700', bg: 'bg-red-100' };
      return { status: 'pending', label: 'Pendente', color: 'text-yellow-700', bg: 'bg-yellow-100' };
    }
    // Despesa à vista (sem parcelas ou só 1)
    if (expense.payment_date) return { status: 'paid', label: 'Paga', color: 'text-green-700', bg: 'bg-green-100' };
    if (!expense.means_due_date) return { status: 'pending', label: 'Pendente', color: 'text-yellow-700', bg: 'bg-yellow-100' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(expense.means_due_date);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) return { status: 'overdue', label: 'Vencida', color: 'text-red-700', bg: 'bg-red-100' };
    return { status: 'pending', label: 'Pendente', color: 'text-yellow-700', bg: 'bg-yellow-100' };
  };

  // Função para calcular dias vencidos ou a vencer
  const getDaysOverdue = (expense) => {
    if (!expense.means_due_date) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(expense.means_due_date);
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

  // Transformar cada parcela em uma "despesa" apenas para estatísticas
  const allExpenses = expenses.flatMap(expense => {
    if (expense.installments && expense.installments.length > 0) {
      return expense.installments.map(inst => ({
        ...expense,
        total_value: inst.value,
        means_due_date: inst.due_date,
        payment_date: inst.payment_date,
        installment_number: inst.installment_number,
        installment_total: inst.installment_total,
        installment_id: inst.installment_id,
        isInstallment: true,
      }));
    }
    return [{ ...expense, isInstallment: false }];
  });

  // Listagem principal: filtrar apenas as despesas originais
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      (expense.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.NF?.toString() || '').includes(searchTerm);
    if (!matchesSearch) return false;
    if (filters.supplier_id && expense.supplier?.supplier_id !== filters.supplier_id) return false;
    if (filters.account_id && expense.account?.account_id !== filters.account_id) return false;
    if (filters.sub_category_id && expense.sub_category?.sub_category_id !== parseInt(filters.sub_category_id)) return false;
    if (filters.type_payment_id && expense.type_payment?.type_payment_id !== parseInt(filters.type_payment_id)) return false;
    if (filters.card_id && expense.card?.card_id !== filters.card_id) return false;
    if (filters.os_id && expense.orders_service?.os_id !== filters.os_id) return false;
    if (filters.month_expense && expense.date_expense) {
      const expenseDate = new Date(expense.date_expense);
      const [year, month] = filters.month_expense.split('-');
      if (expenseDate.getFullYear() !== parseInt(year) || (expenseDate.getMonth() + 1) !== parseInt(month)) {
        return false;
      }
    }
    // Filtro por data de pagamento específica
    if (filters.payment_date) {
      // Verifica se a despesa tem parcelas
      if (expense.installments && expense.installments.length > 0) {
        // Se tem parcelas, verifica se alguma parcela tem payment_date igual ao filtro
        const hasMatchingPayment = expense.installments.some(inst => {
          if (!inst.payment_date) return false;
          const instPaymentDate = inst.payment_date.split('T')[0];
          return instPaymentDate === filters.payment_date;
        });
        if (!hasMatchingPayment) return false;
      } else {
        // Se não tem parcelas, verifica o payment_date da despesa principal
        if (!expense.payment_date) return false;
        const expensePaymentDate = expense.payment_date.split('T')[0];
        if (expensePaymentDate !== filters.payment_date) return false;
      }
    }
    if (filterStatus === 'all') return true;
    const autoStatus = getAutoStatus(expense);
    if (filterStatus === 'paid') return autoStatus.status === 'paid';
    if (filterStatus === 'overdue') return autoStatus.status === 'overdue';
    if (filterStatus === 'pending') return autoStatus.status === 'pending';
    return true;
  });

  // Estatísticas baseadas em todas as parcelas (ou despesas à vista)
  const stats = {
    total: allExpenses.length,
    totalValue: allExpenses.reduce((sum, e) => sum + (parseFloat(e.total_value) || 0), 0),
    paid: allExpenses.filter(e => !!e.payment_date).length,
    paidValue: allExpenses.filter(e => !!e.payment_date).reduce((sum, e) => sum + (parseFloat(e.total_value) || 0), 0),
    overdue: allExpenses.filter(e => !e.payment_date && e.means_due_date && new Date(e.means_due_date) < new Date()).length,
    overdueValue: allExpenses.filter(e => !e.payment_date && e.means_due_date && new Date(e.means_due_date) < new Date()).reduce((sum, e) => sum + (parseFloat(e.total_value) || 0), 0),
    pending: allExpenses.filter(e => !e.payment_date && (!e.means_due_date || new Date(e.means_due_date) >= new Date())).length,
    pendingValue: allExpenses.filter(e => !e.payment_date && (!e.means_due_date || new Date(e.means_due_date) >= new Date())).reduce((sum, e) => sum + (parseFloat(e.total_value) || 0), 0),
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

  // ====== FUNÇÕES PARA GERENCIAR TIPOS DE PAGAMENTO ======
  const handleOpenTypePaymentModal = () => {
    setTypePaymentForm({ name_type_payment: '', description: '' });
    setEditingTypePayment(null);
    setShowTypePaymentModal(true);
  };

  const handleEditTypePayment = (typePayment) => {
    setEditingTypePayment(typePayment);
    setTypePaymentForm({
      name_type_payment: typePayment.name_type_payment || '',
      description: typePayment.description || ''
    });
    setShowTypePaymentModal(true);
  };

  const handleSaveTypePayment = async (e) => {
    e.preventDefault();
    setTypePaymentLoading(true);
    try {
      if (editingTypePayment) {
        await typePaymentApi.update(editingTypePayment.type_payment_id, typePaymentForm);
        showToast('Tipo de pagamento atualizado!', 'success');
      } else {
        await typePaymentApi.create(typePaymentForm);
        showToast('Tipo de pagamento criado!', 'success');
      }
      setTypePaymentForm({ name_type_payment: '', description: '' });
      setEditingTypePayment(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar tipo de pagamento:', error);
      showToast('Erro ao salvar tipo de pagamento', 'error');
    } finally {
      setTypePaymentLoading(false);
    }
  };

  const handleDeleteTypePayment = (typePayment) => {
    setConfirmTypePaymentModal({
      show: true,
      typePaymentId: typePayment.type_payment_id,
      typePaymentName: typePayment.name_type_payment
    });
  };

  const confirmDeleteTypePayment = async () => {
    try {
      await typePaymentApi.delete(confirmTypePaymentModal.typePaymentId);
      showToast('Tipo de pagamento excluído!', 'success');
      setConfirmTypePaymentModal({ show: false, typePaymentId: null, typePaymentName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir tipo de pagamento:', error);
      showToast('Erro ao excluir tipo de pagamento', 'error');
    }
  };

  const handleCancelTypePaymentEdit = () => {
    setShowTypePaymentModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Despesas</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie suas despesas financeiras</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowTypePaymentModal(true)}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <CreditCard size={18} />
                <span className="hidden sm:inline">Tipos de Pagamento</span>
              </button>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Despesa</span>
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
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-red-600" size={20} />
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
              <p className="text-[10px] text-green-600">Soma das despesas</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-emerald-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs text-emerald-600 truncate font-medium">Pagas</p>
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
                    placeholder="Buscar por descrição, NF ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm ${
                    showFilters ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fornecedor</label>
                    <select
                      value={filters.supplier_id}
                      onChange={(e) => setFilters({ ...filters, supplier_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option key="all-suppliers" value="">Todos</option>
                      {(Array.isArray(suppliers) ? suppliers : []).map(sup => (
                        <option key={sup.supplier_id} value={sup.supplier_id}>{sup.name_supplier}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Conta</label>
                    <select
                      value={filters.account_id}
                      onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option key="all-accounts-filter" value="">Todas</option>
                      {(Array.isArray(accounts) ? accounts : []).map(acc => (
                        <option key={acc.account_id} value={acc.account_id}>{acc.name_account}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub-Categoria</label>
                    <select
                      value={filters.sub_category_id}
                      onChange={(e) => setFilters({ ...filters, sub_category_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option key="all-subcategories-filter" value="">Todas</option>
                      {subCategories.map(cat => (
                        <option key={cat.sub_category_id} value={cat.sub_category_id}>{cat.name_sub_category}</option>
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
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-t-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <select
                        value={filters.os_id}
                        onChange={(e) => {
                          setFilters({ ...filters, os_id: e.target.value });
                          setOsFilterSearchTerm('');
                        }}
                        size="4"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 border-t-0"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mês de Despesa</label>
                    <input
                      type="month"
                      value={filters.month_expense}
                      onChange={(e) => setFilters({ ...filters, month_expense: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Selecione o mês"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Pagamento</label>
                    <input
                      type="date"
                      value={filters.payment_date}
                      onChange={(e) => setFilters({ ...filters, payment_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                Pagas
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

        {/* Lista de Despesas */}
        {expenseLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-600"></div>
            <p className="text-gray-600 mt-4">Carregando...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <TrendingDown size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 font-medium">Nenhuma despesa encontrada</p>
          </div>
        ) : (
          <>
            {/* Mobile - Cards com Scroll */}
            <div className={`block md:hidden bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-200 ${filteredExpenses.length > 5 ? 'overflow-y-auto' : ''}`} style={{ maxHeight: filteredExpenses.length > 5 ? '480px' : 'none' }}>
              {filteredExpenses.map((expense) => {
                const autoStatus = getAutoStatus(expense);
                
                // Só mostra cartão para despesa à vista (sem parcelas ou só 1 parcela)
                if (expense.installments && expense.installments.length > 1) {
                  // Para parceladas, mostrar card com contador de parcelas pagas
                  const total = expense.installments.length;
                  const pagas = expense.installments.filter(inst => !!inst.payment_date).length;
                  return (
                    <div key={expense.expense_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Building className="text-red-600" size={18} />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="font-semibold text-gray-900 text-sm truncate" title={expense.description}>{expense.description}</h3>
                            {expense.supplier?.name_supplier && (
                              <p className="text-xs text-gray-500 truncate" title={expense.supplier.name_supplier}>{expense.supplier.name_supplier}</p>
                            )}
                            {expense.expense_fixed && (
                              <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                                <CheckCircle size={10} /> Conta essencial
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">NF:</span>
                          <span className="font-mono text-gray-700">{expense.NF || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Valor:</span>
                          <span className="font-bold text-red-600">{formatCurrency(expense.total_value)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vencimento:</span>
                          <span className="text-gray-700">{formatDate(expense.means_due_date)}</span>
                        </div>
                        {!expense.payment_date && expense.means_due_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Prazo:</span>
                            <span className={`font-semibold ${
                              getDaysOverdue(expense) > 0 ? 'text-red-600' : 
                              getDaysOverdue(expense) === 0 ? 'text-orange-600' : 
                              'text-blue-600'
                            }`}>
                              {formatDaysOverdue(getDaysOverdue(expense))}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Status:</span>
                          <div className="relative group inline-block">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-${autoStatus.bg}-600 text-${autoStatus.color}`}>
                              {autoStatus.status === 'paid' && <CheckCircle size={12} />}
                              {autoStatus.status === 'overdue' && <AlertCircle size={12} />}
                              {autoStatus.status === 'pending' && <Clock size={12} />}
                              {autoStatus.label}
                            </span>
                            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-9 z-20">
                              <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-1 shadow-lg whitespace-nowrap">
                                {expense.payment_date ? (
                                  `Pago em ${formatDate(expense.payment_date)}`
                                ) : (
                                  formatDaysOverdue(getDaysOverdue(expense))
                                )}
                              </div>
                              <div className="w-2 h-2 bg-gray-900 rotate-45 mt-[-6px] mx-auto" />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Categoria:</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                            {expense.sub_category?.name_sub_category || 'Sem categoria'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Conta:</span>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-800">
                            {expense.account?.name_account || '-'}
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
                  <div key={expense.expense_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building className="text-red-600" size={18} />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h3 className="font-semibold text-gray-900 text-sm truncate" title={expense.description}>{expense.description}</h3>
                          {expense.supplier?.name_supplier && (
                            <p className="text-xs text-gray-500 truncate" title={expense.supplier.name_supplier}>{expense.supplier.name_supplier}</p>
                          )}
                            {expense.expense_fixed && (
                              <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                                <CheckCircle size={10} /> Conta essencial
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">NF:</span>
                        <span className="font-mono text-gray-700">{expense.NF || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor:</span>
                        <span className="font-bold text-red-600">{formatCurrency(expense.total_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vencimento:</span>
                        <span className="text-gray-700">{formatDate(expense.means_due_date)}</span>
                      </div>
                      {!expense.payment_date && expense.means_due_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Prazo:</span>
                          <span className={`font-semibold ${
                            getDaysOverdue(expense) > 0 ? 'text-red-600' : 
                            getDaysOverdue(expense) === 0 ? 'text-orange-600' : 
                            'text-blue-600'
                          }`}>
                            {formatDaysOverdue(getDaysOverdue(expense))}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status:</span>
                        <div className="relative group inline-block">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${autoStatus.bg}`}>
                            {autoStatus.status === 'paid' && <CheckCircle size={12} />}
                            {autoStatus.status === 'overdue' && <AlertCircle size={12} />}
                            {autoStatus.status === 'pending' && <Clock size={12} />}
                            {autoStatus.label}
                          </span>

                          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 -top-9 z-20">
                            <div className="bg-gray-900 text-white text-xs rounded-md px-3 py-1 shadow-lg whitespace-nowrap">
                              {expense.payment_date ? (
                                `Pago em ${formatDate(expense.payment_date)}`
                              ) : (
                                formatDaysOverdue(getDaysOverdue(expense))
                              )}
                            </div>
                            <div className="w-2 h-2 bg-gray-900 rotate-45 mt-[-6px] mx-auto" />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Categoria:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                          {expense.sub_category?.name_sub_category || 'Sem categoria'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Conta:</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-800">
                          {expense.account?.name_account || '-'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => {
                            if (autoStatus.status !== 'paid') {
                              handlePayExpense(expense);
                            }
                          }}
                          disabled={autoStatus.status === 'paid'}
                          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-lg border ${autoStatus.status === 'paid' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-green-700 border-green-200 hover:bg-green-50'}`}
                        >
                          {autoStatus.status === 'paid' ? 'Pago' : 'Pagar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop - Tabela com Scroll após 5 despesas */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
              <div className={filteredExpenses.length > 5 ? "overflow-y-auto" : ""} style={{ maxHeight: filteredExpenses.length > 5 ? '480px' : 'none' }}>
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase bg-gray-50 w-[18%]">Fornecedor</th>
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase bg-gray-50 w-[10%]">NF</th>
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase bg-gray-50 w-[15%]">Subcategoria</th>
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase bg-gray-50 w-[10%]">Valor</th>
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase bg-gray-50 w-[20%]">Datas</th>
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase bg-gray-50 w-[12%]">Status</th>
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase bg-gray-50 w-[8%]">Pagar</th>
                      <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-700 uppercase bg-gray-50 w-[7%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.map((expense) => {
                      const autoStatus = getAutoStatus(expense);
                      const hasInstallments = Array.isArray(expense.installments) && expense.installments.length > 0;
                      const sortedInstallments = hasInstallments
                        ? [...expense.installments].sort((a, b) => (a.installment_number || 0) - (b.installment_number || 0))
                        : [];
                      return (
                        <React.Fragment key={expense.expense_id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            {/* Fornecedor */}
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-1 overflow-hidden">
                                {hasInstallments && (
                                  <button
                                    onClick={() => toggleExpandRow(expense.expense_id)}
                                    className="p-0.5 rounded hover:bg-gray-200 flex-shrink-0"
                                    title={expandedRows[expense.expense_id] ? 'Ocultar parcelas' : 'Mostrar parcelas'}
                                  >
                                    {expandedRows[expense.expense_id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                )}
                                <div className="min-w-0 overflow-hidden">
                                  <p className="text-xs font-semibold text-gray-900 truncate" title={expense.supplier?.name_supplier || expense.description}>
                                    {expense.supplier?.name_supplier || expense.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            {/* Nota Fiscal */}
                            <td className="px-2 py-2">
                              <span className="text-xs text-gray-700 font-mono">{expense.NF || '-'}</span>
                            </td>
                            {/* Subcategoria */}
                            <td className="px-2 py-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700 truncate max-w-full" title={expense.sub_category?.name_sub_category}>
                                {expense.sub_category?.name_sub_category || 'Sem categoria'}
                              </span>
                            </td>
                            {/* Valor */}
                            <td className="px-2 py-2">
                              <span className="text-xs font-bold text-red-600">{formatCurrency(expense.total_value)}</span>
                            </td>
                            {/* Datas */}
                            <td className="px-2 py-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-gray-500 w-12">Desp:</span>
                                  <span className="text-[10px] text-gray-900">{formatDate(expense.date_expense)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] text-gray-500 w-12">Venc:</span>
                                  <span className="text-[10px] text-gray-900">{formatDate(expense.means_due_date)}</span>
                                </div>
                                {expense.payment_date && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-gray-500 w-12">Pago:</span>
                                    <span className="text-[10px] text-emerald-600 font-medium">{formatDate(expense.payment_date)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            {/* Status */}
                            <td className="px-2 py-2">
                              {(() => {
                                const statusColors = {
                                  paid: { bg: '#D1FAE5', color: '#059669' },
                                  pending: { bg: '#FED7AA', color: '#EA580C' },
                                  overdue: { bg: '#FEE2E2', color: '#DC2626' }
                                };
                                const statusLabels = {
                                  paid: 'Paga',
                                  pending: 'Pendente',
                                  overdue: 'Vencida'
                                };
                                const statusStyle = statusColors[autoStatus.status] || statusColors.pending;
                                return (
                                  <div className="relative group inline-block">
                                    <span 
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full`}
                                      style={{ 
                                        backgroundColor: statusStyle.bg,
                                        color: statusStyle.color
                                      }}
                                    >
                                      {autoStatus.status === 'paid' && <CheckCircle size={10} />}
                                      {autoStatus.status === 'overdue' && <AlertCircle size={10} />}
                                      {autoStatus.status === 'pending' && <Clock size={10} />}
                                      {statusLabels[autoStatus.status] || autoStatus.label}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                            {/* Pagar */}
                            <td className="px-2 py-2 text-center">
                              {sortedInstallments.length > 1 ? (
                                (() => {
                                  const total = sortedInstallments.length;
                                  const pagas = sortedInstallments.filter(inst => !!inst.payment_date).length;
                                  return (
                                    <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-gray-100 text-gray-700">
                                      {pagas}/{total}
                                    </span>
                                  );
                                })()
                              ) : (
                                <button
                                  onClick={() => {
                                    if (autoStatus.status !== 'paid') {
                                      handlePayExpense(expense);
                                    }
                                  }}
                                  disabled={autoStatus.status === 'paid'}
                                  className={`px-2 py-0.5 text-[10px] font-medium rounded border ${autoStatus.status === 'paid' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-green-700 border-green-200 hover:bg-green-50'}`}
                                >
                                  {autoStatus.status === 'paid' ? 'Pago' : 'Pagar'}
                                </button>
                              )}
                            </td>
                            {/* Ações */}
                            <td className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleEditExpense(expense)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(expense)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Parcelas (subtópico) */}
                          {hasInstallments && expandedRows[expense.expense_id] && sortedInstallments.map((inst) => {
                            const isPaid = !!inst.payment_date;
                            const isOverdue = !isPaid && inst.due_date ? new Date(inst.due_date) < new Date() : false;
                            return (
                              <tr key={inst.installment_id || `${expense.expense_id}-${inst.installment_number}`}
                                className="bg-gray-50 border-t border-b border-gray-200 text-[10px]">
                                <td className="px-2 py-1 pl-6" colSpan={2}>
                                  <span className="font-semibold text-gray-700">Parcela {inst.installment_number}/{inst.installment_total}</span>
                                </td>
                                <td className="px-2 py-1">-</td>
                                <td className="px-2 py-1">
                                  <span className="text-xs font-semibold text-red-600">{formatCurrency(inst.value)}</span>
                                </td>
                                <td className="px-2 py-1">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[9px] text-gray-500 w-12">Venc:</span>
                                      <span className="text-[10px] text-gray-900">{formatDate(inst.due_date)}</span>
                                    </div>
                                    {isPaid && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[9px] text-gray-500 w-12">Pago:</span>
                                        <span className="text-[10px] text-emerald-600 font-medium">{formatDate(inst.payment_date)}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${isPaid ? 'bg-green-100 text-green-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {isPaid ? 'Paga' : isOverdue ? 'Vencida' : 'Pendente'}
                                  </span>
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <div className="flex items-center gap-1 justify-center">
                                    {!isPaid && (
                                      <button
                                        onClick={() => handleMarkInstallmentPaid(inst)}
                                        className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-all text-[9px] font-semibold disabled:opacity-60"
                                        disabled={installmentActionLoading}
                                      >
                                        <CheckCircle size={10} />
                                        Pagar
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <button
                                    onClick={() => handleEditInstallment(inst)}
                                    className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] hover:bg-red-700"
                                  >
                                    <Edit size={10} />
                                  </button>
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

        {!loading && filteredExpenses.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {filteredExpenses.length} de {expenses.length} despesas
          </div>
        )}
      </div>

      {/* Prompt de Parcelamento */}
      {showInstallPrompt && renderInstallPrompt()}

      <ExpenseModal
        showModal={showModal}
        setShowModal={setShowModal}
        editingExpense={editingExpense}
        expenseForm={expenseForm}
        setExpenseForm={setExpenseForm}
        isInstallment={isInstallment}
        installmentCount={installmentCount}
        setInstallmentCount={setInstallmentCount}
        installments={installments}
        setInstallments={setInstallments}
        accounts={accounts}
        ordersService={ordersService}
        step={step}
        setStep={setStep}
        handleSaveExpense={handleSaveExpense}
        handleNextStep={handleNextStep}
        expenseLoading={expenseLoading}
        osSearchTerm={osSearchTerm}
        setOsSearchTerm={setOsSearchTerm}
        subCategories={subCategories}
        typePayments={typePayments}
        suppliers={suppliers}
        cards={cards}
      />

      {/* Modal de Confirmação */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmModal({ show: false, id: null, description: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Despesa?</h3>
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmModal.description}</p>
              <p className="text-xs text-red-600 mb-4">⚠️ Esta ação não pode ser desfeita</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmModal({ show: false, id: null, description: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteExpense}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tipo de Pagamento - Ultra Compacto */}
      {showTypePaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header Mini */}
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-purple-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <CreditCard className="text-white" size={16} />
                <h2 className="text-base sm:text-lg font-bold text-white">Tipos de Pagamento</h2>
              </div>
              <button
                onClick={() => {
                  setShowTypePaymentModal(false);
                  handleCancelTypePaymentEdit();
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
                    {editingTypePayment ? <Edit size={14} /> : <Plus size={14} />}
                    {editingTypePayment ? 'Editar' : 'Novo'}
                  </h3>
                
                  <form onSubmit={handleSaveTypePayment} className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={typePaymentForm.name_type_payment}
                        onChange={(e) => setTypePaymentForm({ ...typePaymentForm, name_type_payment: e.target.value })}
                        placeholder="Ex: PIX, Dinheiro..."
                        className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        disabled={typePaymentLoading}
                      />
                    </div>
                  
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Descrição
                      </label>
                      <textarea
                        value={typePaymentForm.description}
                        onChange={(e) => setTypePaymentForm({ ...typePaymentForm, description: e.target.value })}
                        placeholder="Descreva..."
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 resize-none"
                        disabled={typePaymentLoading}
                      />
                    </div>
                  
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={typePaymentLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 text-xs rounded font-medium transition-all disabled:opacity-50"
                      >
                        {typePaymentLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            {editingTypePayment ? <Edit size={12} /> : <Plus size={12} />}
                            {editingTypePayment ? 'Atualizar' : 'Criar'}
                          </>
                        )}
                      </button>
                    
                      {editingTypePayment && (
                        <button
                          type="button"
                          onClick={handleCancelTypePaymentEdit}
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
                    <CreditCard className="text-purple-600" size={14} />
                    Lista ({typePayments.length})
                  </h3>
                </div>

                {typePayments.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-600 font-medium text-xs">Nenhum tipo</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[calc(85vh-160px)] overflow-y-auto pr-1">
                    {typePayments.map((tp) => {
                      const isEditing = editingTypePayment?.type_payment_id === tp.type_payment_id;
                    
                      return (
                        <div
                          key={tp.type_payment_id}
                          className={`bg-white rounded p-2 border transition-all ${
                            isEditing 
                              ? 'border-purple-500 shadow ring-1 ring-purple-200' 
                              : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h4 className="font-semibold text-gray-900 text-xs truncate">{tp.name_type_payment}</h4>
                                {isEditing && (
                                  <span className="px-1 py-0.5 bg-purple-600 text-white text-[9px] font-semibold rounded">
                                    Editando
                                  </span>
                                )}
                              </div>
                            
                              {tp.description && (
                                <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">{tp.description}</p>
                              )}
                            </div>
                          
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => handleEditTypePayment(tp)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                disabled={typePaymentLoading}
                                title="Editar"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteTypePayment(tp)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                disabled={typePaymentLoading}
                                title="Excluir"
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
                  setShowTypePaymentModal(false);
                  handleCancelTypePaymentEdit();
                }}
                className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-all font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Tipo de Pagamento */}
      {confirmTypePaymentModal.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setConfirmTypePaymentModal({ show: false, typePaymentId: null, typePaymentName: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Tipo de Pagamento?</h3>
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmTypePaymentModal.typePaymentName}</p>
              <p className="text-xs text-red-600 mb-4">⚠️ Esta ação não pode ser desfeita</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmTypePaymentModal({ show: false, typePaymentId: null, typePaymentName: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteTypePayment}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Pagamento de Parcela */}
      {confirmInstallmentPaymentModal.show && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmInstallmentPaymentModal({ show: false, installment: null })}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 m-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Marcar como Paga?</h3>
              <p className="text-sm text-gray-600 mb-1">Confirme o pagamento desta parcela:</p>
              {confirmInstallmentPaymentModal.installment && (
                <div className="bg-emerald-50 rounded-lg p-3 my-3 w-full border border-emerald-200">
                  <p className="text-sm font-semibold text-emerald-900">
                    Parcela {confirmInstallmentPaymentModal.installment.installment_number}/{confirmInstallmentPaymentModal.installment.installment_total}
                  </p>
                  <p className="text-lg font-bold text-emerald-700 mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(confirmInstallmentPaymentModal.installment.value)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Venc: {new Date(confirmInstallmentPaymentModal.installment.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mb-4">A data de pagamento será registrada como hoje</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmInstallmentPaymentModal({ show: false, installment: null })}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmMarkInstallmentPaid}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all text-sm font-medium shadow-lg shadow-emerald-500/30"
                >
                  ✓ Confirmar
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
