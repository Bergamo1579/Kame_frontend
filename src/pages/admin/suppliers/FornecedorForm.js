// filepath: c:\Users\anderson.bergamo\Videos\Kame\Kame_frontend\src\pages\admin\FornecedorForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supplierApi, statusSupplierApi, segmentsSupplierApi, clientsApi } from '../../../services/api';
import { typePaymentApi } from '../../../services/api';
import Toast from '../../../components/Toast';
import { formatCPFCNPJ, formatPhone, unformatCPFCNPJ, unformatPhone } from '../../../utils/formatters';

export default function FornecedorForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [segments, setSegments] = useState([]);
  const [typePayments, setTypePayments] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [formData, setFormData] = useState({
    name_supplier: '',
    email: '',
    phone: '',
    address: '',
    CPF_CNPJ: '',
    name_responsible: '',
    corporate_name: '',
    status_id: '',
    segment_id: '',
    client_id: '',
    descricao: '',
    payment_method: '',
    tags: '',
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    loadSelects();
    if (isEdit) {
      loadSupplier();
    }
  }, [id]);

  const loadSelects = async () => {
    try {
      const [statusRes, segmentsRes, clientsRes, typePaymentsRes] = await Promise.all([
        statusSupplierApi.getAll(),
        segmentsSupplierApi.getAll(),
        clientsApi.getAll(),
        typePaymentApi.getAll(),
      ]);
      setStatuses(statusRes.data || []);
      setSegments(segmentsRes.data || []);
      setClients(clientsRes.data || []);
      setTypePayments(typePaymentsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar selects:', error);
      showToast('Erro ao carregar dados', 'error');
    }
  };

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const res = await supplierApi.getById(id);
      
      const supplierData = {
        ...res.data,
        CPF_CNPJ: formatCPFCNPJ(res.data.CPF_CNPJ || ''),
        phone: formatPhone(res.data.phone || ''),
        status_id: res.data.status_id || res.data.status?.status_id || '',
        segment_id: res.data.segment_id || res.data.segment?.segment_id || '',
        descricao: res.data.descricao || '',
        payment_method: res.data.payment_method || '',
        client_id: res.data.client_id || res.data.client?.client_id || '',
        tags: res.data.tags || '',
      };
      
      delete supplierData.status;
      delete supplierData.segment;
      delete supplierData.client;
      
      setFormData(supplierData);
    } catch (error) {
      console.error('Erro ao carregar fornecedor:', error);
      showToast('Erro ao carregar fornecedor', 'error');
      navigate('/admin/fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let parsedValue = value;
    
    // Aplicar formatação visual
    if (name === 'CPF_CNPJ') {
      parsedValue = formatCPFCNPJ(value);
    } else if (name === 'phone') {
      parsedValue = formatPhone(value);
    } else if (name === 'status_id' || name === 'segment_id') {
      parsedValue = value === '' ? '' : parseInt(value, 10);
    } else if (name === 'client_id') {
      parsedValue = value === '' ? '' : parseInt(value, 10);
    }
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      // Validação CPF/CNPJ: vazio ou 11 ou 14 dígitos numéricos
      const digitsOnly = (formData.CPF_CNPJ || '').replace(/\D/g, '');
      if (digitsOnly !== '' && digitsOnly.length !== 11 && digitsOnly.length !== 14) {
        showToast('CPF/CNPJ deve conter 11 ou 14 dígitos numéricos', 'error');
        setLoading(false);
        return;
      }
      
      const dataToSend = {
        ...formData,
        CPF_CNPJ: digitsOnly === '' ? null : unformatCPFCNPJ(formData.CPF_CNPJ),
        phone: unformatPhone(formData.phone),
        status_id: parseInt(formData.status_id, 10),
        segment_id: parseInt(formData.segment_id, 10),
        descricao: formData.descricao || null,
        payment_method: formData.payment_method || null,
        client_id: formData.client_id === '' ? null : parseInt(formData.client_id, 10),
        tags: formData.tags ? formData.tags.trim() : null,
        email: formData.email || null,
        address: formData.address || null,
        name_responsible: formData.name_responsible || null,
        corporate_name: formData.corporate_name || null,
      };
      
      if (isEdit) {
        await supplierApi.update(id, dataToSend);
        navigate('/admin/fornecedores', { 
          state: { message: 'Fornecedor atualizado com sucesso!', type: 'success' }
        });
      } else {
        await supplierApi.create(dataToSend);
        navigate('/admin/fornecedores', { 
          state: { message: 'Fornecedor criado com sucesso!', type: 'success' }
        });
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar fornecedor', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/fornecedores')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar para Fornecedores
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Preencha os dados do fornecedor
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Fornecedor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Fornecedor *
              </label>
              <input
                type="text"
                name="name_supplier"
                value={formData.name_supplier}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                placeholder="Nome do fornecedor"
              />
            </div>

            {/* CPF/CNPJ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF/CNPJ
              </label>
              <input
                type="text"
                name="CPF_CNPJ"
                value={formData.CPF_CNPJ}
                onChange={handleChange}
                
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                placeholder="00.000.000/0000-00"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Responsável
              </label>
              <input
                type="text"
                name="name_responsible"
                value={formData.name_responsible}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                placeholder="Nome do responsável"
              />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>

            {/* Razão Social */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razão Social
              </label>
              <input
                type="text"
                name="corporate_name"
                value={formData.corporate_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                placeholder="Razão social da empresa"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status_id"
                value={formData.status_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
              >
                <option value="">Selecione um status</option>
                {statuses.map(status => (
                  <option key={status.status_supplier_id || status.status_id} value={Number(status.status_supplier_id || status.status_id)}>
                    {status.name_status}
                  </option>
                ))}
              </select>
            </div>

            {/* Segmento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segmento *
              </label>
              <select
                name="segment_id"
                value={formData.segment_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
              >
                <option value="">Selecione um segmento</option>
                {segments.map(segment => (
                  <option key={segment.segment_supplier_id || segment.segment_id} value={Number(segment.segment_supplier_id || segment.segment_id)}>
                    {segment.name_segment}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente (Opcional) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente (Opcional)
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.client_id} value={client.client_id}>
                    {client.name_client}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent resize-none"
                placeholder="Descrição adicional sobre o fornecedor"
              />
            </div>

            {/* Método de Pagamento (texto) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
              <input
                type="text"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                placeholder="Ex: Boleto, Transferência, Cartão"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
              />
            </div>

            {/* Tags (comma separated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/fornecedores')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#022873] hover:bg-[#021F59] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar Fornecedor'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      <Toast 
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
}