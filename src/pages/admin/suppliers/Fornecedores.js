import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Filter, X, Truck, Building2, Mail, Phone, Tag, Settings, Users, TrendingUp } from 'lucide-react';
import { supplierApi, statusSupplierApi, segmentsSupplierApi, clientsApi } from '../../../services/api';
import Toast from '../../../components/Toast';

export default function Fornecedores() {
  const navigate = useNavigate();
  const location = useLocation();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [backendTotal, setBackendTotal] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [segments, setSegments] = useState([]);
  // modals/forms for supplier-specific status/segments
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [segmentForm, setSegmentForm] = useState({ name_segment: '', description: '' });
  const [editingSegment, setEditingSegment] = useState(null);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [statusForm, setStatusForm] = useState({ name_status: '', description: '', color: '#10B981' });
  const [editingStatus, setEditingStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status_id: '',
    segment_id: '',
    client_id: '',
    tags: '',
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, supplierId: null, supplierName: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
    
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, suppliers]);

  const [confirmSegmentModal, setConfirmSegmentModal] = useState({ show: false, segmentId: null, segmentName: '' });
  const [confirmStatusModal, setConfirmStatusModal] = useState({ show: false, statusId: null, statusName: '' });

  useEffect(() => {
    if (showSegmentModal || showStatusModal || confirmModal.show || confirmSegmentModal.show || confirmStatusModal.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSegmentModal, showStatusModal, confirmModal.show, confirmSegmentModal.show, confirmStatusModal.show]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, statusRes, segmentsRes, clientsRes] = await Promise.all([
        supplierApi.getAll({
          status_id: filters.status_id || undefined,
          segment_id: filters.segment_id || undefined,
          client_id: filters.client_id || undefined,
          tags: filters.tags || undefined,
        }),
        statusSupplierApi.getAll(),
        segmentsSupplierApi.getAll(),
        clientsApi.getAll(),
      ]);
      
      const suppliersData = suppliersRes.data?.items || suppliersRes.data || [];
      const suppliersArray = Array.isArray(suppliersData) ? suppliersData : [];
      
      setSuppliers(suppliersArray);
      setFilteredSuppliers(suppliersArray);
      setStatuses(statusRes.data || []);
      setSegments(segmentsRes.data || []);
      setSegmentForm({ name_segment: '', description: '' });
      setStatusForm({ name_status: '', description: '', color: '#10B981' });
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar fornecedores', 'error');
      setSuppliers([]);
      setFilteredSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...suppliers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier => {
        const name = (supplier?.name_supplier || '').toLowerCase();
        const cpfCnpj = (supplier?.CPF_CNPJ || '').toLowerCase();
        const email = (supplier?.email || '').toLowerCase();
        return name.includes(term) || cpfCnpj.includes(term) || email.includes(term);
      });
    }

    if (filters.status_id) {
      filtered = filtered.filter(s => s?.status?.status_supplier_id === parseInt(filters.status_id) || s?.status?.status_id === parseInt(filters.status_id));
    }

    if (filters.segment_id) {
      filtered = filtered.filter(s => s?.segment?.segment_supplier_id === parseInt(filters.segment_id) || s?.segment?.segment_id === parseInt(filters.segment_id));
    }

    if (filters.client_id) {
      const cid = Number(filters.client_id);
      filtered = filtered.filter(s => Number(s?.client?.client_id) === cid);
    }

    if (filters.tags) {
      const t = filters.tags.toLowerCase().trim();
      filtered = filtered.filter(s => (s.tags || '').toLowerCase().includes(t));
    }

    setFilteredSuppliers(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      status_id: '',
      segment_id: '',
      client_id: '',
    });
    setShowFilters(false);
  };

  const handleDelete = (supplier) => {
    setConfirmModal({
      show: true,
      supplierId: supplier.supplier_id,
      supplierName: supplier.name_supplier
    });
  };

  const confirmDelete = async () => {
    try {
      await supplierApi.delete(confirmModal.supplierId);
      showToast('Fornecedor excluído com sucesso!', 'success');
      setConfirmModal({ show: false, supplierId: null, supplierName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showToast('Erro ao excluir fornecedor', 'error');
      setConfirmModal({ show: false, supplierId: null, supplierName: '' });
    }
  };

  const cancelDelete = () => {
    setConfirmModal({ show: false, supplierId: null, supplierName: '' });
  };

  // Handlers for supplier-specific segments/status creation
  const handleSaveSegment = async (e) => {
    e.preventDefault();
    if (!segmentForm.name_segment?.trim()) {
      showToast('Por favor, preencha o nome do segmento', 'error');
      return;
    }

    try {
      setSegmentLoading(true);
      if (editingSegment) {
        const id = editingSegment.segment_supplier_id || editingSegment.segment_id;
        await segmentsSupplierApi.update(id, segmentForm);
        showToast('Segmento atualizado com sucesso', 'success');
      } else {
        await segmentsSupplierApi.create(segmentForm);
        showToast('Segmento criado com sucesso', 'success');
      }
      setSegmentForm({ name_segment: '', description: '' });
      setEditingSegment(null);
      loadData();
    } catch (err) {
      console.error('Erro ao criar/atualizar segmento:', err);
      showToast(err.response?.data?.message || 'Erro ao criar/atualizar segmento', 'error');
    } finally {
      setSegmentLoading(false);
    }
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusForm.name_status?.trim()) {
      showToast('Por favor, preencha o nome do status', 'error');
      return;
    }

    try {
      setStatusLoading(true);
      if (editingStatus) {
        const id = editingStatus.status_supplier_id || editingStatus.status_id;
        await statusSupplierApi.update(id, statusForm);
        showToast('Status atualizado com sucesso', 'success');
      } else {
        await statusSupplierApi.create(statusForm);
        showToast('Status criado com sucesso', 'success');
      }
      setStatusForm({ name_status: '', description: '', color: '#10B981' });
      setEditingStatus(null);
      loadData();
    } catch (err) {
      console.error('Erro ao criar/atualizar status:', err);
      showToast(err.response?.data?.message || 'Erro ao criar/atualizar status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleOpenSegmentModal = () => {
    setSegmentForm({ name_segment: '', description: '' });
    setEditingSegment(null);
    setShowSegmentModal(true);
  };

  const handleEditSegment = (segment) => {
    setEditingSegment(segment);
    setSegmentForm({ name_segment: segment.name_segment, description: segment.description || '' });
    setShowSegmentModal(true);
  };

  const handleDeleteSegment = (segment) => {
    setConfirmSegmentModal({ show: true, segmentId: segment.segment_supplier_id || segment.segment_id, segmentName: segment.name_segment });
  };

  const confirmDeleteSegment = async () => {
    try {
      setSegmentLoading(true);
      await segmentsSupplierApi.delete(confirmSegmentModal.segmentId);
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

  const handleOpenStatusModal = () => {
    setStatusForm({ name_status: '', description: '', color: '#10B981' });
    setEditingStatus(null);
    setShowStatusModal(true);
  };

  const handleEditStatus = (status) => {
    setEditingStatus(status);
    setStatusForm({ name_status: status.name_status, description: status.description || '', color: status.color || '#10B981' });
    setShowStatusModal(true);
  };

  const handleDeleteStatus = (status) => {
    setConfirmStatusModal({ show: true, statusId: status.status_supplier_id || status.status_id, statusName: status.name_status });
  };

  const confirmDeleteStatus = async () => {
    try {
      setStatusLoading(true);
      await statusSupplierApi.delete(confirmStatusModal.statusId);
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

  // Estatísticas: apenas total (servidor fornece total quando disponível)
  const totalSuppliers = backendTotal !== null ? backendTotal : filteredSuppliers.length;

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Fornecedores</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie os fornecedores cadastrados</p>
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
                onClick={() => navigate('/admin/fornecedores/novo')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Novo Fornecedor</span>
              </button>
            </div>
          </div>

          {/* Cartão único de Estatísticas: Total */}
          <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Total</p>
                  <p className="text-lg font-bold text-gray-900">{totalSuppliers}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="text-gray-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500">{totalSuppliers} fornecedores</p>
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
                  placeholder="Buscar por nome, CPF/CNPJ ou email..."
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                      value={filters.status_id}
                      onChange={(e) => setFilters({ ...filters, status_id: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {statuses.map(status => (
                          <option key={status.status_supplier_id || status.status_id} value={status.status_supplier_id || status.status_id}>
                            {status.name_status}
                          </option>
                        ))}
                  </select>
                  
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Segmento</label>
                  <select
                    value={filters.segment_id}
                    onChange={(e) => setFilters({ ...filters, segment_id: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {segments.map(segment => (
                          <option key={segment.segment_supplier_id || segment.segment_id} value={segment.segment_supplier_id || segment.segment_id}>
                            {segment.name_segment}
                          </option>
                        ))}
                  </select>
                  
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente</label>
                  <select
                    value={filters.client_id}
                    onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {clients.map(client => (
                      <option key={client.client_id} value={client.client_id}>
                        {client.name_client}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                  <input
                    value={filters.tags}
                    onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                    placeholder="Buscar por tag (ex: tag2)"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg"
                >
                  <X size={18} />
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista/Tabela */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
              <p className="text-gray-600 mt-4">Carregando...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium">Nenhum fornecedor encontrado</p>
            </div>
          ) : (
            <>
              {/* Mobile - Cards */}
              <div className="block md:hidden divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.supplier_id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-sm">
                            {supplier.name_supplier?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{supplier.name_supplier}</h3>
                          <p className="text-xs text-gray-500 truncate">{supplier.CPF_CNPJ}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/admin/fornecedores/editar/${supplier.supplier_id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={14} />
                        <span className="truncate">{supplier.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={14} />
                        <span>{supplier.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          supplier?.status?.name_status === 'Ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {supplier?.status?.name_status || '-'}
                        </span>
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
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Fornecedor</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">CPF/CNPJ</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Contato</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Segmento</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.supplier_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold text-xs">
                                {supplier.name_supplier?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{supplier.name_supplier}</p>
                              {supplier.corporate_name && (
                                <p className="text-xs text-gray-500 truncate">{supplier.corporate_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{supplier.CPF_CNPJ || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-700">{supplier.phone || '-'}</p>
                            <p className="text-gray-500 text-xs truncate">{supplier.email || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {supplier?.segment?.name_segment || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            supplier?.status?.name_status === 'Ativo' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {supplier?.status?.name_status || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate(`/admin/fornecedores/editar/${supplier.supplier_id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier)}
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
        {/* Footer: show counts below the suppliers table */}
        {!loading && filteredSuppliers.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {filteredSuppliers.length} de {suppliers.length} fornecedores
          </div>
        )}
        
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

        {/* Modal de Confirmação de Exclusão - Fornecedor */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={cancelDelete}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Fornecedor?</h3>
              
                <p className="text-xs text-gray-600 mb-1">
                  Você está prestes a excluir:
                </p>
                <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                  {confirmModal.supplierName}
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

      {/* Toast */}
      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  </div>
  );
}
