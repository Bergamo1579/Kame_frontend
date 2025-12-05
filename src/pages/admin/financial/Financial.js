import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, TrendingUp, Search, Plus, ArrowRightLeft, Edit, Trash2, X } from 'lucide-react';
import { accountsApi, cardsApi, historicAccountApi, financialApi } from '../../../services/api';
import Toast from '../../../components/Toast';

export default function Financial() {
  const [accounts, setAccounts] = useState([]);
  const [accountBalances, setAccountBalances] = useState({});
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts', 'cards'
  
  // Estados para Contas
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({ name_account: '', description: '', value_start: 0 });
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [confirmAccountModal, setConfirmAccountModal] = useState({ show: false, id: null, name: '' });
  
  // Estados para Cartões
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({ name_card: '', description: '', number_card: '', flag: '', account_id: '' });
  const [editingCard, setEditingCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [confirmCardModal, setConfirmCardModal] = useState({ show: false, id: null, name: '' });
  
  // Estados para regularização de contas
  const [showRegulationModal, setShowRegulationModal] = useState(false);
  const [regulationForm, setRegulationForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [regulationLoading, setRegulationLoading] = useState(false);
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showAccountModal || confirmAccountModal.show || showCardModal || confirmCardModal.show || showRegulationModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAccountModal, confirmAccountModal.show, showCardModal, confirmCardModal.show, showRegulationModal]);

  const loadData = async () => {
    try {
      // Minimal calls: accounts list, summary, cards. Summary contains the authoritative balances.
      const [accountsRes, cardsRes, summaryRes] = await Promise.all([
        accountsApi.getAll(),
        cardsApi.getAll(),
        accountsApi.getSummary().catch(err => ({ error: err }))
      ]);

      const accountsData = accountsRes.data || [];
      const cardsData = cardsRes.data || [];

      // Map balances from server summary when available
      const balances = {};
      if (summaryRes && !summaryRes.error && Array.isArray(summaryRes.data)) {
        summaryRes.data.forEach(row => {
          balances[row.account_id] = parseFloat(row.valor_atual) || 0;
        });
      } else {
        // Fallback: use account.value_start if summary not available
        accountsData.forEach(acc => {
          balances[acc.account_id] = parseFloat(acc.value_start) || 0;
        });
      }

      setAccounts(accountsData);
      setCards(cardsData);
      setAccountBalances(balances);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ====== FUNÇÕES PARA CONTAS ======
  const handleOpenAccountModal = () => {
    setAccountForm({ name_account: '', description: '', value_start: 0 });
    setEditingAccount(null);
    setShowAccountModal(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setAccountForm({
      name_account: account.name_account,
      description: account.description || '',
      value_start: account.value_start || 0
    });
    setShowAccountModal(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name_account.trim()) {
      showToast('Por favor, preencha o nome da conta', 'error');
      return;
    }

    try {
      setAccountLoading(true);
      const payload = {
        ...accountForm,
        value_start: parseFloat(accountForm.value_start) || 0
      };
      
      if (editingAccount) {
        await accountsApi.update(editingAccount.account_id, payload);
        showToast('Conta atualizada com sucesso!', 'success');
      } else {
        await accountsApi.create(payload);
        showToast('Conta criada com sucesso!', 'success');
      }
      setAccountForm({ name_account: '', description: '', value_start: 0 });
      setEditingAccount(null);
      setShowAccountModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar conta', 'error');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDeleteAccount = (account) => {
    setConfirmAccountModal({
      show: true,
      id: account.account_id,
      name: account.name_account
    });
  };

  const confirmDeleteAccount = async () => {
    try {
      setAccountLoading(true);
      await accountsApi.delete(confirmAccountModal.id);
      showToast('Conta excluída com sucesso!', 'success');
      setConfirmAccountModal({ show: false, id: null, name: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir conta', 'error');
      setConfirmAccountModal({ show: false, id: null, name: '' });
    } finally {
      setAccountLoading(false);
    }
  };

  // ====== FUNÇÕES PARA CARTÕES ======
  const handleOpenCardModal = () => {
    setCardForm({ name_card: '', description: '', number_card: '', flag: '', account_id: '' });
    setEditingCard(null);
    setShowCardModal(true);
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setCardForm({
      name_card: card.name_card,
      description: card.description || '',
      number_card: card.number_card || '',
      flag: card.flag || '',
      account_id: card.account?.account_id || ''
    });
    setShowCardModal(true);
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!cardForm.name_card.trim() || !cardForm.account_id) {
      showToast('Por favor, preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      setCardLoading(true);
      const payload = {
        ...cardForm,
        number_card: parseInt(cardForm.number_card, 10) || 0
      };
      
      if (editingCard) {
        await cardsApi.update(editingCard.card_id, payload);
        showToast('Cartão atualizado com sucesso!', 'success');
      } else {
        await cardsApi.create(payload);
        showToast('Cartão criado com sucesso!', 'success');
      }
      setCardForm({ name_card: '', description: '', number_card: '', flag: '', account_id: '' });
      setEditingCard(null);
      setShowCardModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar cartão', 'error');
    } finally {
      setCardLoading(false);
    }
  };

  const handleDeleteCard = (card) => {
    setConfirmCardModal({
      show: true,
      id: card.card_id,
      name: card.name_card
    });
  };

  const confirmDeleteCard = async () => {
    try {
      setCardLoading(true);
      await cardsApi.delete(confirmCardModal.id);
      showToast('Cartão excluído com sucesso!', 'success');
      setConfirmCardModal({ show: false, id: null, name: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir cartão', 'error');
      setConfirmCardModal({ show: false, id: null, name: '' });
    } finally {
      setCardLoading(false);
    }
  };
  const handleOpenRegulationModal = () => {
    if (accounts.length < 2) {
      showToast('É necessário possuir ao menos duas contas para regularizar valores.', 'error');
      return;
    }

    const defaultFrom = accounts[0]?.account_id || '';
    const defaultTo = accounts.find(acc => acc.account_id !== defaultFrom)?.account_id || '';

    setRegulationForm({
      from_account_id: defaultFrom,
      to_account_id: defaultTo,
      amount: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setShowRegulationModal(true);
  };

  const handleRegulationChange = (field) => (event) => {
    const { value } = event.target;
    setRegulationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitRegulation = async (e) => {
    e.preventDefault();
    const { from_account_id, to_account_id, amount, description, date } = regulationForm;

    if (!from_account_id || !to_account_id) {
      showToast('Selecione as contas de origem e destino.', 'error');
      return;
    }

    if (from_account_id === to_account_id) {
      showToast('As contas de origem e destino devem ser diferentes.', 'error');
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      showToast('Informe um valor válido para transferir.', 'error');
      return;
    }

    try {
      setRegulationLoading(true);
      await financialApi.regularizeAccounts({
        from_account_id,
        to_account_id,
        amount: numericAmount,
        description: description?.trim() || undefined,
        date: date || undefined,
      });
      showToast('Regularização registrada com sucesso!', 'success');
      setShowRegulationModal(false);
      setRegulationForm({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
      });
      loadData();
    } catch (error) {
      console.error('Erro ao regularizar contas:', error);
      showToast(error.response?.data?.message || 'Erro ao regularizar contas', 'error');
    } finally {
      setRegulationLoading(false);
    }
  };

  // Filtros
  const filteredAccounts = accounts.filter(acc =>
    acc.name_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (acc.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCards = cards.filter(card =>
    card.name_card.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (card.flag || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalAccounts: accounts.length,
    totalCards: cards.length,
    totalBalance: Object.values(accountBalances).reduce((sum, v) => sum + (parseFloat(v) || 0), 0),
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Contas Financeiras</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie suas contas e cartões</p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mt-4">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-green-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-600 truncate font-medium">Contas</p>
                  <p className="text-lg font-bold text-green-600">{stats.totalAccounts}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="text-green-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-green-600">{stats.totalAccounts} contas</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-600 truncate font-medium">Cartões</p>
                  <p className="text-lg font-bold text-blue-600">{stats.totalCards}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="text-blue-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-blue-600">{stats.totalCards} cartões</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-purple-100 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-600 truncate font-medium">Saldo Total</p>
                  <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalBalance)}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="text-purple-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-purple-600">Soma de todas as contas</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'accounts'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wallet size={18} />
                Contas
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'cards'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard size={18} />
                Cartões
              </div>
            </button>
          </div>
        </div>

        {/* Busca e Botão Adicionar */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {activeTab === 'accounts' && (
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleOpenAccountModal}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Nova Conta</span>
                </button>
                <button
                  onClick={handleOpenRegulationModal}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
                >
                  <ArrowRightLeft size={18} />
                  <span className="hidden sm:inline">Regularizar</span>
                </button>
              </div>
            )}
            {activeTab === 'cards' && (
              <button
                onClick={handleOpenCardModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Novo Cartão</span>
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="text-gray-600 mt-4">Carregando...</p>
          </div>
        ) : activeTab === 'accounts' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.length === 0 ? (
              <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Wallet size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600 font-medium text-xs">Nenhuma conta encontrada</p>
              </div>
            ) : (
              filteredAccounts.map((account) => {
                const cardsCount = cards.filter(c => c.account?.account_id === account.account_id).length;
                
                return (
                  <div
                    key={account.account_id}
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="text-3xl font-bold">{formatCurrency(accountBalances[account.account_id] ?? account.value_start)}</p>
                        <p className="text-xs opacity-75 mt-1">Saldo inicial: {formatCurrency(account.value_start)}</p>
                      </div>
                      <Wallet size={32} className="opacity-50" />
                    </div>

                    {account.description && (
                      <p className="text-xs opacity-90 mb-4 line-clamp-2">{account.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs opacity-90 mb-4">
                      <CreditCard size={14} />
                      {cardsCount} {cardsCount === 1 ? 'cartão' : 'cartões'}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="flex-1 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-2 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account)}
                        className="flex items-center justify-center bg-red-500/30 hover:bg-red-500/50 backdrop-blur-sm px-3 py-2 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            {filteredCards.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <CreditCard size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600 font-medium text-xs">Nenhum cartão encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCards.map((card) => (
                  <div
                    key={card.card_id}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm opacity-90">{card.flag || 'Cartão'}</p>
                        <p className="text-xl font-bold mt-1">{card.name_card}</p>
                      </div>
                      <CreditCard size={24} className="opacity-50" />
                    </div>

                    {card.number_card && (
                      <p className="text-sm opacity-90 mb-2">**** **** **** {card.number_card}</p>
                    )}

                    {card.description && (
                      <p className="text-xs opacity-75 mb-3 line-clamp-2">{card.description}</p>
                    )}

                    <div className="text-xs opacity-90 mb-3">
                      <p>Conta: {card.account?.name_account || '-'}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCard(card)}
                        className="flex-1 flex items-center justify-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all text-xs"
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card)}
                        className="flex items-center justify-center bg-red-500/30 hover:bg-red-500/50 px-3 py-2 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Conta */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-green-600">
              <div className="flex items-center gap-2">
                <Wallet className="text-white" size={18} />
                <h2 className="text-lg font-bold text-white">
                  {editingAccount ? 'Editar Conta' : 'Nova Conta'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setEditingAccount(null);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Conta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountForm.name_account}
                  onChange={(e) => setAccountForm({ ...accountForm, name_account: e.target.value })}
                  placeholder="Ex: Conta Corrente"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={accountLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Inicial <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={accountForm.value_start}
                  onChange={(e) => setAccountForm({ ...accountForm, value_start: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={accountLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={accountForm.description}
                  onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                  disabled={accountLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountModal(false);
                    setEditingAccount(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={accountLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  {accountLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      {editingAccount ? <Edit size={16} /> : <Plus size={16} />}
                      {editingAccount ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cartão */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600">
              <div className="flex items-center gap-2">
                <CreditCard className="text-white" size={18} />
                <h2 className="text-lg font-bold text-white">
                  {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCardModal(false);
                  setEditingCard(null);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={cardForm.account_id}
                  onChange={(e) => setCardForm({ ...cardForm, account_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={cardLoading}
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map(acc => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.name_account}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cartão <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardForm.name_card}
                  onChange={(e) => setCardForm({ ...cardForm, name_card: e.target.value })}
                  placeholder="Ex: Cartão Nubank"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={cardLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bandeira
                  </label>
                  <input
                    type="text"
                    value={cardForm.flag}
                    onChange={(e) => setCardForm({ ...cardForm, flag: e.target.value })}
                    placeholder="Visa, Master..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={cardLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Final do Cartão
                  </label>
                  <input
                    type="number"
                    value={cardForm.number_card}
                    onChange={(e) => setCardForm({ ...cardForm, number_card: e.target.value })}
                    placeholder="1234"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={cardLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={cardForm.description}
                  onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                  placeholder="Informações adicionais..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={cardLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCardModal(false);
                    setEditingCard(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cardLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  {cardLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      {editingCard ? <Edit size={16} /> : <Plus size={16} />}
                      {editingCard ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Regularização */}
      {showRegulationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-purple-600">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-white" size={18} />
                <h2 className="text-lg font-bold text-white">Regularizar Contas</h2>
              </div>
              <button
                onClick={() => setShowRegulationModal(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitRegulation} className="p-4 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                Informe a conta de origem, destino e o valor a transferir. Será gerada uma saída e entrada com flag de regularização.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta de Origem <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={regulationForm.from_account_id}
                  onChange={handleRegulationChange('from_account_id')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={regulationLoading}
                >
                  <option value="">Selecione</option>
                  {accounts.map(acc => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.name_account}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta de Destino <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={regulationForm.to_account_id}
                  onChange={handleRegulationChange('to_account_id')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={regulationLoading}
                >
                  <option value="">Selecione</option>
                  {accounts.map(acc => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.name_account}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={regulationForm.amount}
                    onChange={handleRegulationChange('amount')}
                    placeholder="0,00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={regulationLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={regulationForm.date}
                    onChange={handleRegulationChange('date')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    disabled={regulationLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação
                </label>
                <textarea
                  value={regulationForm.description}
                  onChange={handleRegulationChange('description')}
                  placeholder="Detalhes da regularização (opcional)"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  disabled={regulationLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegulationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                  disabled={regulationLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={regulationLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  {regulationLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <ArrowRightLeft size={16} />
                      Regularizar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals de Confirmação */}
      {confirmAccountModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmAccountModal({ show: false, id: null, name: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <Wallet className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Conta?</h3>
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmAccountModal.name}</p>
              <p className="text-xs text-red-600 mb-4">⚠️ Esta ação não pode ser desfeita</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmAccountModal({ show: false, id: null, name: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmCardModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmCardModal({ show: false, id: null, name: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Cartão?</h3>
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmCardModal.name}</p>
              <p className="text-xs text-red-600 mb-4">⚠️ Esta ação não pode ser desfeita</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmCardModal({ show: false, id: null, name: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCard}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
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
