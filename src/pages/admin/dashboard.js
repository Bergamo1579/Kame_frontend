import React, { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { accountsApi, financialApi, expensesApi, entriesApi } from '../../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  AlertCircle,
  CheckCircle,
  Activity,
  Award,
  Zap
} from 'lucide-react';

// Componente de Sparkline Mini
function MiniSparkline({ values = [], color = '#3b82f6', showArea = false }) {
  const points = useMemo(() => {
    if (!values || values.length === 0) return { line: '', area: '' };
    const max = Math.max(...values, 0.01);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const linePoints = values
      .map((v, i) => {
        const x = (i / (values.length - 1 || 1)) * 100;
        const y = 100 - ((v - min) / range) * 80 - 10;
        return `${x},${y}`;
      })
      .join(' ');
    
    const areaPoints = showArea ? `0,100 ${linePoints} 100,100` : '';
    return { line: linePoints, area: areaPoints };
  }, [values, showArea]);

  if (!points.line) return <div className="h-16" />;
  return (
    <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
      {showArea && (
        <polygon 
          fill={`${color}20`} 
          points={points.area}
        />
      )}
      <polyline 
        fill="none" 
        strokeWidth="3" 
        stroke={color} 
        points={points.line} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

// Card de Métrica Principal
function MetricCard({ title, value, icon: IconComponent, trend, trendValue, gradient, sparkData, subtitle, status }) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`}></div>
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center gap-2 mb-3">
            {trend === 'up' ? (
              <div className="flex items-center text-green-600 text-sm font-semibold bg-green-50 px-3 py-1 rounded-full">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>{trendValue}</span>
              </div>
            ) : trend === 'down' ? (
              <div className="flex items-center text-red-600 text-sm font-semibold bg-red-50 px-3 py-1 rounded-full">
                <ArrowDownRight className="w-4 h-4 mr-1" />
                <span>{trendValue}</span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-full">{trendValue}</span>
            )}
          </div>
        )}

        {status && (
          <div className={`flex items-center gap-2 text-sm font-medium mb-3 ${status === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {status === 'positive' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{status === 'positive' ? 'Mês no verde' : 'Mês no vermelho'}</span>
          </div>
        )}
        
        {sparkData && sparkData.length > 0 && (
          <MiniSparkline 
            values={sparkData} 
            color={gradient.includes('green') ? '#10b981' : gradient.includes('blue') ? '#3b82f6' : gradient.includes('purple') ? '#8b5cf6' : '#f59e0b'} 
            showArea 
          />
        )}
      </div>
    </div>
  );
}

// Card de Ranking de Clientes
function ClientRankingCard({ clients, title, type = 'profit' }) {
  const getColor = (index) => {
    const colors = {
      0: 'from-yellow-400 to-orange-500',
      1: 'from-gray-300 to-gray-400',
      2: 'from-orange-400 to-orange-600'
    };
    return colors[index] || 'from-blue-500 to-blue-600';
  };

  const getIcon = (index) => {
    if (index === 0) return <Award className="w-5 h-5" />;
    if (index === 1) return <Award className="w-4 h-4" />;
    if (index === 2) return <Award className="w-4 h-4" />;
    return <span className="text-xs font-bold">{index + 1}</span>;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
          {type === 'profit' ? (
            <TrendingUp className="w-5 h-5 text-white" />
          ) : (
            <TrendingDown className="w-5 h-5 text-white" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      
      <div className="space-y-3">
        {clients && clients.length > 0 ? clients.map((client, idx) => {
          const value = Number(client.total_profit || client.total_revenue || 0);
          const maxValue = Math.max(...clients.map(c => Number(c.total_profit || c.total_revenue || 0)), 1);
          const percentage = (value / maxValue) * 100;
          
          return (
            <div key={idx} className="group">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getColor(idx)} flex items-center justify-center text-white shadow-md`}>
                  {getIcon(idx)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {client.client_name || client.name || 'Cliente Anônimo'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {client.total_orders || 0} pedidos
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${type === 'profit' ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getColor(idx)} transition-all duration-700 ease-out`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Card de Conversão de OS
function ConversionCard({ conversionData }) {
  const total = Number(conversionData?.total_os || 0);
  const converted = Number(conversionData?.converted_os || 0);
  const rate = total > 0 ? ((converted / total) * 100) : 0;
  
  const getStatus = () => {
    if (rate >= 80) return { color: 'text-green-600', bg: 'bg-green-50', label: 'Excelente' };
    if (rate >= 60) return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Bom' };
    if (rate >= 40) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Regular' };
    return { color: 'text-red-600', bg: 'bg-red-50', label: 'Atenção' };
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Conversão de OS</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
          {status.label}
        </div>
      </div>

      <div className="relative">
        <div className="flex items-end justify-center mb-4">
          <span className="text-6xl font-bold text-gray-900">{rate.toFixed(1)}</span>
          <span className="text-2xl font-semibold text-gray-500 mb-2">%</span>
        </div>

        {/* Barra de progresso circular */}
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-1000 ease-out`}
            style={{ width: `${rate}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total de OS</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
            <p className="text-xs text-green-600 mb-1">Convertidas</p>
            <p className="text-2xl font-bold text-green-600">{converted}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Gráfico de Barras Mensal
function MonthlyBarChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <BarChart3 className="w-16 h-16 opacity-30" />
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.abs(Number(d.value || 0))), 1);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, idx) => {
          const value = Number(item.value || 0);
          const percentage = (Math.abs(value) / maxValue) * 100;
          const isPositive = value >= 0;

          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{item.month}</span>
                <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${
                    isPositive 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : 'bg-gradient-to-r from-red-500 to-rose-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser } = useContext(AuthContext);
  const userName = currentUser?.name || currentUser?.employee?.name || currentUser?.username || 'Usuário';

  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [dailyProfit, setDailyProfit] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        // Buscar dados reais das APIs
        const [expensesRes, entriesRes, accountsRes, profitRes] = await Promise.all([
          expensesApi.getAll().catch(() => ({ data: [] })),
          entriesApi.getAll().catch(() => ({ data: [] })),
          accountsApi.getAll().catch(() => ({ data: [] })),
          financialApi.dailyProfit?.({ days: 30 }).catch(() => ({ data: [] })),
        ]);

        if (!mounted) return;

        const expensesData = expensesRes.data?.items || expensesRes.data || [];
        const entriesData = entriesRes.data?.items || entriesRes.data || [];
        const accountsData = accountsRes.data || [];
        const dailyData = profitRes.data || [];

        setExpenses(expensesData);
        setEntries(entriesData);
        setAccounts(accountsData);
        setDailyProfit(dailyData);

      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => { mounted = false; };
  }, []);

  // Função auxiliar para verificar se está vencido
  const isOverdue = (dueDate, paymentDate) => {
    if (paymentDate) return false; // Já pago
    if (!dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    return due < today;
  };

  const stats = useMemo(() => {
    // Saldo total das contas
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.valor_atual || acc.value_start || 0), 0);

    // Despesas vencidas (contas a pagar vencidas)
    const overdueExpenses = expenses.filter(exp => 
      isOverdue(exp.means_due_date, exp.payment_date)
    );
    const overdueExpensesValue = overdueExpenses.reduce((sum, exp) => sum + Number(exp.value || 0), 0);

    // Entradas vencidas (contas a receber vencidas)
    const overdueEntries = entries.filter(entry => 
      isOverdue(entry.due_date, entry.date_payment)
    );
    const overdueEntriesValue = overdueEntries.reduce((sum, entry) => sum + Number(entry.value || 0), 0);

    // Despesas totais
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.value || 0), 0);

    // Entradas totais
    const totalEntries = entries.reduce((sum, entry) => sum + Number(entry.value || 0), 0);

    // Lucro do mês atual (receitas - despesas)
    const currentMonth = new Date();
    const monthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date_expense);
      return expDate.getMonth() === currentMonth.getMonth() && 
             expDate.getFullYear() === currentMonth.getFullYear();
    }).reduce((sum, exp) => sum + Number(exp.value || 0), 0);

    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date_faturamento);
      return entryDate.getMonth() === currentMonth.getMonth() && 
             entryDate.getFullYear() === currentMonth.getFullYear();
    }).reduce((sum, entry) => sum + Number(entry.value || 0), 0);

    const currentMonthProfit = monthEntries - monthExpenses;

    // Lucro médio diário
    const dailyValues = dailyProfit.map(d => Number(d.profit || 0));
    const avgDaily = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;

    // Taxa de conversão de OS (simulada - você pode ajustar conforme necessário)
    const totalOS = entries.length; // Assumindo que cada entrada vem de uma OS
    const convertedOS = entries.filter(e => e.date_payment).length;

    return {
      totalBalance,
      overdueExpensesCount: overdueExpenses.length,
      overdueExpensesValue,
      overdueEntriesCount: overdueEntries.length,
      overdueEntriesValue,
      totalExpenses,
      totalEntries,
      currentMonthProfit,
      currentMonthStatus: currentMonthProfit >= 0 ? 'positive' : 'negative',
      avgDaily,
      dailyValues,
      totalOS,
      convertedOS,
      conversionRate: totalOS > 0 ? (convertedOS / totalOS) * 100 : 0
    };
  }, [expenses, entries, accounts, dailyProfit]);

  // Ranking de clientes por lucro (Top 5)
  const topClients = useMemo(() => {
    const clientMap = new Map();
    
    entries.forEach(entry => {
      const clientName = entry.company || entry.client?.name || 'Sem nome';
      const clientId = entry.client?.client_id || entry.company;
      
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          client_id: clientId,
          client_name: clientName,
          total_profit: 0,
          total_orders: 0
        });
      }
      
      const client = clientMap.get(clientId);
      client.total_profit += Number(entry.value || 0);
      client.total_orders += 1;
    });

    return Array.from(clientMap.values())
      .sort((a, b) => b.total_profit - a.total_profit)
      .slice(0, 5);
  }, [entries]);

  // Clientes com menor retorno (Bottom 5)
  const lowClients = useMemo(() => {
    const clientMap = new Map();
    
    entries.forEach(entry => {
      const clientName = entry.company || entry.client?.name || 'Sem nome';
      const clientId = entry.client?.client_id || entry.company;
      
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          client_id: clientId,
          client_name: clientName,
          total_profit: 0,
          total_orders: 0
        });
      }
      
      const client = clientMap.get(clientId);
      client.total_profit += Number(entry.value || 0);
      client.total_orders += 1;
    });

    return Array.from(clientMap.values())
      .sort((a, b) => a.total_profit - b.total_profit)
      .slice(0, 5);
  }, [entries]);

  // Dados mensais (últimos 6 meses)
  const monthlyProfit = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date_expense);
        return expDate.getMonth() === month && expDate.getFullYear() === year;
      }).reduce((sum, exp) => sum + Number(exp.value || 0), 0);

      const monthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date_faturamento);
        return entryDate.getMonth() === month && entryDate.getFullYear() === year;
      }).reduce((sum, entry) => sum + Number(entry.value || 0), 0);

      months.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        value: monthEntries - monthExpenses
      });
    }
    
    return months;
  }, [expenses, entries]);

  const conversionStats = {
    total_os: stats.totalOS,
    converted_os: stats.convertedOS
  };

  const currentMonthStatus = {
    value: stats.currentMonthProfit,
    status: stats.currentMonthStatus
  };

  const formatCurrency = (value) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-700 text-xl font-semibold">Carregando painel...</p>
          <p className="text-gray-500 text-sm mt-2">Preparando suas métricas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                Dashboard Executivo
              </h1>
              <p className="text-gray-600">
                Olá, <span className="font-semibold text-gray-900">{userName}</span> 
                <span className="mx-2">•</span>
                <span className="text-sm">{new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-white hover:bg-gray-50 transition-all text-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium shadow-md hover:shadow-lg flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Período
              </button>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Métricas Principais - AGORA COM 6 CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Saldo Total"
              value={formatCurrency(stats.totalBalance)}
              icon={DollarSign}
              gradient="from-blue-500 to-blue-600"
              subtitle={`${accounts.length} conta${accounts.length !== 1 ? 's' : ''}`}
              sparkData={accounts.map(a => Number(a.valor_atual || a.value_start || 0))}
            />
            
            <MetricCard
              title="Saldo do Mês"
              value={formatCurrency(currentMonthStatus.value)}
              icon={TrendingUp}
              gradient="from-green-500 to-emerald-600"
              status={currentMonthStatus.status}
              trend={currentMonthStatus.status === 'positive' ? 'up' : 'down'}
              trendValue={currentMonthStatus.status === 'positive' ? 'Positivo' : 'Negativo'}
              sparkData={stats.dailyValues}
            />

            <MetricCard
              title="Média Diária"
              value={formatCurrency(stats.avgDaily)}
              icon={Activity}
              gradient="from-orange-500 to-red-600"
              trend={stats.avgDaily >= 0 ? 'up' : 'down'}
              trendValue={`${dailyProfit.length} dias`}
              sparkData={stats.dailyValues}
            />

            {/* NOVO CARD: Contas a Pagar Vencidas */}
            <MetricCard
              title="Contas a Pagar Vencidas"
              value={formatCurrency(stats.overdueExpensesValue)}
              icon={AlertCircle}
              gradient="from-red-500 to-rose-600"
              subtitle={`${stats.overdueExpensesCount} despesa${stats.overdueExpensesCount !== 1 ? 's' : ''} vencida${stats.overdueExpensesCount !== 1 ? 's' : ''}`}
              trend="down"
              trendValue="Atenção necessária"
            />

            {/* NOVO CARD: Contas a Receber Vencidas */}
            <MetricCard
              title="Contas a Receber Vencidas"
              value={formatCurrency(stats.overdueEntriesValue)}
              icon={AlertCircle}
              gradient="from-yellow-500 to-orange-600"
              subtitle={`${stats.overdueEntriesCount} entrada${stats.overdueEntriesCount !== 1 ? 's' : ''} vencida${stats.overdueEntriesCount !== 1 ? 's' : ''}`}
              trend="down"
              trendValue="Cobrança pendente"
            />

            <MetricCard
              title="Top Clientes"
              value={formatCurrency(topClients.reduce((sum, c) => sum + c.total_profit, 0))}
              icon={Award}
              gradient="from-purple-500 to-pink-600"
              subtitle={`${topClients.length} cliente${topClients.length !== 1 ? 's' : ''} principais`}
              sparkData={topClients.map(c => c.total_profit)}
            />
          </div>

          {/* Conversão e Gráfico Mensal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ConversionCard conversionData={conversionStats} />
            <div className="lg:col-span-2">
              <MonthlyBarChart 
                data={monthlyProfit} 
                title="Resultado Financeiro Mensal"
              />
            </div>
          </div>

          {/* Rankings de Clientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClientRankingCard 
              clients={topClients}
              title="Clientes Mais Lucrativos"
              type="profit"
            />
            <ClientRankingCard 
              clients={lowClients}
              title="Clientes com Menor Retorno"
              type="loss"
            />
          </div>

          {/* Footer Info */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Dados em Tempo Real</h3>
                  <p className="text-sm text-blue-100">Atualizado automaticamente a cada 5 minutos</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-sm text-blue-100">Última atualização</p>
                <p className="text-lg font-semibold">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
