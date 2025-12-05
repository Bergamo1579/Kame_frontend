import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { employeesApi, rolesApi, accessLevelsApi, usersApi } from '../../../services/api';
import Toast from '../../../components/Toast';
import { formatCPFCNPJ, unformatCPFCNPJ } from '../../../utils/formatters';

export default function FuncionarioForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [accessLevels, setAccessLevels] = useState([]);
  
  // Criar usuário é SEMPRE obrigatório
  const createUser = true;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    CPF: '',
    salary: '',
    role_id: '',
  });
  
  // Dados do usuário (sempre obrigatório)
  const [userData, setUserData] = useState({
    username: '',
    password: '',
    access_level_id: '',
  });

  // Estado para notificações (toast)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Função para mostrar notificação
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Scroll para o topo ao carregar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    loadSelects();
    if (isEdit) {
      loadEmployee();
    }
  }, [id]);

  const loadSelects = async () => {
    try {
      const [rolesRes, accessLevelsRes] = await Promise.all([
        rolesApi.getAll(),
        accessLevelsApi.getAll(),
      ]);
      setRoles(rolesRes.data);
      setAccessLevels(accessLevelsRes.data);
    } catch (error) {
      console.error('Erro ao carregar selects:', error);
      showToast('Erro ao carregar dados', 'error');
    }
  };

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const res = await employeesApi.getById(id);

      // Support backend returning { data: employee, totalSalary, payDay20, payDay5 }
      const payload = res.data?.data ? res.data.data : res.data;

      // Extrair apenas o role_id como inteiro e formatar CPF
      const employeeData = {
        ...payload,
        CPF: formatCPFCNPJ(payload.CPF || ''),
        role_id: payload.role_id || payload.role?.role_id || '',
        salary: payload.salary || ''
      };
      
      // Remover objeto aninhado role
      delete employeeData.role;
      
      setFormData(employeeData);
      
      // Buscar usuário vinculado ao funcionário
      try {
        const userRes = await usersApi.getByEmployeeId(id);
        if (userRes.data) {
          // A API retorna access_levels como array, pegar o primeiro
          const accessLevelId = userRes.data.access_levels && userRes.data.access_levels.length > 0
            ? userRes.data.access_levels[0].access_level_id
            : '';
          
          setUserData({
            username: userRes.data.username || '',
            password: '', // Não mostra senha por segurança
            access_level_id: accessLevelId,
          });
        }
      } catch (error) {
        // Se não encontrar usuário, campos ficam vazios para criar novo
        console.log('Usuário não encontrado, será criado ao salvar');
      }
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
      showToast('Erro ao carregar funcionário', 'error');
      navigate('/admin/funcionarios');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let parsedValue = value;
    
    // Aplicar formatação visual para CPF
    if (name === 'CPF') {
      parsedValue = formatCPFCNPJ(value);
    } else if (name === 'role_id') {
      parsedValue = value === '' ? '' : parseInt(value, 10);
    }
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // VALIDAÇÃO: Se createUser está marcado, todos os campos de usuário são obrigatórios
    if (createUser) {
      if (!userData.username || !userData.access_level_id) {
        showToast('Preencha todos os campos de usuário (username e nível de acesso)', 'error');
        return;
      }
      
      // No modo criação, senha é obrigatória
      if (!isEdit && !userData.password) {
        showToast('A senha é obrigatória ao criar um novo usuário', 'error');
        return;
      }
      
      // Validar tamanho da senha (se preenchida)
      if (userData.password && userData.password.length < 6) {
        showToast('A senha deve ter no mínimo 6 caracteres', 'error');
        return;
      }
    }
    
    try {
      setLoading(true);
      
      // Remover formatação do CPF e garantir que role_id é inteiro e salary é número antes de enviar
      const dataToSend = {
        ...formData,
        CPF: unformatCPFCNPJ(formData.CPF),
        role_id: parseInt(formData.role_id, 10),
        salary: parseFloat(formData.salary)
      };

      // Converter strings vazias para null (para enviar explicitamente null ao backend)
      Object.keys(dataToSend).forEach((key) => {
        const val = dataToSend[key];
        if (typeof val === 'string' && val.trim() === '') {
          dataToSend[key] = null;
        }
      });

      // Para campos numéricos que resultaram em NaN (ex: role_id, salary), removê-los do payload
      if ('role_id' in dataToSend && Number.isNaN(dataToSend.role_id)) delete dataToSend.role_id;
      if ('salary' in dataToSend && Number.isNaN(dataToSend.salary)) delete dataToSend.salary;
      
      if (isEdit) {
        // ========== MODO EDIÇÃO ==========
        
        // Atualizar funcionário
        await employeesApi.update(id, dataToSend);
        
        // Se createUser está marcado, atualizar/criar usuário
        if (createUser && userData.username) {
          try {
            const userRes = await usersApi.getByEmployeeId(id);
            // Usuário já existe, atualizar
            const updateData = {
              username: userData.username,
              accessLevelId: parseInt(userData.access_level_id, 10),
            };
            // Só envia senha se foi preenchida
            if (userData.password) {
              updateData.password = userData.password;
            }
            await usersApi.update(userRes.data.user_id, updateData);
          } catch (error) {
            // Usuário não existe, criar novo
            if (error.response?.status === 404) {
              if (!userData.password) {
                showToast('Senha é obrigatória ao criar um novo usuário', 'error');
                return;
              }
              await usersApi.create({
                username: userData.username,
                password: userData.password,
                employeeId: id,
                accessLevelId: parseInt(userData.access_level_id, 10),
              });
            } else {
              throw error; // Re-lançar erro se não for 404
            }
          }
        }
        
        navigate('/admin/funcionarios', { 
          state: { message: 'Funcionário e usuário atualizados com sucesso!', type: 'success' }
        });
        
      } else {
        // ========== MODO CRIAÇÃO (TRANSAÇÃO ATÔMICA) ==========
        
        let employeeCreated = false;
        let newEmployeeId = null;
        
        try {
          // 1. Criar funcionário primeiro
          const employeeRes = await employeesApi.create(dataToSend);
          newEmployeeId = employeeRes.data.employee_id;
          employeeCreated = true;
          
          // 2. Se createUser está marcado, criar usuário vinculado (OBRIGATÓRIO)
          if (createUser) {
            await usersApi.create({
              username: userData.username,
              password: userData.password,
              employeeId: newEmployeeId,
              accessLevelId: parseInt(userData.access_level_id, 10),
            });
          }
          
          // Sucesso total!
          navigate('/admin/funcionarios', { 
            state: { message: 'Funcionário e usuário criados com sucesso!', type: 'success' }
          });
          
        } catch (userError) {
          // ERRO ao criar usuário - REVERTER criação do funcionário
          if (employeeCreated && newEmployeeId) {
            try {
              await employeesApi.delete(newEmployeeId);
              console.log('Funcionário removido devido a erro ao criar usuário');
            } catch (deleteError) {
              console.error('Erro ao reverter criação do funcionário:', deleteError);
            }
          }
          
          // Lançar erro com mensagem apropriada
          throw new Error(userError.response?.data?.message || 'Erro ao criar usuário. Nenhum dado foi salvo.');
        }
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast(error.message || error.response?.data?.message || 'Erro ao salvar dados', 'error');
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
            onClick={() => navigate('/admin/funcionarios')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar para Funcionários
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Preencha os dados do funcionário
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Funcionário */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Nome completo do funcionário"
              />
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPF *
              </label>
              <input
                type="text"
                name="CPF"
                value={formData.CPF}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            {/* Email (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Endereço (opcional) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>

            {/* Função */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              Função *
              </label>
              <select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecione uma função</option>
                {roles.map(role => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Salário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salário (R$) *
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Seção de Acesso ao Sistema */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="text-indigo-600" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Acesso ao Sistema</h3>
                  <p className="text-xs text-gray-500">Configure credenciais de login (obrigatório)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de Usuário *
                  </label>
                  <input
                    type="text"
                    value={userData.username}
                    onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    required={createUser}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    placeholder="usuario123"
                  />
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha {!isEdit && '*'}
                  </label>
                  <input
                    type="password"
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    required={createUser && !isEdit}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    placeholder={isEdit ? "Deixe vazio para manter" : "••••••••"}
                  />
                  {isEdit && (
                    <p className="text-xs text-gray-500 mt-1">Deixe vazio para não alterar</p>
                  )}
                </div>

                {/* Nível de Acesso */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nível de Acesso *
                  </label>
                  <select
                    value={userData.access_level_id}
                    onChange={(e) => setUserData({ ...userData, access_level_id: e.target.value ? parseInt(e.target.value, 10) : '' })}
                    required={createUser}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="">Selecione</option>
                    {accessLevels.map(level => (
                      <option key={level.access_level_id} value={level.access_level_id}>
                        {level.name || level.level_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/funcionarios')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar Funcionário'}
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
