// filepath: c:\Users\anderson.bergamo\Videos\Kame\Kame_frontend\src\pages\admin\categories\Categories.js
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Folder, FolderTree, List } from 'lucide-react';
import { categoriesApi, subCategoriesApi } from '../../../services/api';
import Toast from '../../../components/Toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' ou 'subcategories'
  
  // Estados para Categorias
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name_category: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [confirmCategoryModal, setConfirmCategoryModal] = useState({ show: false, id: null, name: '' });
  
  // Estados para Subcategorias
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [subCategoryForm, setSubCategoryForm] = useState({ name_sub_category: '', description: '', category_id: '' });
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);
  const [confirmSubCategoryModal, setConfirmSubCategoryModal] = useState({ show: false, id: null, name: '' });
  
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
    if (showCategoryModal || confirmCategoryModal.show || showSubCategoryModal || confirmSubCategoryModal.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCategoryModal, confirmCategoryModal.show, showSubCategoryModal, confirmSubCategoryModal.show]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, subCategoriesRes] = await Promise.all([
        categoriesApi.getAll(),
        subCategoriesApi.getAll(),
      ]);
      setCategories(categoriesRes.data || []);
      setSubCategories(subCategoriesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ====== FUNÇÕES PARA CATEGORIAS ======
  const handleOpenCategoryModal = () => {
    setCategoryForm({ name_category: '', description: '' });
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name_category: category.name_category,
      description: category.description || ''
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name_category.trim()) {
      showToast('Por favor, preencha o nome da categoria', 'error');
      return;
    }

    try {
      setCategoryLoading(true);
      if (editingCategory) {
        await categoriesApi.update(editingCategory.category_id, categoryForm);
        showToast('Categoria atualizada com sucesso!', 'success');
      } else {
        await categoriesApi.create(categoryForm);
        showToast('Categoria criada com sucesso!', 'success');
      }
      setCategoryForm({ name_category: '', description: '' });
      setEditingCategory(null);
      setShowCategoryModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar categoria', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = (category) => {
    setConfirmCategoryModal({
      show: true,
      id: category.category_id,
      name: category.name_category
    });
  };

  const confirmDeleteCategory = async () => {
    try {
      setCategoryLoading(true);
      await categoriesApi.delete(confirmCategoryModal.id);
      showToast('Categoria excluída com sucesso!', 'success');
      setConfirmCategoryModal({ show: false, id: null, name: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir categoria', 'error');
      setConfirmCategoryModal({ show: false, id: null, name: '' });
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
    setCategoryForm({ name_category: '', description: '' });
  };

  // ====== FUNÇÕES PARA SUBCATEGORIAS ======
  const handleOpenSubCategoryModal = () => {
    setSubCategoryForm({ name_sub_category: '', description: '', category_id: '' });
    setEditingSubCategory(null);
    setShowSubCategoryModal(true);
  };

  const handleEditSubCategory = (subCategory) => {
    setEditingSubCategory(subCategory);
    setSubCategoryForm({
      name_sub_category: subCategory.name_sub_category,
      description: subCategory.description || '',
      category_id: subCategory.category?.category_id || ''
    });
    setShowSubCategoryModal(true);
  };

  const handleSaveSubCategory = async (e) => {
    e.preventDefault();
    if (!subCategoryForm.name_sub_category.trim() || !subCategoryForm.category_id) {
      showToast('Por favor, preencha todos os campos obrigatórios', 'error');
      return;
    }

    try {
      setSubCategoryLoading(true);
      
      // Converter category_id para número
      const payload = {
        ...subCategoryForm,
        category_id: parseInt(subCategoryForm.category_id, 10)
      };
      
      if (editingSubCategory) {
        await subCategoriesApi.update(editingSubCategory.sub_category_id, payload);
        showToast('Subcategoria atualizada com sucesso!', 'success');
      } else {
        await subCategoriesApi.create(payload);
        showToast('Subcategoria criada com sucesso!', 'success');
      }
      setSubCategoryForm({ name_sub_category: '', description: '', category_id: '' });
      setEditingSubCategory(null);
      setShowSubCategoryModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar subcategoria:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar subcategoria', 'error');
    } finally {
      setSubCategoryLoading(false);
    }
  };

  const handleDeleteSubCategory = (subCategory) => {
    setConfirmSubCategoryModal({
      show: true,
      id: subCategory.sub_category_id,
      name: subCategory.name_sub_category
    });
  };

  const confirmDeleteSubCategory = async () => {
    try {
      setSubCategoryLoading(true);
      await subCategoriesApi.delete(confirmSubCategoryModal.id);
      showToast('Subcategoria excluída com sucesso!', 'success');
      setConfirmSubCategoryModal({ show: false, id: null, name: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir subcategoria:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir subcategoria', 'error');
      setConfirmSubCategoryModal({ show: false, id: null, name: '' });
    } finally {
      setSubCategoryLoading(false);
    }
  };

  const handleCancelSubCategoryEdit = () => {
    setEditingSubCategory(null);
    setSubCategoryForm({ name_sub_category: '', description: '', category_id: '' });
  };

  // Filtrar por busca
  const filteredCategories = categories.filter(cat =>
    cat.name_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubCategories = subCategories.filter(sub =>
    sub.name_sub_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sub.category?.name_category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const stats = {
    totalCategories: categories.length,
    totalSubCategories: subCategories.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Categorias e Subcategorias</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie as categorias e suas subcategorias</p>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-indigo-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-indigo-600 truncate font-medium">Categorias</p>
                  <p className="text-lg font-bold text-indigo-600">{stats.totalCategories}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Folder className="text-indigo-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-indigo-600">{stats.totalCategories} categorias</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-cyan-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-cyan-600 truncate font-medium">Subcategorias</p>
                  <p className="text-lg font-bold text-cyan-600">{stats.totalSubCategories}</p>
                </div>
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderTree className="text-cyan-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-cyan-600">{stats.totalSubCategories} subcategorias</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folder size={18} />
                Categorias
              </div>
            </button>
            <button
              onClick={() => setActiveTab('subcategories')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'subcategories'
                  ? 'border-cyan-600 text-cyan-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderTree size={18} />
                Subcategorias
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
            {activeTab === 'categories' ? (
              <button
                onClick={handleOpenCategoryModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Categoria</span>
              </button>
            ) : (
              <button
                onClick={handleOpenSubCategoryModal}
                className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Subcategoria</span>
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
        ) : activeTab === 'categories' ? (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <List className="text-indigo-600" size={16} />
              Categorias ({filteredCategories.length})
            </h3>
            
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Folder size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600 font-medium text-xs">Nenhuma categoria encontrada</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${
                (filteredCategories.length > 2 && window.innerWidth < 768) || 
                (filteredCategories.length > 4 && window.innerWidth >= 768 && window.innerWidth < 1024) || 
                (filteredCategories.length > 6 && window.innerWidth >= 1024)
                ? 'max-h-[300px] overflow-y-auto pr-2' : ''
              }`}>
                {filteredCategories.map((category) => {
                  const subCatCount = subCategories.filter(s => s.category?.category_id === category.category_id).length;
                  const isEditing = editingCategory?.category_id === category.category_id;
                  
                  return (
                    <div
                      key={category.category_id}
                      className={`bg-white rounded-lg p-3 border transition-all ${
                        isEditing 
                          ? 'border-indigo-500 shadow ring-1 ring-indigo-200' 
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Folder className="text-indigo-600" size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{category.name_category}</h4>
                            {isEditing && (
                              <span className="px-1 py-0.5 bg-indigo-600 text-white text-[9px] font-semibold rounded">
                                Editando
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            disabled={categoryLoading}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                            disabled={categoryLoading || subCatCount > 0}
                            title={subCatCount > 0 ? "Possui subcategorias" : "Excluir"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {category.description && (
                        <p className="text-[10px] text-gray-600 mb-2 line-clamp-2">{category.description}</p>
                      )}
                      
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-[10px] font-medium">
                        <FolderTree size={10} />
                        {subCatCount} subcategorias
                        {subCatCount > 0 && <span className="ml-0.5">🔒</span>}
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
              <List className="text-cyan-600" size={16} />
              Subcategorias ({filteredSubCategories.length})
            </h3>
            
            {filteredSubCategories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FolderTree size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-gray-600 font-medium text-xs">Nenhuma subcategoria encontrada</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ${
                (filteredSubCategories.length > 2 && window.innerWidth < 768) || 
                (filteredSubCategories.length > 4 && window.innerWidth >= 768 && window.innerWidth < 1024) || 
                (filteredSubCategories.length > 6 && window.innerWidth >= 1024)
                ? 'max-h-[600px] overflow-y-auto pr-2' : ''
              }`}>
                {filteredSubCategories.map((subCategory) => {
                  const isEditing = editingSubCategory?.sub_category_id === subCategory.sub_category_id;
                  
                  return (
                    <div
                      key={subCategory.sub_category_id}
                      className={`bg-white rounded-lg p-3 border transition-all ${
                        isEditing 
                          ? 'border-cyan-500 shadow ring-1 ring-cyan-200' 
                          : 'border-gray-200 hover:border-cyan-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FolderTree className="text-cyan-600" size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm truncate">{subCategory.name_sub_category}</h4>
                            {isEditing && (
                              <span className="px-1 py-0.5 bg-cyan-600 text-white text-[9px] font-semibold rounded">
                                Editando
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => handleEditSubCategory(subCategory)}
                            className="p-1 text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                            disabled={subCategoryLoading}
                            title="Editar"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubCategory(subCategory)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            disabled={subCategoryLoading}
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {subCategory.description && (
                        <p className="text-[10px] text-gray-600 mb-2 line-clamp-2">{subCategory.description}</p>
                      )}
                      
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">
                        <Folder size={10} />
                        {subCategory.category?.name_category || '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Categoria */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-indigo-600">
              <div className="flex items-center gap-2">
                <Folder className="text-white" size={18} />
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
                  value={categoryForm.name_category}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_category: e.target.value })}
                  placeholder="Ex: Eletrônicos"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={categoryLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Descreva a categoria..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
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
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
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

      {/* Modal de Subcategoria */}
      {showSubCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-cyan-600">
              <div className="flex items-center gap-2">
                <FolderTree className="text-white" size={18} />
                <h2 className="text-lg font-bold text-white">
                  {editingSubCategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowSubCategoryModal(false);
                  handleCancelSubCategoryEdit();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSubCategory} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={subCategoryForm.category_id}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  disabled={subCategoryLoading}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name_category}
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
                  value={subCategoryForm.name_sub_category}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name_sub_category: e.target.value })}
                  placeholder="Ex: Smartphones"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  disabled={subCategoryLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={subCategoryForm.description}
                  onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
                  placeholder="Descreva a subcategoria..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 resize-none"
                  disabled={subCategoryLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubCategoryModal(false);
                    handleCancelSubCategoryEdit();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subCategoryLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                >
                  {subCategoryLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      {editingSubCategory ? <Edit size={16} /> : <Plus size={16} />}
                      {editingSubCategory ? 'Atualizar' : 'Criar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Categoria */}
      {confirmCategoryModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmCategoryModal({ show: false, id: null, name: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <Folder className="text-indigo-600" size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Categoria?</h3>
              
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmCategoryModal.name}</p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
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
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação - Subcategoria */}
      {confirmSubCategoryModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={() => setConfirmSubCategoryModal({ show: false, id: null, name: '' })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-3">
                <FolderTree className="text-cyan-600" size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Subcategoria?</h3>
              
              <p className="text-xs text-gray-600 mb-1">Você está prestes a excluir:</p>
              <p className="font-semibold text-gray-900 mb-3 text-sm">{confirmSubCategoryModal.name}</p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmSubCategoryModal({ show: false, id: null, name: '' })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteSubCategory}
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
