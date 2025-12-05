import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { clientsApi, statusGeneralApi, segmentsApi } from '../../../services/api';
import Toast from '../../../components/Toast';
import { formatCPFCNPJ, formatPhone, unformatCPFCNPJ, unformatPhone } from '../../../utils/formatters';

export default function ClienteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [segments, setSegments] = useState([]);
  const [formData, setFormData] = useState({
    name_client: '',
    email: '',
    phone: '',
    address: '',
    CPF_CNPJ: '',
    name_responsible: '',
    corporate_name: '',
    reference: '',
    status_id: '',
    segment_id: '',
    estado: '',
    descricao: '',
  });

  // Estado para notificações (toast)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Função para mostrar notificação
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    // Scroll para o topo da página ao carregar
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    loadSelects();
    if (isEdit) {
      loadClient();
    }
  }, [id]);

  const loadSelects = async () => {
    try {
      const [statusRes, segmentsRes] = await Promise.all([
        statusGeneralApi.getAll(),
        segmentsApi.getAll(),
      ]);
      setStatuses(statusRes.data);
      setSegments(segmentsRes.data);
    } catch (error) {
      console.error('Erro ao carregar selects:', error);
      showToast('Erro ao carregar dados', 'error');
    }
  };

  const loadClient = async () => {
    try {
      setLoading(true);
      const res = await clientsApi.getById(id);
      
      // Extrair apenas os IDs como inteiros das relações aninhadas e formatar CPF/CNPJ e telefone
      const clientData = {
        ...res.data,
        CPF_CNPJ: formatCPFCNPJ(res.data.CPF_CNPJ || ''),
        phone: formatPhone(res.data.phone || ''),
        status_id: res.data.status_id || res.data.status?.status_id || '',
        segment_id: res.data.segment_id || res.data.segment?.segment_id || '',
        estado: res.data.estado || '',
        descricao: res.data.descricao || '',
        reference: (res.data.reference || '').toString().toUpperCase().slice(0,4)
      };
      
      // Remover objetos aninhados que não precisamos no formulário
      delete clientData.status;
      delete clientData.segment;
      
      setFormData(clientData);
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      showToast('Erro ao carregar cliente', 'error');
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
    } else if (name === 'reference') {
      // Visual uppercase for letters
      parsedValue = String(value).toUpperCase().slice(0, 4);
    }
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // helper para truncar e normalizar strings conforme esquema da tabela
      const toStringOrNull = (v, max = 255) => {
        if (v === undefined || v === null) return null;
        const s = String(v).trim();
        if (s === '') return null;
        return s.length > max ? s.slice(0, max) : s;
      };

      // pegar valores brutos
      const name_client = toStringOrNull(formData.name_client, 255);
      const email = toStringOrNull(formData.email, 255);
      const phoneRaw = toStringOrNull(formData.phone, 20);
      const address = toStringOrNull(formData.address, 255);
      const estado = toStringOrNull(formData.estado, 2);
      const descricao = toStringOrNull(formData.descricao, 255);
      const reference = toStringOrNull(formData.reference, 255);
      const cpfRaw = toStringOrNull(formData.CPF_CNPJ, 18);
      const name_responsible = toStringOrNull(formData.name_responsible, 255);
      const corporate_name = toStringOrNull(formData.corporate_name, 255);

      // status_id / segment_id devem ser inteiros válidos (obrigatórios)
      const status_id = Number.isNaN(parseInt(formData.status_id, 10)) ? null : parseInt(formData.status_id, 10);
      const segment_id = Number.isNaN(parseInt(formData.segment_id, 10)) ? null : parseInt(formData.segment_id, 10);

      // montar payload exatamente com as colunas da tabela
      const payload = {
        name_client,               // varchar(255) NOT NULL
        email,                     // varchar(255) DEFAULT NULL
        phone: phoneRaw ? unformatPhone(phoneRaw) : null, // varchar(20) DEFAULT NULL
        address,                   // varchar(255) DEFAULT NULL
        estado,                    // char(2) DEFAULT NULL
        descricao,                 // varchar(255) DEFAULT NULL
        CPF_CNPJ: cpfRaw ? unformatCPFCNPJ(cpfRaw) : null,// varchar(18) DEFAULT NULL
        name_responsible,          // varchar(255) DEFAULT NULL
        corporate_name,            // varchar(255) DEFAULT NULL
        // send uppercase alphanumeric up to 4 chars
        reference: reference ? String(reference).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) : null,
        status_id,                 // int NOT NULL
        segment_id                 // int NOT NULL
      };

      // log do payload final (inspecionar no devtools -> Console / Network)
      console.debug('ClienteForm - payload final:', payload);

      // enviar
      if (isEdit) {
        await clientsApi.update(id, payload);
        navigate('/admin/clientes', { state: { message: 'Cliente atualizado com sucesso!', type: 'success' } });
      } else {
        await clientsApi.create(payload);
        navigate('/admin/clientes', { state: { message: 'Cliente criado com sucesso!', type: 'success' } });
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      const backendData = error.response?.data;
      let userMessage = 'Erro ao salvar cliente';
      if (backendData) {
        if (Array.isArray(backendData.message)) userMessage = backendData.message.join('; ');
        else if (typeof backendData.message === 'string') userMessage = backendData.message;
        else if (typeof backendData === 'string') userMessage = backendData;
        else if (typeof backendData === 'object' && backendData.errors) {
          const list = [];
          Object.values(backendData.errors).forEach(v => {
            if (Array.isArray(v)) list.push(...v);
            else if (typeof v === 'string') list.push(v);
          });
          if (list.length) userMessage = list.join('; ');
        }
      }
      console.debug('ClienteForm - backend error data:', error.response?.data || error);
      showToast(userMessage, 'error');
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
            onClick={() => navigate('/admin/clientes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Preencha os dados do cliente
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Cliente */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cliente *
              </label>
              <input
                type="text"
                name="name_client"
                value={formData.name_client}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                placeholder="Nome completo ou razão social"
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

            {/* Razão Social */}
            <div>
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

            {/* Email (campo opcional - tipo text para evitar validação nativa) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="text"
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

            {/* Endereço + Estado (UF) - estado fica à esquerda em telas maiores */}
            <div className="md:col-span-2">
              <div className="flex flex-col md:flex-row md:items-start gap-2">
                <div className="md:w-24 w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado (UF)</label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    maxLength={2}
                    className="w-full text-center px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                    placeholder="UF"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent"
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>
              </div>
            </div>

            {/* Nome do Responsável */}
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
                  <option key={status.status_id} value={status.status_id}>
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
                  <option key={segment.segment_id} value={segment.segment_id}>
                    {segment.name_segment}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referência
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#022873] focus:border-transparent uppercase"
                placeholder="0000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={4}
                placeholder="Observações adicionais"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
              ></textarea>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="mt-6 flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/clientes')}
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
              {loading ? 'Salvando...' : 'Salvar Cliente'}
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
