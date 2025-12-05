import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Filter, X, Users, UserCheck, UserX, TrendingUp, Settings, Tag } from 'lucide-react';
import { clientsApi, statusGeneralApi, segmentsApi } from '../../../services/api';
import Toast from '../../../components/Toast';

export default function Clientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status_id: '',
    segment_id: '',
  });

  // Modais para gerenciar segmentos e status
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Estados para gerenciamento de segmentos
  const [segmentForm, setSegmentForm] = useState({ name_segment: '', description: '' });
  const [editingSegment, setEditingSegment] = useState(null);
  const [segmentLoading, setSegmentLoading] = useState(false);

  // Estados para gerenciamento de status
  const [statusForm, setStatusForm] = useState({ name_status: '', description: '', color: '#10B981' });
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Estado para notificações (toast)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Estado para modal de confirmação de exclusão
  const [confirmModal, setConfirmModal] = useState({ show: false, clientId: null, clientName: '' });
  const [confirmSegmentModal, setConfirmSegmentModal] = useState({ show: false, segmentId: null, segmentName: '' });
  const [confirmStatusModal, setConfirmStatusModal] = useState({ show: false, statusId: null, statusName: '' });

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
  }, [searchTerm, filters, clients]);

  // Bloquear scroll quando modais estiverem abertos
  useEffect(() => {
    if (showSegmentModal || showStatusModal || confirmModal.show || confirmSegmentModal.show || confirmStatusModal.show) {
      // Bloqueia scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restaura scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup: garante que o scroll seja restaurado ao desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSegmentModal, showStatusModal, confirmModal.show, confirmSegmentModal.show, confirmStatusModal.show]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsRes, statusRes, segmentsRes] = await Promise.all([
        clientsApi.getAll(),
        statusGeneralApi.getAll(),
        segmentsApi.getAll(),
      ]);
      setClients(clientsRes.data || []);
      setFilteredClients(clientsRes.data || []);
      setStatuses(statusRes.data || []);
      setSegments(segmentsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.name_client?.toLowerCase().includes(term) ||
        client.CPF_CNPJ?.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.reference?.toLowerCase().includes(term)
      );
    }

    if (filters.status_id) {
      filtered = filtered.filter(client => client.status_id === parseInt(filters.status_id));
    }

    if (filters.segment_id) {
      filtered = filtered.filter(client => client.segment_id === parseInt(filters.segment_id));
    }

    setFilteredClients(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({ status_id: '', segment_id: '' });
    setShowFilters(false);
  };

  const handleDelete = (client) => {
    // Abre o modal de confirmação
    setConfirmModal({
      show: true,
      clientId: client.client_id,
      clientName: client.name_client
    });
  };

  const confirmDelete = async () => {
    try {
      await clientsApi.delete(confirmModal.clientId);
      showToast('Cliente excluído com sucesso!', 'success');
      setConfirmModal({ show: false, clientId: null, clientName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      const msg = error?.response?.data?.message || error?.message || 'Erro ao excluir cliente';
      showToast(msg, 'error');
      setConfirmModal({ show: false, clientId: null, clientName: '' });
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ show: false, clientId: null, clientName: '' });
  };

  const getStatus = (statusId) => {
    return statuses.find(s => s.status_id === statusId) || null;
  };

  const getStatusName = (statusId) => {
    return statuses.find(s => s.status_id === statusId)?.name_status || '-';
  };

  const getSegmentName = (segmentId) => {
    return segments.find(s => s.segment_id === segmentId)?.name_segment || '-';
  };

  // descrição / estado do cliente
  const getClientDescription = (client) => {
    return client?.descricao || client?.description || client?.notes || '-';
  };
  
  const getClientEstado = (client) => {
    return client?.estado || client?.state || '';
  };

  // ====== FUNÇÕES PARA GERENCIAR SEGMENTOS ======
  const handleOpenSegmentModal = () => {
    setSegmentForm({ name_segment: '', description: '' });
    setEditingSegment(null);
    setShowSegmentModal(true);
  };

  const handleEditSegment = (segment) => {
    setEditingSegment(segment);
    setSegmentForm({
      name_segment: segment.name_segment,
      description: segment.description || ''
    });
  };

  const handleSaveSegment = async (e) => {
    e.preventDefault();
    if (!segmentForm.name_segment.trim()) {
      showToast('Por favor, preencha o nome do segmento', 'error');
      return;
    }

    try {
      setSegmentLoading(true);
      if (editingSegment) {
        await segmentsApi.update(editingSegment.segment_id, segmentForm);
        showToast('Segmento atualizado com sucesso!', 'success');
      } else {
        await segmentsApi.create(segmentForm);
        showToast('Segmento criado com sucesso!', 'success');
      }
      setSegmentForm({ name_segment: '', description: '' });
      setEditingSegment(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar segmento:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar segmento', 'error');
    } finally {
      setSegmentLoading(false);
    }
  };

  const handleDeleteSegment = (segment) => {
    setConfirmSegmentModal({
      show: true,
      segmentId: segment.segment_id,
      segmentName: segment.name_segment
    });
  };

  const confirmDeleteSegment = async () => {
    try {
      setSegmentLoading(true);
      await segmentsApi.delete(confirmSegmentModal.segmentId);
      showToast('Segmento excluído com sucesso!', 'success');
      setConfirmSegmentModal({ show: false, segmentId: null, segmentName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir segmento:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir segmento', 'error');
      setConfirmSegmentModal({ show: false, segmentId: null, segmentName: '' });
    } finally {
      setSegmentLoading(false);
    }
  };

  const cancelDeleteSegment = () => {
    setConfirmSegmentModal({ show: false, segmentId: null, segmentName: '' });
  };

  const handleCancelSegmentEdit = () => {
    setEditingSegment(null);
    setSegmentForm({ name_segment: '', description: '' });
  };

  // ====== FUNÇÕES PARA GERENCIAR STATUS ======
  const handleOpenStatusModal = () => {
    setStatusForm({ name_status: '', description: '', color: '#10B981' });
    setEditingStatus(null);
    setShowStatusModal(true);
  };

  const handleEditStatus = (status) => {
    setEditingStatus(status);
    setStatusForm({
      name_status: status.name_status,
      description: status.description || '',
      color: status.color || '#10B981'
    });
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusForm.name_status.trim()) {
      showToast('Por favor, preencha o nome do status', 'error');
      return;
    }

    try {
      setStatusLoading(true);
      if (editingStatus) {
        await statusGeneralApi.update(editingStatus.status_id, statusForm);
        showToast('Status atualizado com sucesso!', 'success');
      } else {
        await statusGeneralApi.create(statusForm);
        showToast('Status criado com sucesso!', 'success');
      }
      setStatusForm({ name_status: '', description: '', color: '#10B981' });
      setEditingStatus(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteStatus = (status) => {
    setConfirmStatusModal({
      show: true,
      statusId: status.status_id,
      statusName: status.name_status
    });
  };

  const confirmDeleteStatus = async () => {
    try {
      setStatusLoading(true);
      await statusGeneralApi.delete(confirmStatusModal.statusId);
      showToast('Status excluído com sucesso!', 'success');
      setConfirmStatusModal({ show: false, statusId: null, statusName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir status:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir status', 'error');
      setConfirmStatusModal({ show: false, statusId: null, statusName: '' });
    } finally {
      setStatusLoading(false);
    }
  };

  const cancelDeleteStatus = () => {
    setConfirmStatusModal({ show: false, statusId: null, statusName: '' });
  };

  const handleCancelStatusEdit = () => {
    setEditingStatus(null);
    setStatusForm({ name_status: '', description: '', color: '#10B981' });
  };

  // Estatísticas
  const totalClients = clients.length;
  const activeClients = clients.filter(c => {
    const status = statuses.find(s => s.status_id === c.status_id);
    return status?.name_status?.toLowerCase().includes('ativo');
  }).length;
  const inactiveClients = totalClients - activeClients;

  // Clientes por segmento (top 3)
  const clientsBySegment = segments.map(seg => ({
    name: seg.name_segment,
    count: clients.filter(c => c.segment_id === seg.segment_id).length
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  // tooltip portal state/handlers
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [tooltipId, setTooltipId] = useState(null);
  const [tooltipSide, setTooltipSide] = useState('right');

  const showTooltip = (content, target, id = null) => {
    if (!target) return;
    // avoid reopening same tooltip repeatedly
    if (id && tooltipId === id && tooltipVisible) return;
    const rect = target.getBoundingClientRect();
    // Position tooltip to the right of the avatar, vertically centered
    const offset = 10; // spacing between avatar and tooltip
    const maxW = 380;
    let left = rect.right + offset;
    // if there's not enough space on the right, open to the left
    let side = 'right';
    if (left + maxW + 8 > window.innerWidth) {
      left = rect.left - offset - maxW;
      side = 'left';
    }
    // vertical center
    let centerY = rect.top + rect.height / 2;
    // clamp vertical inside viewport
    centerY = Math.max(8 + 18, Math.min(centerY, window.innerHeight - 8 - 18));
    setTooltipContent(content || '-');
    setTooltipPos({ x: left, y: centerY });
    setTooltipSide(side);
    setTooltipId(id);
    setTooltipVisible(true);
  };
  const hideTooltip = () => {
    setTooltipVisible(false);
    setTooltipId(null);
  };

  // Portal tooltip component
  function TooltipPortal({ visible, x, y, side = 'right', children }) {
    if (!visible) return null;
    return ReactDOM.createPortal(
      <div
        onMouseDown={() => { setTooltipVisible(false); setTooltipId(null); }}
        style={{ left: x, top: y, position: 'fixed', zIndex: 9999, transform: 'translateY(-50%)' }}
        className="relative px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-pre-wrap break-words max-w-[24rem]"
      >
        {/* arrow pointing to avatar */}
        {side === 'right' ? (
          <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 rotate-45" />
        ) : (
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 rotate-45" />
        )}
        {children}
      </div>,
      document.body
    );
  }

  // Render (substitua os blocos de nome onde fazia group hover)
  // Exemplo de substituição na versão mobile card:
  // ...existing code...
  // antes do botão de editar/excluir substitua o bloco do nome por:
  // ...existing code...
  // <h3 ...> antigo </h3>
  // substitua por:
  // ...existing code...
  // Mobile card name
  // ...existing code...
  // dentro do map:
  /*
    <h3
      className="font-semibold text-gray-900 text-sm truncate cursor-help"
      onMouseEnter={(e) => showTooltip(getClientDescription(client), e.currentTarget)}
      onMouseLeave={hideTooltip}
      onFocus={(e) => showTooltip(getClientDescription(client), e.currentTarget)}
      onBlur={hideTooltip}
      tabIndex={0}
      title={client.name_client}
    >
      {client.name_client}
    </h3>
  */

  // Mesma troca no bloco da tabela (desktop):
  /*
    <div
      className="text-sm font-medium text-gray-900 truncate cursor-help"
      onMouseEnter={(e) => showTooltip(getClientDescription(client), e.currentTarget)}
      onMouseLeave={hideTooltip}
      onFocus={(e) => showTooltip(getClientDescription(client), e.currentTarget)}
      onBlur={hideTooltip}
      tabIndex={0}
      title={client.name_client}
    >
      {client.name_client}
    </div>
  */

  return (
    <>
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Clientes</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie seus clientes</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleOpenSegmentModal}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
                >
                  <Tag size={16} />
                  <span className="hidden sm:inline">Segmentos</span>
                </button>
                <button
                  onClick={handleOpenStatusModal}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">Status</span>
                </button>
                <button
                  onClick={() => navigate('/admin/clientes/novo')}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Novo Cliente</span>
                </button>
              </div>
            </div>

            {/* Cards de Estatísticas simplificados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 mb-4">
              {/* Card Total */}
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="text-blue-600" size={20} />
                  </div>
                </div>
              </div>

              {/* Card Segmentos */}
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">Segmentos</p>
                    <p className="text-2xl font-bold text-purple-600">{segments.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tag className="text-purple-600" size={20} />
                  </div>
                </div>
              </div>

              {/* Card Status */}
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate">Status</p>
                    <p className="text-2xl font-bold text-indigo-600">{statuses.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Settings className="text-indigo-600" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Segmentos */}
            {clientsBySegment.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-100 mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  Top Segmentos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {clientsBySegment.map((seg, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-2.5 shadow-sm">
                      <p className="text-xs text-gray-600 font-medium truncate">{seg.name}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">{seg.count} clientes</p>
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
                    placeholder="Buscar cliente..."
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      value={filters.status_id}
                      onChange={(e) => setFilters({ ...filters, status_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      {statuses.map(status => (
                        <option key={status.status_id} value={status.status_id}>
                          {status.name_status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Segmento</label>
                    <select
                      value={filters.segment_id}
                      onChange={(e) => setFilters({ ...filters, segment_id: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      {segments.map(segment => (
                        <option key={segment.segment_id} value={segment.segment_id}>
                          {segment.name_segment}
                        </option>
                      ))}
                    </select>
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
              </div>
            )}
          </div>

          {/* Lista/Tabela de Clientes */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-gray-600 mt-4">Carregando...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 font-medium">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <>
                {/* Mobile - Cards com Scroll */}
                <div className={`block md:hidden divide-y divide-gray-200 ${filteredClients.length > 5 ? 'overflow-y-auto' : ''}`} style={{ maxHeight: filteredClients.length > 5 ? '400px' : 'none' }}>
                  {filteredClients.map((client) => (
                    <div key={client.client_id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
                          <div
                            className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 cursor-help"
                            onMouseEnter={(e) => showTooltip(getClientDescription(client), e.currentTarget, client.client_id)}
                            onMouseLeave={() => { hideTooltip(); setTooltipId(null); }}
                            onFocus={(e) => showTooltip(getClientDescription(client), e.currentTarget, client.client_id)}
                            onBlur={() => { hideTooltip(); setTooltipId(null); }}
                            tabIndex={0}
                          >
                            <span className="text-blue-600 font-semibold text-sm">
                              {client.name_client?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            {/* name + tooltip */}
                            <div className="group relative inline-block w-full">
                              <h3
                                className="font-semibold text-gray-900 text-sm truncate"
                                tabIndex={0}
                                title={client.name_client}
                              >
                                {client.name_client}
                              </h3>
                              {/* tooltip is rendered via portal to avoid clipping */}
                            </div>
                            <p className="text-xs text-gray-500 truncate" title={client.email || 'Sem email'}>{client.email || 'Sem email'}</p>
                            {/* estado abaixo do nome */}
                            {getClientEstado(client) ? (
                              <p className="text-xs text-gray-400 mt-0.5">{getClientEstado(client)}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => navigate(`/admin/clientes/editar/${client.client_id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">CPF/CNPJ:</span>
                          <span className="font-mono text-gray-700">{client.CPF_CNPJ || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Telefone:</span>
                          <span className="text-gray-700">{client.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Referência:</span>
                          <span className="text-gray-700">{client.reference || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Status:</span>
                          {(() => {
                            const status = getStatus(client.status_id);
                            return (
                              <span 
                                className="px-2 py-0.5 text-[10px] font-semibold rounded-full flex items-center gap-1"
                                style={{ 
                                  backgroundColor: status?.color ? `${status.color}20` : '#10B98120',
                                  color: status?.color || '#10B981'
                                }}
                              >
                                <span 
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: status?.color || '#10B981' }}
                                ></span>
                                {getStatusName(client.status_id)}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Segmento:</span>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-800">
                            {getSegmentName(client.segment_id)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop - Tabela com Scroll após 5 clientes */}
                <div className="hidden md:block overflow-x-auto border rounded-lg">
                  <div className={filteredClients.length > 5 ? "overflow-y-auto" : ""} style={{ maxHeight: filteredClients.length > 5 ? '480px' : 'none' }}>
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[30%]">Cliente</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[15%]">CPF/CNPJ</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[15%]">Contato</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[12%]">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[18%]">Referência</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[15%]">Segmento</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[10%]">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClients.map((client) => (
                        <tr key={client.client_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center overflow-hidden">
                              <div
                                className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 cursor-help"
                                onMouseEnter={(e) => showTooltip(getClientDescription(client), e.currentTarget, client.client_id)}
                                onMouseLeave={() => { hideTooltip(); setTooltipId(null); }}
                                onFocus={(e) => showTooltip(getClientDescription(client), e.currentTarget, client.client_id)}
                                onBlur={() => { hideTooltip(); setTooltipId(null); }}
                                tabIndex={0}
                              >
                                <span className="text-blue-600 font-semibold">{client.name_client?.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="ml-3 min-w-0 overflow-hidden">
                                <div className="group relative">
                                  <div
                                      className="text-sm font-medium text-gray-900 truncate"
                                      tabIndex={0}
                                      title={client.name_client}
                                    >
                                      {client.name_client}
                                    </div>
                                  {/* tooltip is rendered via portal to avoid clipping */}
                                </div>
                                {/* estado abaixo do name */}
                                {getClientEstado(client) && (
                                  <div className="text-xs text-gray-400 mt-1">{getClientEstado(client)}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-mono truncate">{client.CPF_CNPJ || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 truncate">{client.phone || '-'}</td>
                          <td className="px-6 py-4">
                            {(() => {
                              const status = getStatus(client.status_id);
                              return (
                                <span 
                                  className="px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5"
                                  style={{ 
                                    backgroundColor: status?.color ? `${status.color}20` : '#10B98120',
                                    color: status?.color || '#10B981'
                                  }}
                                >
                                  <span 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: status?.color || '#10B981' }}
                                  ></span>
                                  {getStatusName(client.status_id)}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 truncate">{client.reference || '-'}</td>
                          <td className="px-6 py-4 overflow-hidden">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 inline-block truncate max-w-full">
                              {getSegmentName(client.segment_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center overflow-hidden">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/clientes/editar/${client.client_id}`)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(client)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

          {!loading && filteredClients.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Mostrando {filteredClients.length} de {totalClients} clientes
            </div>
          )}
        </div>

        {/* Modal de Segmentos - Ultra Compacto */}
        {showSegmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header Mini */}
              <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-purple-600 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Tag className="text-white" size={16} />
                  <h2 className="text-base sm:text-lg font-bold text-white">Segmentos</h2>
                </div>
                <button
                  onClick={() => {
                    setShowSegmentModal(false);
                    handleCancelSegmentEdit();
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
                      {editingSegment ? <Edit size={14} /> : <Plus size={14} />}
                      {editingSegment ? 'Editar' : 'Novo'}
                    </h3>
                    
                    <form onSubmit={handleSaveSegment} className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                          Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={segmentForm.name_segment}
                          onChange={(e) => setSegmentForm({ ...segmentForm, name_segment: e.target.value })}
                          placeholder="Ex: Varejo"
                          className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                          disabled={segmentLoading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                          Descrição
                        </label>
                        <textarea
                          value={segmentForm.description}
                          onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                          placeholder="Descreva..."
                          rows={2}
                          className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 resize-none"
                          disabled={segmentLoading}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={segmentLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 text-xs rounded font-medium transition-all disabled:opacity-50"
                        >
                          {segmentLoading ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <>
                              {editingSegment ? <Edit size={12} /> : <Plus size={12} />}
                              {editingSegment ? 'Atualizar' : 'Criar'}
                            </>
                          )}
                        </button>
                        
                        {editingSegment && (
                          <button
                            type="button"
                            onClick={handleCancelSegmentEdit}
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
                      Lista ({segments.length})
                    </h3>
                  </div>

                  {segments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Tag size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-600 font-medium text-xs">Nenhum segmento</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[calc(85vh-160px)] overflow-y-auto pr-1">
                      {segments.map((segment) => {
                        const clientCount = clients.filter(c => c.segment_id === segment.segment_id).length;
                        const isEditing = editingSegment?.segment_id === segment.segment_id;
                        
                        return (
                          <div
                            key={segment.segment_id}
                            className={`bg-white rounded p-2 border transition-all ${
                              isEditing 
                                ? 'border-purple-500 shadow ring-1 ring-purple-200' 
                                : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <h4 className="font-semibold text-gray-900 text-xs truncate">{segment.name_segment}</h4>
                                  {isEditing && (
                                    <span className="px-1 py-0.5 bg-purple-600 text-white text-[9px] font-semibold rounded">
                                      Editando
                                    </span>
                                  )}
                                </div>
                                
                                {segment.description && (
                                  <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">{segment.description}</p>
                                )}
                                
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                  <Users size={10} />
                                  {clientCount}
                                  {clientCount > 0 && <span className="ml-0.5">🔒</span>}
                                </span>
                              </div>
                              
                              <div className="flex gap-0.5">
                                <button
                                  onClick={() => handleEditSegment(segment)}
                                  className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  disabled={segmentLoading}
                                  title="Editar"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSegment(segment)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                                  disabled={segmentLoading || clientCount > 0}
                                  title={clientCount > 0 ? "Protegido" : "Excluir"}
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
                    setShowSegmentModal(false);
                    handleCancelSegmentEdit();
                  }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-medium transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Status - Ultra Compacto */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header Mini */}
              <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-indigo-600 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Settings className="text-white" size={16} />
                  <h2 className="text-base sm:text-lg font-bold text-white">Status Geral</h2>
                </div>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    handleCancelStatusEdit();
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
                  <div className="bg-indigo-50 rounded-lg p-2.5 sm:p-3 border border-indigo-200 sticky top-0 z-10">
                    <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                      {editingStatus ? <Edit size={14} /> : <Plus size={14} />}
                      {editingStatus ? 'Editar' : 'Novo'}
                    </h3>
                    
                    <form onSubmit={handleSaveStatus} className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                          Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={statusForm.name_status}
                          onChange={(e) => setStatusForm({ ...statusForm, name_status: e.target.value })}
                          placeholder="Ex: Ativo"
                          className="w-full px-2.5 py-1.5 text-xs border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={statusLoading}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                          Descrição
                        </label>
                        <textarea
                          value={statusForm.description}
                          onChange={(e) => setStatusForm({ ...statusForm, description: e.target.value })}
                          placeholder="Descreva..."
                          rows={2}
                          className="w-full px-2.5 py-1.5 text-xs border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 resize-none"
                          disabled={statusLoading}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                          Cor
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={statusForm.color}
                            onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                            className="w-12 h-8 rounded border border-indigo-200 cursor-pointer"
                            disabled={statusLoading}
                          />
                          <input
                            type="text"
                            value={statusForm.color}
                            onChange={(e) => setStatusForm({ ...statusForm, color: e.target.value })}
                            placeholder="#10B981"
                            className="flex-1 px-2.5 py-1.5 text-xs border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 font-mono"
                            disabled={statusLoading}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={statusLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1.5 text-xs rounded font-medium transition-all disabled:opacity-50"
                        >
                          {statusLoading ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <>
                              {editingStatus ? <Edit size={12} /> : <Plus size={12} />}
                              {editingStatus ? 'Atualizar' : 'Criar'}
                            </>
                          )}
                        </button>
                        
                        {editingStatus && (
                          <button
                            type="button"
                            onClick={handleCancelStatusEdit}
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
                      <Settings className="text-indigo-600" size={14} />
                      Lista ({statuses.length})
                    </h3>
                  </div>

                  {statuses.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Settings size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-gray-600 font-medium text-xs">Nenhum status</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 overflow-y-auto pr-1 flex-1" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                      {statuses.map((status) => {
                        const clientCount = clients.filter(c => c.status_id === status.status_id).length;
                        const isEditing = editingStatus?.status_id === status.status_id;
                        
                        return (
                          <div
                            key={status.status_id}
                            onClick={() => handleEditStatus(status)}
                            className={`bg-white rounded p-2 border transition-all cursor-pointer ${
                              isEditing 
                                ? 'border-indigo-500 shadow ring-1 ring-indigo-200' 
                                : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm active:scale-[0.98]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: status.color || '#10B981' }}
                                  ></div>
                                  <h4 className="font-semibold text-gray-900 text-xs truncate">{status.name_status}</h4>
                                  {isEditing && (
                                    <span className="px-1 py-0.5 bg-indigo-600 text-white text-[9px] font-semibold rounded">
                                      Editando
                                    </span>
                                  )}
                                </div>
                                
                                {status.description && (
                                  <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">{status.description}</p>
                                )}
                                
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                  <Users size={10} />
                                  {clientCount}
                                  {clientCount > 0 && <span className="ml-0.5">🔒</span>}
                                </span>
                              </div>
                              
                              <div className="flex gap-0.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditStatus(status);
                                  }}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  disabled={statusLoading}
                                  title="Editar"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteStatus(status);
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                                  disabled={statusLoading || clientCount > 0}
                                  title={clientCount > 0 ? "Protegido" : "Excluir"}
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
                    setShowStatusModal(false);
                    handleCancelStatusEdit();
                  }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-medium transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão - Cliente */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={cancelDelete}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Cliente?</h3>
                
                <p className="text-xs text-gray-600 mb-1">
                  Você está prestes a excluir:
                </p>
                <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                  {confirmModal.clientName}
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

        {/* Modal de Confirmação de Exclusão - Segmento */}
        {confirmSegmentModal.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={cancelDeleteSegment}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Tag className="text-purple-600" size={24} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Segmento?</h3>
                
                <p className="text-xs text-gray-600 mb-1">
                  Você está prestes a excluir:
                </p>
                <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                  {confirmSegmentModal.segmentName}
                </p>
                
                <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                  <span>⚠️</span>
                  Esta ação não pode ser desfeita
                </p>
                
                <div className="flex gap-3 w-full">
                  <button
                    onClick={cancelDeleteSegment}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteSegment}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-medium"
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão - Status */}
        {confirmStatusModal.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={cancelDeleteStatus}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                  <Settings className="text-indigo-600" size={24} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Status?</h3>
                
                <p className="text-xs text-gray-600 mb-1">
                  Você está prestes a excluir:
                </p>
                <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                  {confirmStatusModal.statusName}
                </p>
                
                <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                  <span>⚠️</span>
                  Esta ação não pode ser desfeita
                </p>
                
                <div className="flex gap-3 w-full">
                  <button
                    onClick={cancelDeleteStatus}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteStatus}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all text-sm font-medium"
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
        <TooltipPortal visible={tooltipVisible} x={tooltipPos.x} y={tooltipPos.y} side={tooltipSide}>
          {tooltipContent}
        </TooltipPortal>

        <TooltipPortal visible={tooltipVisible} x={tooltipPos.x} y={tooltipPos.y}>
          {tooltipContent}
        </TooltipPortal>
      </div>
    </>
  );
}
