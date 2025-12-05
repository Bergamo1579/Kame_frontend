import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Building, DollarSign } from 'lucide-react';

export function EntryModal({
  showModal,
  setShowModal,
  editingEntry,
  entryForm,
  setEntryForm,
  isInstallment,
  installmentCount,
  installments,
  setInstallments,
  employees,
  accounts,
  paymentSituations,
  ordersService,
  step,
  setStep,
  handleSaveEntry,
  handleNextStep,
  entryLoading,
  osSearchTerm,
  setOsSearchTerm,
}) {
  // Calcular dias até vencimento
  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.floor((due - today) / (1000 * 60 * 60 * 24));
  };

  // Retornar classe de cor e mensagem
  const getDueStatus = (dueDate, paymentDate = null) => {
    // Se já foi recebido, não mostrar vencimento
    if (paymentDate) {
      return null;
    }
    
    if (!dueDate) return { color: 'text-gray-500', bg: 'bg-gray-50', icon: '📅', message: 'Data não preenchida' };
    
    const days = getDaysUntilDue(dueDate);
    
    if (days < 0) {
      return { 
        color: 'text-red-700', 
        bg: 'bg-red-50', 
        icon: '🔴', 
        message: `${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''} vencido${Math.abs(days) !== 1 ? 's' : ''}` 
      };
    }
    if (days === 0) {
      return { 
        color: 'text-orange-700', 
        bg: 'bg-orange-50', 
        icon: '⏰', 
        message: 'Vence hoje!' 
      };
    }
    if (days <= 7) {
      return { 
        color: 'text-orange-700', 
        bg: 'bg-orange-50', 
        icon: '⚠️', 
        message: `${days} dia${days !== 1 ? 's' : ''} para vencer` 
      };
    }
    
    return { 
      color: 'text-blue-700', 
      bg: 'bg-blue-50', 
      icon: '📅', 
      message: `${days} dias para vencer` 
    };
  };

  // Componente para exibir status de vencimento
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

  return (
    showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl my-8">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-2">
              <DollarSign className="text-white" size={20} />
              <h2 className="text-lg font-bold text-white">
                {editingEntry ? 'Editar Entrada' : 'Nova Entrada'}
              </h2>
              <span className="ml-2 inline-block text-xs bg-white/20 text-white px-2 py-0.5 rounded">
                {step}
              </span>
            </div>
            <button
              onClick={() => {
                setShowModal(false);
                setStep('prompt');
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors text-white"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSaveEntry} className="p-4 sm:p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* DADOS GERAIS */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building size={18} className="text-blue-600" />
                Dados Gerais
              </h3>

              <div className="space-y-4">
                {/* Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    maxLength={255}
                    value={entryForm.company}
                    onChange={(e) => setEntryForm({ ...entryForm, company: e.target.value })}
                    placeholder="Nome da empresa"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={entryLoading}
                  />
                </div>

                {/* NF */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NF
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={entryForm.NF}
                    onChange={(e) => {
                      const digits = String(e.target.value || '').replace(/\D+/g, '');
                      setEntryForm({ ...entryForm, NF: digits });
                    }}
                    placeholder="Número da NF"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={entryLoading}
                  />
                </div>

                {/* Ordem de Serviço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordem de Serviço {!editingEntry && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Digite o ID da OS..."
                      value={osSearchTerm}
                      onChange={(e) => setOsSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-t-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={entryLoading}
                    />
                    <select
                      required={!editingEntry}
                      value={entryForm.os_id}
                      onChange={(e) => {
                        setEntryForm({ ...entryForm, os_id: e.target.value });
                        setOsSearchTerm('');
                      }}
                      size="4"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-t-0"
                      disabled={entryLoading}
                    >
                      <option key="none-os-select" value="">
                        Nenhuma
                      </option>
                      {(Array.isArray(ordersService) ? ordersService : [])
                        .filter((os) => {
                          if (!osSearchTerm) return true;
                          const osId = os.id?.toString() || '';
                          return osId.includes(osSearchTerm);
                        })
                        .sort((a, b) => (a.id || 0) - (b.id || 0))
                        .map((os) => (
                          <option key={os.os_id} value={os.os_id}>
                            OS #{os.id || os.os_id.slice(0, 8)}
                          </option>
                        ))}
                      {(Array.isArray(ordersService) ? ordersService : []).filter((os) => {
                        if (!osSearchTerm) return true;
                        return (os.id?.toString() || '').includes(osSearchTerm);
                      }).length === 0 && (
                        <option key="none-os-found" disabled>
                          Nenhuma OS encontrada
                        </option>
                      )}
                    </select>
                  </div>
                  {entryForm.os_id && (
                    <p className="text-[10px] mt-1 text-gray-600">
                      ✓ OS #
                      {(Array.isArray(ordersService)
                        ? ordersService.find((os) => os.os_id === entryForm.os_id)
                        : null)?.id || entryForm.os_id.slice(0, 8)}
                    </p>
                  )}
                </div>

                {/* Conta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conta {!editingEntry && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    required={!editingEntry}
                    value={entryForm.account_id}
                    onChange={(e) => setEntryForm({ ...entryForm, account_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={entryLoading}
                  >
                    <option key="select-account" value="">
                      Selecione uma conta
                    </option>
                    {accounts.map((acc) => (
                      <option key={acc.account_id} value={acc.account_id}>
                        {acc.name_account}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Funcionário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Funcionário
                  </label>
                  <select
                    value={entryForm.employee_id}
                    onChange={(e) => setEntryForm({ ...entryForm, employee_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={entryLoading}
                  >
                    <option key="select-employee" value="">
                      Selecione um funcionário
                    </option>
                    {(Array.isArray(employees) ? employees : []).map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Situação Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Situação Pagamento
                  </label>
                  <select
                    value={entryForm.payment_situation_id}
                    onChange={(e) => setEntryForm({ ...entryForm, payment_situation_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={entryLoading}
                  >
                    <option key="select-situation" value="">
                      Selecione
                    </option>
                    {(Array.isArray(paymentSituations) ? paymentSituations : []).map((sit) => (
                      <option key={sit.payment_situation_id} value={sit.payment_situation_id}>
                        {sit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* DADOS PAGAMENTO - Para entrada única (não parcelada) */}
            {!isInstallment && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={18} className="text-blue-600" />
                  Dados Pagamento
                </h3>

                <div className="space-y-4">
                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor {!editingEntry && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      required={!editingEntry}
                      step="0.01"
                      min="0.01"
                      value={entryForm.value}
                      onChange={(e) => setEntryForm({ ...entryForm, value: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={entryLoading}
                    />
                  </div>

                  {/* Data Faturamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Faturamento {!editingEntry && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      required={!editingEntry}
                      value={entryForm.date_faturamento}
                      onChange={(e) => setEntryForm({ ...entryForm, date_faturamento: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={entryLoading}
                    />
                  </div>

                  {/* Data Vencimento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Vencimento {!editingEntry && !isInstallment && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      required={!editingEntry && !isInstallment}
                      value={entryForm.due_date}
                      onChange={(e) => setEntryForm({ ...entryForm, due_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={entryLoading}
                    />
                    <DueStatusBadge dueDate={entryForm.due_date} paymentDate={entryForm.date_payment} />
                  </div>

                  {/* Data de Recebimento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Recebimento
                    </label>
                    <input
                      type="date"
                      value={entryForm.date_payment}
                      onChange={(e) => setEntryForm({ ...entryForm, date_payment: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={entryLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DADOS PAGAMENTO - Para parcelas */}
            {isInstallment && step === 'installments' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={18} className="text-blue-600" />
                  Dados Pagamento por Parcela
                </h3>

                {Array.from({ length: installmentCount }).map((_, idx) => (
                  <div key={idx} className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900 text-sm">
                        Parcela {idx + 1} / {installmentCount}
                      </h4>
                      <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded">
                        {idx + 1}/{installmentCount}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Valor da parcela */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          required
                          value={installments[idx]?.value || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInstallments((insts) => {
                              const arr = [...insts];
                              arr[idx] = { ...arr[idx], value: val };
                              return arr;
                            });
                          }}
                          placeholder="0.00"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={entryLoading}
                        />
                      </div>

                      {/* Data Vencimento */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data Vencimento <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={installments[idx]?.due_date || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInstallments((insts) => {
                              const arr = [...insts];
                              arr[idx] = { ...arr[idx], due_date: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={entryLoading}
                        />
                        <DueStatusBadge dueDate={installments[idx]?.due_date} />
                      </div>

                      {/* Data de Recebimento (opcional) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Recebimento
                        </label>
                        <input
                          type="date"
                          value={installments[idx]?.payment_date || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInstallments((insts) => {
                              const arr = [...insts];
                              arr[idx] = { ...arr[idx], payment_date: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={entryLoading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setStep('prompt');
                  // Reset state se necessário
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
              >
                Cancelar
              </button>
              {!editingEntry && step === 'general' && isInstallment && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={entryLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  {entryLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Plus size={16} />
                      Próximo
                    </>
                  )}
                </button>
              )}
              {(!(!editingEntry && step === 'general' && isInstallment)) && (
                <button
                  type="submit"
                  disabled={entryLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  {entryLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      {!editingEntry && step === 'installments' ? (
                        <>
                          <Plus size={16} /> Criar {installmentCount} Entradas
                        </>
                      ) : null}
                      {!editingEntry && !isInstallment ? (
                        <>
                          <Plus size={16} /> Criar
                        </>
                      ) : null}
                      {editingEntry ? (
                        <>
                          <Edit size={16} /> Atualizar
                        </>
                      ) : null}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    )
  );
}
