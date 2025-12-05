import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ========== AUTH ==========
export const loginRequest = (credentials) => api.post('/auth/login', credentials);
export const getProfile = () => api.get('/auth/profile');

// ========== STATUS GERAL ==========
export const statusGeneralApi = {
  getAll: () => api.get('/status-general'),
  getById: (id) => api.get(`/status-general/${id}`),
  create: (data) => api.post('/status-general', data),
  update: (id, data) => api.patch(`/status-general/${id}`, data),
  delete: (id) => api.delete(`/status-general/${id}`),
};

// ========== SEGMENTOS ==========
export const segmentsApi = {
  getAll: () => api.get('/segments'),
  getById: (id) => api.get(`/segments/${id}`),
  create: (data) => api.post('/segments', data),
  update: (id, data) => api.patch(`/segments/${id}`, data),
  delete: (id) => api.delete(`/segments/${id}`),
};

// ========== CLIENTES ==========
export const clientsApi = {
  // GET /clients - Lista todos com filtros opcionais
  // Exemplos: getAll() | getAll({ status_id: 1 }) | getAll({ name: 'João', cpf_cnpj: '123' })
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status_id) queryParams.append('status_id', params.status_id);
    if (params.segment_id) queryParams.append('segment_id', params.segment_id);
    if (params.name) queryParams.append('name', params.name);
    if (params.cpf_cnpj) queryParams.append('cpf_cnpj', params.cpf_cnpj);
    if (params.phone) queryParams.append('phone', params.phone);
    
    const query = queryParams.toString();
    return api.get(`/clients${query ? `?${query}` : ''}`);
  },
  
  // GET /clients/:id - Busca cliente por UUID
  getById: (id) => api.get(`/clients/${id}`),
  
  // POST /clients - Criar novo cliente
  // Dados esperados: { name_client, email, phone, address, CPF_CNPJ, name_responsible, corporate_name, status_id, segment_id }
  create: (data) => api.post('/clients', data),
  
  // PATCH /clients/:id - Atualizar cliente
  // Atualização parcial - envia apenas os campos que mudaram
  update: (id, data) => api.patch(`/clients/${id}`, data),
  
  // DELETE /clients/:id - Deletar cliente
  delete: (id) => api.delete(`/clients/${id}`),
};

// ========== PAPÉIS/FUNÇÕES ==========
export const rolesApi = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.patch(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

// ========== ADMIN ACCESS - NÍVEIS DE ACESSO ==========
export const accessLevelsApi = {
  getAll: () => api.get('/admin-access/access-levels'),
  getById: (id) => api.get(`/admin-access/access-levels/${id}`),
  create: (data) => api.post('/admin-access/access-levels', data),
  update: (id, data) => api.patch(`/admin-access/access-levels/${id}`, data),
  delete: (id) => api.delete(`/admin-access/access-levels/${id}`),
};

// ========== ADMIN ACCESS - USUÁRIOS ==========
export const usersApi = {
  getAll: () => api.get('/admin-access/users'),
  getById: (id) => api.get(`/admin-access/users/${id}`),
  getByEmployeeId: (employeeId) => api.get(`/admin-access/users/employee/${employeeId}`),
  create: (data) => api.post('/admin-access/users', data),
  update: (id, data) => api.patch(`/admin-access/users/${id}`, data),
  delete: (id) => api.delete(`/admin-access/users/${id}`),
  
  // Gerenciamento de níveis de acesso do usuário
  getUserAccessLevels: (userId) => api.get(`/admin-access/user-access-levels/${userId}`),
  assignAccessLevel: (data) => api.post('/admin-access/user-access-levels', data),
  removeAccessLevel: (userId, accessLevelId) => api.delete(`/admin-access/user-access-levels/${userId}/${accessLevelId}`),
};

// ========== FUNCIONÁRIOS ==========
export const employeesApi = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.patch(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// ========== FÉRIAS ==========
export const vacationsApi = {
  getAll: () => api.get('/vacations'),
  getById: (id) => api.get(`/vacations/${id}`),
  getByEmployee: (employeeId) => api.get(`/vacations/employee/${employeeId}`),
  create: (data) => api.post('/vacations', data),
  update: (id, data) => api.patch(`/vacations/${id}`, data),
  delete: (id) => api.delete(`/vacations/${id}`),
};

// ========== TIPOS DE ORÇAMENTO ==========
export const budgetTypesApi = {
  getAll: () => api.get('/budget-types'),
  getById: (id) => api.get(`/budget-types/${id}`),
  create: (data) => api.post('/budget-types', data),
  update: (id, data) => api.patch(`/budget-types/${id}`, data),
  delete: (id) => api.delete(`/budget-types/${id}`),
};

// ========== FRETES ==========
export const freightApi = {
  getAll: () => api.get('/freight'),
  getById: (id) => api.get(`/freight/${id}`),
  create: (data) => api.post('/freight', data),
  update: (id, data) => api.patch(`/freight/${id}`, data),
  delete: (id) => api.delete(`/freight/${id}`),
};

// ========== STATUS DE ORÇAMENTO ==========
export const statusBudgetApi = {
  getAll: () => api.get('/status-budget'),
  getById: (id) => api.get(`/status-budget/${id}`),
  create: (data) => api.post('/status-budget', data),
  update: (id, data) => api.patch(`/status-budget/${id}`, data),
  delete: (id) => api.delete(`/status-budget/${id}`),
};

// ========== STATUS SUPPLIER (fornecedores) ==========
export const statusSupplierApi = {
  getAll: () => api.get('/status-supplier'),
  getById: (id) => api.get(`/status-supplier/${id}`),
  create: (data) => api.post('/status-supplier', data),
  update: (id, data) => api.patch(`/status-supplier/${id}`, data),
  delete: (id) => api.delete(`/status-supplier/${id}`),
};

// ========== SEGMENTS SUPPLIER (fornecedores) ==========
export const segmentsSupplierApi = {
  getAll: () => api.get('/segments-supplier'),
  getById: (id) => api.get(`/segments-supplier/${id}`),
  create: (data) => api.post('/segments-supplier', data),
  update: (id, data) => api.patch(`/segments-supplier/${id}`, data),
  delete: (id) => api.delete(`/segments-supplier/${id}`),
};

// ========== ORÇAMENTOS ==========
export const budgetApi = {
  getAll: (params) => api.get('/budget', { params }),
  getById: (id) => api.get(`/budget/${id}`),
  create: (data) => api.post('/budget', data),
  update: (id, data) => api.patch(`/budget/${id}`, data),
  delete: (id) => api.delete(`/budget/${id}`),
  listMachines: (id) => api.get(`/budget/${id}/machines`),
  addMachine: (id, data) => api.post(`/budget/${id}/machines`, data),
  updateMachine: (id, budgetMachineId, data) => api.patch(`/budget/${id}/machines/${budgetMachineId}`, data),
  removeMachine: (id, budgetMachineId) => api.delete(`/budget/${id}/machines/${budgetMachineId}`),
};

// ========== ORDENS DE SERVIÇO ==========
export const ordersServiceApi = {
  getAll: (params) => api.get('/orders-service', { params }),
  getById: (id) => api.get(`/orders-service/${id}`),
  create: (data) => api.post('/orders-service', data),
  update: (id, data) => api.patch(`/orders-service/${id}`, data),
  delete: (id) => api.delete(`/orders-service/${id}`),
};

// ========== FORNECEDORES ==========
export const supplierApi = {
  getAll: (params) => api.get('/supplier', { params }),
  getById: (id) => api.get(`/supplier/${id}`),
  create: (data) => api.post('/supplier', data),
  update: (id, data) => api.patch(`/supplier/${id}`, data),
  delete: (id) => api.delete(`/supplier/${id}`),
};

// ========== CATEGORIAS ==========
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ========== SUBCATEGORIAS ==========
export const subCategoriesApi = {
  getAll: () => api.get('/sub-categories'),
  getById: (id) => api.get(`/sub-categories/${id}`),
  create: (data) => api.post('/sub-categories', data),
  update: (id, data) => api.patch(`/sub-categories/${id}`, data),
  delete: (id) => api.delete(`/sub-categories/${id}`),
};

// ========== TIPOS DE PAGAMENTO ==========
export const typePaymentApi = {
  getAll: () => api.get('/type-payment'),
  getById: (id) => api.get(`/type-payment/${id}`),
  create: (data) => api.post('/type-payment', data),
  update: (id, data) => api.patch(`/type-payment/${id}`, data),
  delete: (id) => api.delete(`/type-payment/${id}`),
};

// ========== SITUAÇÕES DE PAGAMENTO ==========
export const paymentSituationApi = {
  getAll: () => api.get('/payment-situation'),
  getById: (id) => api.get(`/payment-situation/${id}`),
  create: (data) => api.post('/payment-situation', data),
  update: (id, data) => api.patch(`/payment-situation/${id}`, data),
  delete: (id) => api.delete(`/payment-situation/${id}`),
};

// ========== CONTAS ==========
export const accountsApi = {
  getAll: () => api.get('/accounts'),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.patch(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  // GET /accounts/summary - server-side computed balances since last turnover
  getSummary: () => api.get('/accounts/summary'),
};

// ========== FINANCIAL DASHBOARD ENDPOINTS ==========
export const financialApi = {
  topCategories: (params = {}) => api.get('/financial/categories/top', { params }),
  topCategoriesAndSubcategories: (params = {}) => api.get('/financial/categories/top3', { params }),
  topOrdersByProfit: (params = {}) => api.get('/financial/orders/top', { params }),
  dailyProfit: (params = {}) => api.get('/financial/daily-profit', { params }),
  budgetApprovalRate: (params = {}) => api.get('/financial/budget/approval-rate', { params }),
  suppliersRanking: (params = {}) => api.get('/financial/suppliers/ranking', { params }),
  paymentsByType: (params = {}) => api.get('/financial/payments/types', { params }),
  topMonthlyExpenses: (params = {}) => api.get('/financial/expenses/top-month', { params }),
  topClientsRevenue: (params = {}) => api.get('/financial/clients/top-revenue', { params }),
  topClientsExpenses: (params = {}) => api.get('/financial/clients/top-expenses', { params }),
  regularizeAccounts: (data) => api.post('/financial/regulation', data),
  controleEfetivo: (params = {}) => api.get('/financial/controle-efetivo', { params }),
  controleEfetivoDetalhes: (params = {}) => api.get('/financial/controle-efetivo/detalhes', { params }),
  resumoAnual: (params = {}) => api.get('/financial/resumo-anual', { params }),
};

// Sales / Views
financialApi.createSalesViews = () => api.post('/financial/sales/create-views');
financialApi.topSalesByQuantity = (params = {}) => api.get('/financial/sales/top-quantity', { params });
financialApi.topProfitCurrentMonth = (params = {}) => api.get('/financial/sales/top-profit', { params });
financialApi.rankingProfit = (params = {}) => api.get('/financial/sales/ranking', { params });

// Accounts due views
financialApi.createAccountsDueViews = () => api.post('/financial/accounts/create-views');
financialApi.contasVencidas = (params = {}) => api.get('/financial/accounts/vencidas', { params });
financialApi.contasAVencer = (params = {}) => api.get('/financial/accounts/a-vencer', { params });
// Receivables
financialApi.recebiveisVencidas = (params = {}) => api.get('/financial/receivables/vencidas', { params });
financialApi.recebiveisAVencer = (params = {}) => api.get('/financial/receivables/a-vencer', { params });

// ========== CARTÕES ==========
export const cardsApi = {
  getAll: () => api.get('/cards'),
  getById: (id) => api.get(`/cards/${id}`),
  create: (data) => api.post('/cards', data),
  update: (id, data) => api.patch(`/cards/${id}`, data),
  delete: (id) => api.delete(`/cards/${id}`),
};

// ========== HISTÓRICO DE CONTA ==========
export const historicAccountApi = {
  getAll: () => api.get('/historic-account'),
  getById: (id) => api.get(`/historic-account/${id}`),
  create: (data) => api.post('/historic-account', data),
  update: (id, data) => api.patch(`/historic-account/${id}`, data),
  delete: (id) => api.delete(`/historic-account/${id}`),
};

// ========== ENTRADAS ==========
export const entriesApi = {
  getAll: () => api.get('/entries'),
  getById: (id) => api.get(`/entries/${id}`),
  create: (data) => api.post('/entries', data),
  update: (id, data) => api.patch(`/entries/${id}`, data),
  delete: (id) => api.delete(`/entries/${id}`),
};

// ========== DESPESAS ==========
export const expensesApi = {
  // GET /expense - Lista todas despesas com filtros opcionais
  // Params: client_id, sub_category_id, type_payment_id, card_id, account_id, supplier_id, os_id, date_expense, means_due_date, offset, limit
  // Retorna: { total: number, items: [...] }
  getAll: (params) => api.get('/expense', { params }),
  
  // GET /expense/:id - Busca despesa por UUID com relacionamentos completos
  getById: (id) => api.get(`/expense/${id}`),
  
  // POST /expense - Criar nova despesa
  // Dados esperados: { description, total_value, date_expense, sub_category_id, type_payment_id, account_id, 
  //                    client_id?, recorrencia?, means_due_date?, payment_date?, NF?, NR?, card_id?, supplier_id?, os_id?,
  //                    installments?: [{ due_date, value, payment_date? }] }
  create: (data) => api.post('/expense', data),
  
  // PATCH /expense/:id - Atualizar despesa
  // Atualização parcial - envia apenas os campos que mudaram
  update: (id, data) => api.patch(`/expense/${id}`, data),
  
  // DELETE /expense/:id - Deletar despesa
  delete: (id) => api.delete(`/expense/${id}`),
  
  // POST /expense/duplicate-recurring - Duplica despesas recorrentes para o próximo mês
  // Retorna: { created: number }
  duplicateRecurring: () => api.post('/expense/duplicate-recurring'),
};

// ========== PARCELAS DE DESPESAS ==========
export const expenseInstallmentsApi = {
  // PATCH /expense-installments/:id - Atualizar parcela de despesa
  // Dados: { payment_date?, value?, due_date? }
  getAll: (params = {}) => api.get('/expense/installments/list', { params }),
  update: (id, data) => api.patch(`/expense-installments/${id}`, data),
};

// ========== PARCELAS DE ENTRADAS (mantido para compatibilidade) ==========
export const installmentsApi = {
  getAll: (params = {}) => api.get('/entries/installments/list', { params }),
  update: (id, data) => api.patch(`/installments/${id}`, data),
};

// ========== MAQUINÁRIO ==========
export const machineCategoryApi = {
  getAll: () => api.get('/machine-category'),
  getById: (id) => api.get(`/machine-category/${id}`),
  create: (data) => api.post('/machine-category', data),
  update: (id, data) => api.patch(`/machine-category/${id}`, data),
  delete: (id) => api.delete(`/machine-category/${id}`),
};

export const machineApi = {
  getAll: () => api.get('/machine'),
  getById: (id) => api.get(`/machine/${id}`),
  create: (data) => api.post('/machine', data),
  update: (id, data) => api.patch(`/machine/${id}`, data),
  delete: (id) => api.delete(`/machine/${id}`),
};

export default api;
