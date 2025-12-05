import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/login';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/dashboard';
import ControleEfetivo from './pages/admin/dashboard/ControleEfetivo';
import ResumoAnual from './pages/admin/dashboard/ResumoAnual';
import Clientes from './pages/admin/client/Clientes';
import ClienteForm from './pages/admin/client/ClienteForm';
import Funcionarios from './pages/admin/employess/Funcionarios';
import FuncionarioForm from './pages/admin/employess/FuncionarioForm';
import Fornecedores from './pages/admin/suppliers/Fornecedores';
import FornecedorForm from './pages/admin/suppliers/FornecedorForm';
import Despesas from './pages/admin/expense/Despesas';
import Entradas from './pages/admin/entries/Entradas';
import Orcamentos from './pages/admin/budget/Orcamentos';
import OrcamentoForm from './pages/admin/budget/OrcamentoForm';
import FeriasGerenciamento from './pages/admin/employess/FeriasGerenciamento';
import OrdersService from './pages/admin/orderservice/OrdersService';
import OrdersServiceForm from './pages/admin/orderservice/OrdersServiceForm';
import Categories from './pages/admin/categories/Categories';
import Financial from './pages/admin/financial/Financial';
import Machines from './pages/admin/machines/Machines';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/controle-efetivo" element={<ControleEfetivo />} />
            <Route path="dashboard/resumo-anual" element={<ResumoAnual />} />
            
            {/* Clientes */}
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/novo" element={<ClienteForm />} />
            <Route path="clientes/editar/:id" element={<ClienteForm />} />
            
            {/* Funcionários */}
            <Route path="funcionarios" element={<Funcionarios />} />
            <Route path="funcionarios/novo" element={<FuncionarioForm />} />
            <Route path="funcionarios/editar/:id" element={<FuncionarioForm />} />
            <Route path="funcionarios/:id/ferias" element={<FeriasGerenciamento />} />
            
            {/* Fornecedores */}
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="fornecedores/novo" element={<FornecedorForm />} />
            <Route path="fornecedores/editar/:id" element={<FornecedorForm />} />
                      
            {/* Despesas */}
            <Route path="despesas" element={<Despesas />} />
            
            {/* Entradas */}
            <Route path="entradas" element={<Entradas />} />
            
            {/* Orçamentos */}
            <Route path="orcamentos" element={<Orcamentos />} />
            <Route path="orcamentos/novo" element={<OrcamentoForm />} />
            <Route path="orcamentos/editar/:id" element={<OrcamentoForm />} />
            
            {/* Ordens de Serviço */}
            <Route path="ordens-servico" element={<OrdersService />} />
            <Route path="ordens-servico/novo" element={<OrdersServiceForm />} />
            <Route path="ordens-servico/editar/:id" element={<OrdersServiceForm />} />
            
            {/* Categorias */}
            <Route path="categorias" element={<Categories />} />

            {/* Maquinário */}
            <Route path="maquinas" element={<Machines />} />
            
            {/* Financeiro */}
            <Route path="financeiro" element={<Financial />} />
          </Route>
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
