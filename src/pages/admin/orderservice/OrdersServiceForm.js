import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { ordersServiceApi, budgetApi, freightApi } from '../../../services/api';
import Toast from '../../../components/Toast';

export default function OrdersServiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [freights, setFreights] = useState([]);
  
  const [formData, setFormData] = useState({
    name_os: '',
    budget_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'andamento',
    freight_id: null,
    moodle: false,
    billing_date: '',
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Scroll para o topo ao carregar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    loadBudgets();
    loadFreights();
    if (id) {
      loadOrderService();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadBudgets = async () => {
    try {
      const response = await budgetApi.getAll();
      const budgetsData = response.data?.items || response.data || [];
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error);
      showToast('Erro ao carregar orçamentos', 'error');
    }
  };

  const loadFreights = async () => {
    try {
      const response = await freightApi.getAll();
      setFreights(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar fretes:', error);
      showToast('Erro ao carregar fretes', 'error');
    }
  };

  const loadOrderService = async () => {
    try {
      setLoading(true);
      const response = await ordersServiceApi.getById(id);
      const order = response.data;
      
      const billingDate = order.billing_date
        ? order.billing_date.split('T')[0]
        : ((order.status === 'faturado' || order.status === 'finalizado')
            ? new Date().toISOString().split('T')[0]
            : '');

      setFormData({
        name_os: order.name_os || '',
        budget_id: order.budget_id || '',
        date: order.date?.split('T')[0] || order.date || '',
        description: order.description || '',
        status: order.status || 'andamento',
        freight_id: order.freight_id || null,
        moodle: order.moodle || false,
        billing_date: billingDate,
      });
    } catch (error) {
      console.error('Erro ao carregar ordem de serviço:', error);
      showToast('Erro ao carregar ordem de serviço', 'error');
      navigate('/admin/ordens-servico');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'status') {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => {
        if (value === 'faturado' || value === 'finalizado') {
          return {
            ...prev,
            status: value,
            billing_date: prev.billing_date || today,
          };
        }

        return {
          ...prev,
          status: value,
          billing_date: '',
        };
      });
      return;
    }

    if (name === 'billing_date') {
      setFormData(prev => {
        if (value) {
          const nextStatus = prev.status === 'finalizado' ? 'finalizado' : 'faturado';
          return {
            ...prev,
            billing_date: value,
            status: nextStatus,
          };
        }

        const fallbackStatus = prev.status === 'cancelado' ? 'cancelado' : 'andamento';
        return {
          ...prev,
          billing_date: '',
          status: fallbackStatus,
        };
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'freight_id' && value === '' ? null : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        date: formData.date || new Date().toISOString().split('T')[0],
        freight_id: formData.freight_id || null, // Converter string vazia para null
        billing_date: formData.billing_date || null,
      };

      if (isEdit) {
        await ordersServiceApi.update(id, payload);
        navigate('/admin/ordens-servico', { 
          state: { message: 'Ordem de Serviço atualizada com sucesso!', type: 'success' }
        });
      } else {
        await ordersServiceApi.create(payload);
        navigate('/admin/ordens-servico', { 
          state: { message: 'Ordem de Serviço criada com sucesso!', type: 'success' }
        });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar ordem de serviço', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/ordens-servico')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Voltar para Ordens de Serviço</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <FileText className="text-green-600" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEdit ? 'Atualize as informações da OS' : 'Preencha os dados para criar uma nova OS'}
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">Informações da Ordem de Serviço</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Nome da OS */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome da OS <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name_os"
                value={formData.name_os}
                onChange={handleChange}
                required
                placeholder="Ex: Manutenção Equipamento X"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Orçamento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Orçamento <span className="text-red-500">*</span>
              </label>
              <select
                name="budget_id"
                value={formData.budget_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="">Selecione um orçamento</option>
                {budgets.map(b => (
                  <option key={b.budget_id} value={b.budget_id}>
                    {b.budget_number ? `#${b.budget_number} - ` : ''}
                    {b.client?.name_client || b.client_name || 'Cliente'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Selecione o orçamento aprovado relacionado a esta OS</p>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Descreva os detalhes da ordem de serviço..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
              ></textarea>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="andamento">Em Andamento</option>
                <option value="finalizado">Finalizado</option>
                <option value="faturado">Faturado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Data de Faturamento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                <span>Data de Faturamento</span>
                <span className="text-xs font-normal text-gray-500">Preenchido automaticamente ao faturar</span>
              </label>
              <input
                type="date"
                name="billing_date"
                value={formData.billing_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ao informar a data de faturamento o status será marcado como faturado automaticamente.
              </p>
            </div>

            {/* Frete */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frete
              </label>
              <select
                name="freight_id"
                value={formData.freight_id || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="">Selecione um frete (opcional)</option>
                {freights.map(freight => (
                  <option key={freight.freight_id} value={freight.freight_id}>
                    {freight.name_freight}
                    {freight.description && ` - ${freight.description}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Selecione o frete associado a esta ordem de serviço</p>
            </div>

            {/* Moodle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="moodle"
                name="moodle"
                checked={formData.moodle}
                onChange={handleChange}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              />
              <label htmlFor="moodle" className="text-sm font-semibold text-gray-700 cursor-pointer">
                Mondey
                <span className="block text-xs font-normal text-gray-500 mt-0.5">
                  Marque se esta OS está relacionada ao sistema Mondey
                </span>
              </label>
            </div>
          </div>

          {/* Footer com Botões */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/ordens-servico')}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-lg shadow-green-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {loading ? 'Salvando...' : isEdit ? 'Atualizar OS' : 'Criar OS'}
            </button>
          </div>
        </form>
      </div>

      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ show: false, message: '', type: 'success' })} 
      />
    </div>
  );
}
