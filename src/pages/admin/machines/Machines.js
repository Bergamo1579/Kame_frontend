import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Cog, Cpu, Layers, Package, Info } from 'lucide-react';
import Toast from '../../../components/Toast';
import { machineCategoryApi, machineApi } from '../../../services/api';

export default function Machines() {
  const [categories, setCategories] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('categories');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [confirmCategoryModal, setConfirmCategoryModal] = useState({ show: false, id: null, name: '' });

  const [showMachineModal, setShowMachineModal] = useState(false);
  const [machineForm, setMachineForm] = useState({ name: '', description: '', category_id: '' });
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineLoading, setMachineLoading] = useState(false);
  const [confirmMachineModal, setConfirmMachineModal] = useState({ show: false, id: null, name: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const shouldLock =
      showCategoryModal ||
      confirmCategoryModal.show ||
      showMachineModal ||
      confirmMachineModal.show;
    document.body.style.overflow = shouldLock ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCategoryModal, confirmCategoryModal.show, showMachineModal, confirmMachineModal.show]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoryRes, machineRes] = await Promise.all([
        machineCategoryApi.getAll(),
        machineApi.getAll(),
      ]);
      setCategories(Array.isArray(categoryRes.data) ? categoryRes.data : []);
      setMachines(Array.isArray(machineRes.data) ? machineRes.data : []);
    } catch (error) {
      console.error('Erro ao carregar dados de maquinário:', error);
      showToast(error.response?.data?.message || 'Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return categories.filter(cat =>
      cat.name?.toLowerCase().includes(term) ||
      (cat.description || '').toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  const filteredMachines = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return machines.filter(machine =>
      machine.name?.toLowerCase().includes(term) ||
      (machine.description || '').toLowerCase().includes(term) ||
      (machine.category?.name || '').toLowerCase().includes(term)
    );
  }, [machines, searchTerm]);

  const stats = {
    totalCategories: categories.length,
    totalMachines: machines.length,
  };

  const getMachineCountForCategory = categoryId =>
    machines.filter(machine => machine.category_id === categoryId).length;

  const handleOpenCategoryModal = () => {
    setCategoryForm({ name: '', description: '' });
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = category => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async event => {
    event.preventDefault();
    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description?.trim() || undefined,
    };

    if (!payload.name) {
      showToast('Informe o nome da categoria de maquinário', 'error');
      return;
    }

    try {
      setCategoryLoading(true);
      if (editingCategory) {
        await machineCategoryApi.update(editingCategory.category_id, payload);
        showToast('Categoria atualizada com sucesso!', 'success');
      } else {
        await machineCategoryApi.create(payload);
        showToast('Categoria criada com sucesso!', 'success');
      }
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '' });
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria de maquinário:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar categoria', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = category => {
    setConfirmCategoryModal({ show: true, id: category.category_id, name: category.name });
  };

  const confirmDeleteCategory = async () => {
    try {
      setCategoryLoading(true);
      await machineCategoryApi.delete(confirmCategoryModal.id);
      showToast('Categoria removida com sucesso!', 'success');
      setConfirmCategoryModal({ show: false, id: null, name: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir categoria de maquinário:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir categoria', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  const handleOpenMachineModal = () => {
    setMachineForm({ name: '', description: '', category_id: '' });
    setEditingMachine(null);
    setShowMachineModal(true);
  };

  const handleEditMachine = machine => {
    setEditingMachine(machine);
    setMachineForm({
      name: machine.name || '',
      description: machine.description || '',
      category_id: machine.category_id || machine.category?.category_id || '',
    });
    setShowMachineModal(true);
  };

  const handleSaveMachine = async event => {
    event.preventDefault();
    const payload = {
      name: machineForm.name.trim(),
      description: machineForm.description?.trim() || undefined,
      category_id: machineForm.category_id,
    };

    if (!payload.name || !payload.category_id) {
      showToast('Informe o nome da máquina e selecione uma categoria', 'error');
      return;
    }

    try {
      setMachineLoading(true);
      if (editingMachine) {
        await machineApi.update(editingMachine.machine_id, payload);
        showToast('Máquina atualizada com sucesso!', 'success');
      } else {
        await machineApi.create(payload);
        showToast('Máquina criada com sucesso!', 'success');
      }
      setShowMachineModal(false);
      setMachineForm({ name: '', description: '', category_id: '' });
      setEditingMachine(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar máquina:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar máquina', 'error');
    } finally {
      setMachineLoading(false);
    }
  };

  const handleDeleteMachine = machine => {
    setConfirmMachineModal({ show: true, id: machine.machine_id, name: machine.name });
  };

  const confirmDeleteMachine = async () => {
    try {
      setMachineLoading(true);
      await machineApi.delete(confirmMachineModal.id);
      showToast('Máquina removida com sucesso!', 'success');
      setConfirmMachineModal({ show: false, id: null, name: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir máquina:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir máquina', 'error');
    } finally {
      setMachineLoading(false);
    }
  };

  const handleCancelMachineEdit = () => {
    setEditingMachine(null);
    setMachineForm({ name: '', description: '', category_id: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Maquinário</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie categorias e máquinas disponíveis para os orçamentos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-600 truncate font-medium">Categorias</p>
                  <p className="text-lg font-bold text-blue-600">{stats.totalCategories}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Cog className="text-blue-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-blue-600">Categorias de maquinário ativas</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-emerald-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-emerald-600 truncate font-medium">Máquinas</p>
                  <p className="text-lg font-bold text-emerald-600">{stats.totalMachines}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Cpu className="text-emerald-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-emerald-600">Máquinas cadastradas</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cog size={18} />
                Categorias
              </div>
            </button>
            <button
              onClick={() => setActiveTab('machines')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'machines'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu size={18} />
                Máquinas
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nome, descrição ou categoria..."
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {activeTab === 'categories' ? (
              <button
                onClick={handleOpenCategoryModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Categoria</span>
              </button>
            ) : (
              <button
                onClick={handleOpenMachineModal}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Máquina</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="text-gray-600 mt-4">Carregando...</p>
          </div>
        ) : activeTab === 'categories' ? (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Layers className="text-blue-600" size={16} />
              Categorias ({filteredCategories.length})
            </h3>

            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Cog size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600 font-medium text-xs">Nenhuma categoria encontrada</p>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${
                  (filteredCategories.length > 2 && window.innerWidth < 768) ||
                  (filteredCategories.length > 4 && window.innerWidth >= 768 && window.innerWidth < 1024) ||
                  (filteredCategories.length > 6 && window.innerWidth >= 1024)
                    ? 'max-h-[300px] overflow-y-auto pr-2'
                    : ''
                }`}
              >
                {filteredCategories.map(category => {
                  const machineCount = getMachineCountForCategory(category.category_id);
                  const isEditing = editingCategory?.category_id === category.category_id;

                  return (
                    <div
                      key={category.category_id}
                      className={`bg-white rounded-lg p-3 border transition-all ${
                        isEditing
                          ? 'border-blue-500 shadow ring-1 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Cog className="text-blue-600" size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{category.name}</h4>
                            {isEditing && (
                              <span className="px-1 py-0.5 bg-blue-600 text-white text-[9px] font-semibold rounded">Editando</span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            disabled={categoryLoading}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                            disabled={categoryLoading || machineCount > 0}
                            title={machineCount > 0 ? 'Possui máquinas vinculadas' : 'Excluir'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {category.description && (
                        <p className="text-[10px] text-gray-600 mb-2 line-clamp-2">{category.description}</p>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-medium">
                        <Cpu size={10} />
                        {machineCount} máquinas
                        {machineCount > 0 && <span className="ml-0.5">🔒</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="text-emerald-600" size={16} />
              Máquinas ({filteredMachines.length})
            </h3>

            {filteredMachines.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Cpu size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600 font-medium text-xs">Nenhuma máquina encontrada</p>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${
                  (filteredMachines.length > 2 && window.innerWidth < 768) ||
                  (filteredMachines.length > 4 && window.innerWidth >= 768 && window.innerWidth < 1024) ||
                  (filteredMachines.length > 6 && window.innerWidth >= 1024)
                    ? 'max-h-[600px] overflow-y-auto pr-2'
                    : ''
                }`}
              >
                {filteredMachines.map(machine => {
                  const isEditing = editingMachine?.machine_id === machine.machine_id;
                  const categoryLabel = machine.category?.name ||
                    categories.find(cat => cat.category_id === machine.category_id)?.name ||
                    'Sem categoria';

                  return (
                    <div
                      key={machine.machine_id}
                      className={`bg-white rounded-lg p-3 border transition-all ${
                        isEditing
                          ? 'border-emerald-500 shadow ring-1 ring-emerald-200'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Cpu className="text-emerald-600" size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{machine.name}</h4>
                            {isEditing && (
                              <span className="px-1 py-0.5 bg-emerald-600 text-white text-[9px] font-semibold rounded">Editando</span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          <button
                            onClick={() => handleEditMachine(machine)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            disabled={machineLoading}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMachine(machine)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            disabled={machineLoading}
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {machine.description && (
                        <p className="text-[10px] text-gray-600 mb-2 line-clamp-2">{machine.description}</p>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                        <Cog size={10} />
                        {categoryLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600">
              <div className="flex items-center gap-2">
                <Cog className="text-white" size={18} />
                <h2 className="text-lg font-bold text-white">
                  {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  handleCancelCategoryEdit();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={event => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  placeholder="Ex: Escavadeiras"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={categoryLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={categoryForm.description}
                  onChange={event => setCategoryForm({ ...categoryForm, description: event.target.value })}
                  placeholder="Descreva a categoria..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={categoryLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    handleCancelCategoryEdit();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={categoryLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  {categoryLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      {editingCategory ? <Edit size={16} /> : <Plus size={16} />}
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMachineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-emerald-600">
              <div className="flex items-center gap-2">
                <Cpu className="text-white" size={18} />
                <h2 className="text-lg font-bold text-white">
                  {editingMachine ? 'Editar Máquina' : 'Nova Máquina'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowMachineModal(false);
                  handleCancelMachineEdit();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMachine} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={machineForm.category_id}
                  onChange={event => setMachineForm({ ...machineForm, category_id: event.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={machineLoading}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={machineForm.name}
                  onChange={event => setMachineForm({ ...machineForm, name: event.target.value })}
                  placeholder="Ex: Escavadeira ZX200"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={machineLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={machineForm.description}
                  onChange={event => setMachineForm({ ...machineForm, description: event.target.value })}
                  placeholder="Detalhes adicionais da máquina..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                  disabled={machineLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMachineModal(false);
                    handleCancelMachineEdit();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={machineLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  {machineLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      {editingMachine ? <Edit size={16} /> : <Plus size={16} />}
                      {editingMachine ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmCategoryModal.show && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => setConfirmCategoryModal({ show: false, id: null, name: '' })}
        >
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5" onClick={event => event.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Cog className="text-blue-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir categoria?</h3>
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmCategoryModal.name}</p>
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <Info size={12} />
                Esta ação não pode ser desfeita
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmCategoryModal({ show: false, id: null, name: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmMachineModal.show && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => setConfirmMachineModal({ show: false, id: null, name: '' })}
        >
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5" onClick={event => event.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <Cpu className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir máquina?</h3>
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmMachineModal.name}</p>
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <Info size={12} />
                Esta ação não pode ser desfeita
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmMachineModal({ show: false, id: null, name: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteMachine}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, excluir
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
