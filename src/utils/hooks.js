import { useState, useCallback } from 'react';
import { entityValidators, isFormValid } from './validation';
import apiService from '../services/api';

/**
 * Hook para gerenciar formulários com validação automática
 * Elimina duplicação de código entre componentes de formulário
 */
export const useFormHandler = (initialData, validatorKey, options = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validateForm = useCallback(() => {
    if (!entityValidators[validatorKey]) {
      console.warn(`Validator '${validatorKey}' not found`);
      return true;
    }
    
    const errors = entityValidators[validatorKey](formData, options.isCreate);
    setValidationErrors(errors);
    return isFormValid(errors);
  }, [formData, validatorKey, options.isCreate]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro específico quando usuário começar a digitar
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [validationErrors]);

  const resetForm = useCallback((newData = initialData) => {
    setFormData(newData);
    setValidationErrors({});
    setSaving(false);
  }, [initialData]);

  const isFormValidNow = useCallback(() => {
    if (!entityValidators[validatorKey]) return true;
    const errors = entityValidators[validatorKey](formData, options.isCreate);
    return isFormValid(errors);
  }, [formData, validatorKey, options.isCreate]);

  return {
    formData,
    setFormData,
    validationErrors,
    setValidationErrors,
    saving,
    setSaving,
    validateForm,
    handleFieldChange,
    resetForm,
    isFormValid: isFormValidNow
  };
};

/**
 * Hook para gerenciar modais com estados padronizados
 */
export const useModalHandler = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedItem, setSelectedItem] = useState(null);
  const [error, setError] = useState('');

  const openCreateModal = useCallback(() => {
    setModalMode('create');
    setSelectedItem(null);
    setShowModal(true);
    setError('');
  }, []);

  const openEditModal = useCallback((item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setShowModal(true);
    setError('');
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setModalMode('create');
    setSelectedItem(null);
    setError('');
  }, []);

  const resetModal = useCallback(() => {
    setModalMode('create');
    setSelectedItem(null);
    setError('');
  }, []);

  return {
    showModal,
    setShowModal,
    modalMode,
    setModalMode,
    selectedItem,
    setSelectedItem,
    error,
    setError,
    openCreateModal,
    openEditModal,
    closeModal,
    resetModal
  };
};

/**
 * Hook para gerenciar autenticação e headers de API
 */
export const useApiHeaders = () => {
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }, []);

  return { getAuthHeaders };
};

/**
 * Hook para gerenciar paginação
 */
export const usePagination = (items, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

/**
 * Hook para gerenciar filtros de busca
 */
export const useSearch = (items, searchFields = ['nome']) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item => {
    if (!searchTerm.trim()) return true;
    
    return searchFields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  return {
    searchTerm,
    setSearchTerm,
    filteredItems
  };
};

/**
 * Hook para gerenciar operações CRUD com o novo serviço de API
 */
export const useCrudOperations = (entityName, onSuccess) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const create = useCallback(async (data) => {
    try {
      setLoading(true);
      setError('');

      let result;
      switch (entityName) {
        case 'unidades':
          result = await apiService.createUnidade(data);
          break;
        case 'instrutores':
          result = await apiService.createInstrutor(data);
          break;
        case 'empresas':
          result = await apiService.createEmpresa(data);
          break;
        case 'turmas':
          result = await apiService.createTurma(data);
          break;
        case 'alunos':
          result = await apiService.createAluno(data);
          break;
        case 'aulas':
          result = await apiService.createAula(data);
          break;
        case 'turma-aulas':
          result = await apiService.createTurmaAula(data);
          break;
        default:
          throw new Error(`Entidade '${entityName}' não suportada`);
      }

      if (onSuccess) onSuccess();
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Erro de conexão';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [entityName, onSuccess]);

  const update = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError('');

      let result;
      switch (entityName) {
        case 'unidades':
          result = await apiService.updateUnidade(id, data);
          break;
        case 'instrutores':
          result = await apiService.updateInstrutor(id, data);
          break;
        case 'empresas':
          result = await apiService.updateEmpresa(id, data);
          break;
        case 'turmas':
          result = await apiService.updateTurma(id, data);
          break;
        case 'alunos':
          result = await apiService.updateAluno(id, data);
          break;
        case 'aulas':
          result = await apiService.updateAula(id, data);
          break;
        case 'turma-aulas':
          result = await apiService.updateTurmaAula(id, data);
          break;
        default:
          throw new Error(`Entidade '${entityName}' não suportada`);
      }

      if (onSuccess) onSuccess();
      return result;
    } catch (error) {
      const errorMessage = error.message || 'Erro de conexão';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [entityName, onSuccess]);

  const remove = useCallback(async (id) => {
    try {
      setLoading(true);
      setError('');

      switch (entityName) {
        case 'unidades':
          await apiService.deleteUnidade(id);
          break;
        case 'instrutores':
          await apiService.deleteInstrutor(id);
          break;
        case 'empresas':
          await apiService.deleteEmpresa(id);
          break;
        case 'turmas':
          await apiService.deleteTurma(id);
          break;
        case 'alunos':
          await apiService.deleteAluno(id);
          break;
        case 'aulas':
          await apiService.deleteAula(id);
          break;
        case 'turma-aulas':
          await apiService.deleteTurmaAula(id);
          break;
        default:
          throw new Error(`Entidade '${entityName}' não suportada`);
      }

      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      const errorMessage = error.message || 'Erro de conexão';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [entityName, onSuccess]);

  return {
    loading,
    error,
    setError,
    create,
    update,
    remove
  };
};