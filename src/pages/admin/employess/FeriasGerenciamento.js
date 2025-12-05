// filepath: c:\Users\anderson.bergamo\Videos\Kame\Kame_frontend\src\pages\admin\employess\FeriasGerenciamento.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, DollarSign, X } from 'lucide-react';
import { employeesApi, vacationsApi } from '../../../services/api';
import Toast from '../../../components/Toast';

export default function FeriasGerenciamento() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [vacations, setVacations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVacation, setEditingVacation] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, vacation: null });
  
  const [formData, setFormData] = useState({
    date_start: '',
    date_end: '',
    value: '',
  });
  
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (showModal || confirmDelete.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, confirmDelete.show]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeeRes, vacationsRes] = await Promise.all([
        employeesApi.getById(id),
        vacationsApi.getAll(),
      ]);
      
      setEmployee(employeeRes.data);
      
      // Filtrar férias do funcionário atual
      const employeeVacations = vacationsRes.data.filter(
        v => v.employee_id === id || v.employee?.employee_id === id
      );
      setVacations(employeeVacations);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vacation = null) => {
    if (vacation) {
      setEditingVacation(vacation);
      setFormData({
        date_start: vacation.date_start,
        date_end: vacation.date_end,
        value: vacation.value,
      });
    } else {
      setEditingVacation(null);
      setFormData({
        date_start: '',
        date_end: '',
        value: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVacation(null);
    setFormData({
      date_start: '',
      date_end: '',
      value: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação de datas
    if (new Date(formData.date_start) > new Date(formData.date_end)) {
      showToast('Data de início não pode ser maior que data de término', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      const dataToSend = {
        employee_id: id,
        date_start: formData.date_start,
        date_end: formData.date_end,
        value: parseFloat(formData.value),
      };
      
      if (editingVacation) {
        await vacationsApi.update(editingVacation.vacation_id, dataToSend);
        showToast('Férias atualizada com sucesso!', 'success');
      } else {
        await vacationsApi.create(dataToSend);
        showToast('Férias criada com sucesso!', 'success');
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar férias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await vacationsApi.delete(confirmDelete.vacation.vacation_id);
      showToast('Férias excluída com sucesso!', 'success');
      setConfirmDelete({ show: false, vacation: null });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir férias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Estatísticas
  const totalVacations = vacations.length;
  const totalValue = vacations.reduce((sum, v) => sum + parseFloat(v.value || 0), 0);
  const totalDays = vacations.reduce((sum, v) => sum + calculateDays(v.date_start, v.date_end), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/admin/funcionarios/editar/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar para Funcionário
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciar Férias</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {employee ? employee.name : 'Carregando...'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-all font-medium shadow-lg"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Férias</span>
                <span className="sm:hidden">Nova</span>
              </button>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Total de Férias</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{totalVacations}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Dias Totais</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{totalDays}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Valor Total</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalValue)}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-emerald-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Férias */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-green-600"></div>
              <p className="text-gray-600 mt-4">Carregando...</p>
            </div>
          ) : vacations.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-medium">Nenhuma férias cadastrada</p>
              <p className="text-sm text-gray-500 mt-2">Clique em "Nova Férias" para começar</p>
            </div>
          ) : (
            <>
              {/* Mobile - Cards */}
              <div className="block md:hidden divide-y divide-gray-200">
                {vacations.map((vacation) => (
                  <div key={vacation.vacation_id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Calendar className="text-green-600" size={20} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{formatDate(vacation.date_start)} - {formatDate(vacation.date_end)}</p>
                          <p className="text-xs text-gray-500">{calculateDays(vacation.date_start, vacation.date_end)} dias</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenModal(vacation)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ show: true, vacation })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-50 rounded-lg p-2">
                      <span className="text-xs text-gray-600">Valor:</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(vacation.value)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop - Tabela */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Período</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Data Início</th>
                      <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Data Término</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Dias</th>
                      <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Valor</th>
                      <th className="text-center text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vacations.map((vacation) => (
                      <tr key={vacation.vacation_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Calendar className="text-green-600" size={20} />
                            </div>
                            <span className="font-medium text-gray-900">
                              {formatDate(vacation.date_start)} - {formatDate(vacation.date_end)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{formatDate(vacation.date_start)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700">{formatDate(vacation.date_end)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {calculateDays(vacation.date_start, vacation.date_end)} dias
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-emerald-700">{formatCurrency(vacation.value)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenModal(vacation)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ show: true, vacation })}
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
      </div>

      {/* Modal de Criar/Editar Férias */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-600 to-green-700">
              <div className="flex items-center gap-3">
                <Calendar className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">
                  {editingVacation ? 'Editar Férias' : 'Nova Férias'}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={formData.date_start}
                  onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Término *
                </label>
                <input
                  type="date"
                  value={formData.date_end}
                  onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {formData.date_start && formData.date_end && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">
                    📅 Total: {calculateDays(formData.date_start, formData.date_end)} dias
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
                >
                  {loading ? 'Salvando...' : editingVacation ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {confirmDelete.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDelete({ show: false, vacation: null })}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Férias?</h3>
              
              <p className="text-sm text-gray-600 mb-1">
                Você está prestes a excluir o período:
              </p>
              <p className="font-semibold text-gray-900 mb-3">
                {formatDate(confirmDelete.vacation?.date_start)} - {formatDate(confirmDelete.vacation?.date_end)}
              </p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDelete({ show: false, vacation: null })}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
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
  );
}