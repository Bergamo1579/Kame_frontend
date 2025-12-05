import React, { useMemo, useEffect } from 'react';
import { X, DollarSign, CreditCard, Plus, CheckCircle } from 'lucide-react';

const ExpenseModal = ({
  showModal,
  setShowModal,
  editingExpense,
  expenseForm,
  setExpenseForm,
  isInstallment,
  installmentCount,
  setInstallmentCount,
  installments,
  setInstallments,
  accounts,
  ordersService,
  step,
  setStep,
  handleSaveExpense,
  handleNextStep,
  expenseLoading,
  osSearchTerm,
  setOsSearchTerm,
  subCategories,
  typePayments,
  suppliers,
  cards,
}) => {
  // Helpers replicating dynamic due status logic from EntryModal
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.floor((due - today) / (1000 * 60 * 60 * 24));
  };

  const getDueStatus = (dueDate, paymentDate = null) => {
    if (paymentDate) return null; // already paid
    if (!dueDate) return { color: 'text-gray-500', bg: 'bg-gray-50', icon: '📅', message: 'Data não preenchida' };
    const days = getDaysUntilDue(dueDate);
    if (days < 0) {
      return { color: 'text-red-700', bg: 'bg-red-50', icon: '🔴', message: `${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''} vencido${Math.abs(days) !== 1 ? 's' : ''}` };
    }
    if (days === 0) {
      return { color: 'text-orange-700', bg: 'bg-orange-50', icon: '⏰', message: 'Vence hoje!' };
    }
    if (days <= 7) {
      return { color: 'text-orange-700', bg: 'bg-orange-50', icon: '⚠️', message: `${days} dia${days !== 1 ? 's' : ''} para vencer` };
    }
    return { color: 'text-blue-700', bg: 'bg-blue-50', icon: '📅', message: `${days} dias para vencer` };
  };

  const DueStatusBadge = ({ dueDate, paymentDate = null }) => {
    const status = getDueStatus(dueDate, paymentDate);
    if (!status) return null;
    return (
      <div className={`mt-2 p-2 rounded-lg ${status.bg} text-xs font-semibold ${status.color} flex items-center gap-1`}> 
        <span>{status.icon}</span>
        <span>{status.message}</span>
      </div>
    );
  };

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(ordersService)) return [];
    if (!osSearchTerm) return ordersService;

    const term = osSearchTerm.toString().toLowerCase();
    return ordersService.filter((os) => {
      const identifier = (os.id ?? os.os_id ?? '').toString().toLowerCase();
      return identifier.includes(term);
    });
  }, [ordersService, osSearchTerm]);

  // Removed early return before hooks to satisfy react-hooks/rules-of-hooks.

  const isInstallmentFlow = isInstallment && Number(installmentCount) > 1;
  const allowInstallmentSteps = isInstallmentFlow && !editingExpense;
  const effectiveStep = allowInstallmentSteps ? (step === 'prompt' ? 'general' : step) : 'general';
  const showingInstallments = allowInstallmentSteps && effectiveStep === 'installments';

  const handleClose = () => {
    setShowModal(false);
    setStep('prompt');
  };

  const handleFieldChange = (field) => (event) => {
    const { type, checked, value } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setExpenseForm((prev) => {
      const updated = {
        ...prev,
        [field]: nextValue,
      };

      if (field === 'imprevist' && nextValue === true) {
        updated.expense_fixed = false;
      }

      if (field === 'expense_fixed' && nextValue === true) {
        updated.imprevist = false;
      }

      return updated;
    });

    if (field === 'imprevist' && isInstallmentFlow) {
      setInstallments((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((inst) => ({
          ...inst,
          imprevist: nextValue,
        }));
      });
    }

    if (field === 'expense_fixed' && nextValue === true && isInstallmentFlow) {
      setInstallments((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((inst) => ({
          ...inst,
          imprevist: false,
        }));
      });
    }
  };

  const handleInstallmentChange = (index, field, value) => {
    setInstallments((prev) => {
      const items = Array.isArray(prev) ? [...prev] : [];
      const current = items[index] || {};
      items[index] = {
        ...current,
        [field]: value,
        installment_number: current.installment_number ?? index + 1,
        installment_total: current.installment_total ?? (Number(installmentCount) || items.length),
      };
      return items;
    });
  };

  const handleInstallmentCountChange = (event) => {
    const nextValue = Number(event.target.value);
    if (Number.isNaN(nextValue)) {
      setInstallmentCount(2);
      return;
    }

    const clamped = Math.max(2, Math.min(36, nextValue));
    setInstallmentCount(clamped);
  };

  // Auto-sync total_value from parcel sum when parcelado
  useEffect(() => {
    if (isInstallmentFlow && Array.isArray(installments)) {
      const sum = installments.reduce((acc, inst) => acc + (parseFloat(inst.value) || 0), 0);
      setExpenseForm(prev => ({ ...prev, total_value: Number(sum.toFixed(2)) }));
    }
  }, [isInstallmentFlow, installments, setExpenseForm]);

  const renderGeneralStep = () => {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={expenseForm.description}
              onChange={handleFieldChange('description')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Resumo da despesa"
              maxLength={255}
              disabled={expenseLoading}
            />
          </div>
          {/* Valor Total - obrigatório apenas para à vista */}
          {!isInstallmentFlow && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Valor Total *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={expenseForm.total_value || ''}
                onChange={handleFieldChange('total_value')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="0,00"
                required
                disabled={expenseLoading}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Data da despesa *</label>
            <input
              type="date"
              value={expenseForm.date_expense}
              onChange={handleFieldChange('date_expense')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
              disabled={expenseLoading}
            />
          </div>
          {/* Vencimento - apenas para à vista */}
          {!isInstallmentFlow && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Data de vencimento</label>
              <input
                type="date"
                value={expenseForm.means_due_date}
                onChange={handleFieldChange('means_due_date')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                disabled={expenseLoading}
              />
              <DueStatusBadge dueDate={expenseForm.means_due_date} paymentDate={expenseForm.payment_date} />
            </div>
          )}
          {/* Data de pagamento - apenas para à vista */}
          {!isInstallmentFlow && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Data de pagamento</label>
              <input
                type="date"
                value={expenseForm.payment_date || ''}
                onChange={handleFieldChange('payment_date')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                disabled={expenseLoading}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Conta *</label>
            <select
              value={expenseForm.account_id}
              onChange={handleFieldChange('account_id')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
              disabled={expenseLoading}
            >
              <option value="">Selecione</option>
              {(accounts || []).map((account) => (
                <option key={account.account_id} value={account.account_id}>
                  {account.name_account}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de pagamento</label>
            <select
              value={expenseForm.type_payment_id}
              onChange={handleFieldChange('type_payment_id')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              disabled={expenseLoading}
            >
              <option value="">Selecione</option>
              {(typePayments || []).map((typePayment) => (
                <option key={typePayment.type_payment_id} value={typePayment.type_payment_id}>
                  {typePayment.name_type_payment || typePayment.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subcategoria *</label>
            <select
              value={expenseForm.sub_category_id}
              onChange={handleFieldChange('sub_category_id')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
              disabled={expenseLoading}
            >
              <option value="">Selecione</option>
              {(subCategories || []).map((category) => (
                <option key={category.sub_category_id} value={category.sub_category_id}>
                  {category.name_sub_category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Fornecedor</label>
            <select
              value={expenseForm.supplier_id}
              onChange={handleFieldChange('supplier_id')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              disabled={expenseLoading}
            >
              <option value="">Selecione</option>
              {(suppliers || []).map((supplier) => (
                <option key={supplier.supplier_id} value={supplier.supplier_id}>
                  {supplier.name_supplier}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cartão</label>
            <select
              value={expenseForm.card_id}
              onChange={handleFieldChange('card_id')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              disabled={expenseLoading}
            >
              <option value="">Selecione</option>
              {(cards || []).map((card) => (
                <option key={card.card_id} value={card.card_id}>
                  {card.name_card || card.flag}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">NF</label>
            <input
              type="text"
              value={expenseForm.NF || ''}
              onChange={handleFieldChange('NF')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Número da nota"
              disabled={expenseLoading}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">NR</label>
            <input
              type="text"
              value={expenseForm.NR || ''}
              onChange={handleFieldChange('NR')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Número de registro"
              disabled={expenseLoading}
            />
          </div>
          <div className="flex items-center gap-2 pt-6 md:col-span-2">
            {!isInstallmentFlow && (
              <>
                <input
                  id="expense-recorrencia"
                  type="checkbox"
                  checked={!!expenseForm.recorrencia}
                  onChange={handleFieldChange('recorrencia')}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  disabled={expenseLoading}
                />
                <label htmlFor="expense-recorrencia" className="text-xs font-semibold text-gray-700">
                  Despesa recorrente
                </label>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 pt-6 md:col-span-2">
            <input
              id="expense-imprevist"
              type="checkbox"
              checked={!!expenseForm.imprevist}
              onChange={handleFieldChange('imprevist')}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              disabled={expenseLoading}
            />
            <label htmlFor="expense-imprevist" className="text-xs font-semibold text-gray-700">
              Marcar como imprevisto
            </label>
          </div>
          <div className="flex items-center gap-2 pt-2 md:col-span-2">
            <input
              id="expense-fixed"
              type="checkbox"
              checked={!!expenseForm.expense_fixed}
              onChange={handleFieldChange('expense_fixed')}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              disabled={expenseLoading}
            />
            <label htmlFor="expense-fixed" className="text-xs font-semibold text-gray-700">
              Marcar como despesa fixa (conta essencial)
            </label>
          </div>
        </div>

        {/* Ordem de Serviço - estilo EntryModal (search + lista) */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Ordem de Serviço</label>
          <input
            type="text"
            placeholder="Digite o ID da OS..."
            value={osSearchTerm}
            onChange={(e) => setOsSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-t-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={expenseLoading}
          />
          <select
            value={expenseForm.os_id}
            onChange={(e) => {
              handleFieldChange('os_id')(e);
              setOsSearchTerm('');
            }}
            size={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 border-t-0"
            disabled={expenseLoading}
          >
            <option value="">Nenhuma</option>
            {filteredOrders
              .filter((os) => {
                if (!osSearchTerm) return true;
                const osId = (os.id ?? '').toString();
                return osId.includes(osSearchTerm);
              })
              .sort((a, b) => (a.id || 0) - (b.id || 0))
              .map((os) => (
                <option key={os.os_id || os.id} value={os.os_id}>
                  OS #{os.id || (os.os_id || '').slice(0, 8)}
                </option>
              ))}
            {filteredOrders.filter((os) => {
              if (!osSearchTerm) return true;
              return (os.id ?? '').toString().includes(osSearchTerm);
            }).length === 0 && (
              <option disabled>Nenhuma OS encontrada</option>
            )}
          </select>
        </div>

        {isInstallmentFlow && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantidade de parcelas</label>
              <input
                type="number"
                min="2"
                max="36"
                value={installmentCount}
                onChange={handleInstallmentCountChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                disabled={expenseLoading}
              />
            </div>
          </div>
        )}
      </>
    );
  };

  const renderInstallmentsStep = () => (
    <div className="space-y-3">
      {Array.isArray(installments) && installments.length > 0 ? (
        installments.map((installment, index) => (
          <div
            key={installment.installment_id || installment.installment_number || index}
            className="bg-white border border-gray-200 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700">
                <CreditCard size={14} />
                Parcela {index + 1} de {installmentCount}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Valor *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={installment.value ?? ''}
                  onChange={(event) => handleInstallmentChange(index, 'value', event.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  disabled={expenseLoading}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vencimento *</label>
                <input
                  type="date"
                  value={installment.due_date ?? ''}
                  onChange={(event) => handleInstallmentChange(index, 'due_date', event.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  disabled={expenseLoading}
                  required
                />
                <DueStatusBadge dueDate={installment.due_date} paymentDate={installment.payment_date} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pagamento</label>
                <input
                  type="date"
                  value={installment.payment_date ?? ''}
                  onChange={(event) => handleInstallmentChange(index, 'payment_date', event.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  disabled={expenseLoading}
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg py-6">
          Defina os dados gerais para gerar as parcelas.
        </div>
      )}
    </div>
  );

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-6">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-red-600 to-red-700">
          <div className="flex items-center gap-2">
            <DollarSign className="text-white" size={20} />
            <h2 className="text-lg font-bold text-white">
              {editingExpense ? 'Editar despesa' : 'Nova despesa'}
            </h2>
            {isInstallmentFlow && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded">
                {showingInstallments ? 'Parcelas' : 'Dados gerais'}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveExpense} className="p-4 sm:p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
            {showingInstallments ? renderInstallmentsStep() : renderGeneralStep()}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex gap-2">
              {showingInstallments && (
                <button
                  type="button"
                  onClick={() => setStep('general')}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  disabled={expenseLoading}
                >
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                disabled={expenseLoading}
              >
                Cancelar
              </button>
            </div>
            <div className="flex gap-2">
              {allowInstallmentSteps && !showingInstallments ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  disabled={expenseLoading}
                >
                  <CreditCard size={16} />
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-60"
                  disabled={expenseLoading}
                >
                  <Plus size={16} />
                  {editingExpense ? 'Atualizar' : 'Salvar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
