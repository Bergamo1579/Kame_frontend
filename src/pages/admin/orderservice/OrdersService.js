import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, FileText, X, Calendar, User, ClipboardList, Filter, Truck } from 'lucide-react';
import { ordersServiceApi, budgetApi, freightApi, entriesApi, expensesApi, expenseInstallmentsApi, clientsApi } from '../../../services/api';
import Toast from '../../../components/Toast';

export default function OrdersService() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [freights, setFreights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: '', budget_id: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirm, setConfirm] = useState({ show: false, id: null });

  // Modal para gerenciar fretes
  const [showFreightModal, setShowFreightModal] = useState(false);
  
  // Estados para gerenciamento de fretes
  const [freightForm, setFreightForm] = useState({ name_freight: '', description: '' });
  const [editingFreight, setEditingFreight] = useState(null);
  const [freightLoading, setFreightLoading] = useState(false);
  
  // Estado para modal de confirmação de exclusão de frete
  const [confirmFreightModal, setConfirmFreightModal] = useState({ show: false, freightId: null, freightName: '' });

  // Modal e dados detalhados da OS
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderEntries, setOrderEntries] = useState([]);
  const [orderExpenses, setOrderExpenses] = useState([]);
  const [orderBudget, setOrderBudget] = useState(null);
  const [orderClient, setOrderClient] = useState(null);
  const [orderLoadingDetails, setOrderLoadingDetails] = useState(false);
  const [orderNumberDisplay, setOrderNumberDisplay] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadData();
    
    // Exibir toast de sucesso após criação/edição
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || 'success');
      // Limpar o state para não mostrar novamente
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, orders, filters]);

  // Bloquear scroll quando modais estiverem abertos
  useEffect(() => {
    if (showFreightModal || confirmFreightModal.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFreightModal, confirmFreightModal.show]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, budgetsRes, freightsRes] = await Promise.all([
        ordersServiceApi.getAll(),
        budgetApi.getAll(),
        freightApi.getAll(),
      ]);
      const ordersData = ordersRes.data?.items || ordersRes.data || [];
      const budgetsData = budgetsRes.data?.items || budgetsRes.data || [];
      setOrders(ordersData);
      setBudgets(budgetsData);
      setFreights(freightsRes.data || []);
      setFiltered(ordersData);
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      showToast('Erro ao carregar ordens', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (!searchTerm && !filters.status && !filters.budget_id) return setFiltered(orders);
    
    let result = [...orders];
    
    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o => 
        (o.name_os || '').toLowerCase().includes(term) || 
        (o.description || '').toLowerCase().includes(term) || 
        (o.approved_by || '').toLowerCase().includes(term)
      );
    }
    
    // Filtro de status
    if (filters.status) {
      result = result.filter(o => o.status === filters.status);
    }
    
    // Filtro de orçamento
    if (filters.budget_id) {
      result = result.filter(o => o.budget_id === filters.budget_id);
    }
    
    setFiltered(result);
  };

  const handleEdit = (orderId) => {
    navigate(`/admin/ordens-servico/editar/${orderId}`);
  };

  const handleCreate = () => {
    navigate('/admin/ordens-servico/novo');
  };

  const askDelete = (id) => setConfirm({ show: true, id });
  const cancelDelete = () => setConfirm({ show: false, id: null });

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await ordersServiceApi.delete(confirm.id);
      showToast('Ordem excluída', 'success');
      cancelDelete();
      loadData();
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      showToast('Erro ao excluir ordem', 'error');
      cancelDelete();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const normalizeDateOnly = (value) => {
    if (!value) return null;
    const raw = typeof value === 'string' ? value.trim() : value;
    if (!raw) return null;
    const datePart = raw.includes('T') ? raw.split('T')[0] : raw;
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) return null;
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const computeSum = (items = [], field = 'value') => {
    return items.reduce((s, it) => s + (parseFloat(it[field]) || 0), 0);
  };

  const handleOpenOrderDetail = async (order, index = null) => {
    try {
      // open modal immediately with loading indicator
      setOrderDetail(order);
      // usar o ID sequencial da OS ao invés do índice
      setOrderNumberDisplay(order.id || null);
      setShowOrderModal(true);
      setOrderLoadingDetails(true);
      const res = await ordersServiceApi.getById(order.os_id);
      const full = res.data || order;
      setOrderDetail(full);

      // fetch entries, expenses and expense installments
      const [entriesRes, expensesRes, installmentsRes] = await Promise.all([
        entriesApi.getAll(),
        expensesApi.getAll({ os_id: order.os_id }),
        expenseInstallmentsApi.getAll()
      ]);
      const entriesData = entriesRes.data?.items || entriesRes.data || [];
      const expensesData = expensesRes.data?.items || expensesRes.data || [];
      const installmentsData = installmentsRes.data?.items || installmentsRes.data || [];

      const filteredEntries = entriesData.filter(e => (e.os_id === order.os_id) || (e.orders_service?.os_id === order.os_id));
      
      // Para despesas, precisamos buscar tanto despesas diretas quanto parcelas de despesas vinculadas a esta OS
      const directExpenses = expensesData.filter(e => (e.os_id === order.os_id) || (e.orders_service?.os_id === order.os_id));
      
      // Buscar IDs das despesas desta OS para encontrar suas parcelas
      const expenseIds = directExpenses.map(e => e.expense_id);
      const relatedInstallments = installmentsData.filter(inst => 
        expenseIds.includes(inst.expense_id) || 
        expenseIds.includes(inst.expense?.expense_id)
      );
      
      // Criar array combinado com despesas diretas e parcelas
      // Se a despesa tem parcelas, usamos as parcelas; senão, usamos a despesa direta
      const expensesWithInstallments = directExpenses.map(expense => {
        const installments = relatedInstallments.filter(inst => 
          inst.expense_id === expense.expense_id || 
          inst.expense?.expense_id === expense.expense_id
        );
        return installments.length > 0 ? installments : [expense];
      }).flat();

      setOrderEntries(filteredEntries);
      setOrderExpenses(expensesWithInstallments);

      // budget and client
      let budget = null;
      if (full.budget_id || full.budget?.budget_id) {
        const bId = full.budget_id || full.budget?.budget_id;
        const bRes = await budgetApi.getById(bId);
        budget = bRes.data || null;
        setOrderBudget(budget);

        if (budget && (budget.client_id || budget.client?.client_id)) {
          const cId = budget.client_id || budget.client?.client_id;
          try {
            const cRes = await clientsApi.getById(cId);
            setOrderClient(cRes.data || null);
          } catch (err) {
            setOrderClient(null);
          }
        } else {
          setOrderClient(null);
        }
      } else {
        setOrderBudget(null);
        setOrderClient(null);
      }

      setShowOrderModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes da OS:', error);
      showToast('Erro ao carregar detalhes da ordem', 'error');
    } finally {
      setOrderLoadingDetails(false);
    }
  };

  const handlePrintOperationReport = async () => {
    try {
      // Filtrar apenas OS em andamento
      const ordersInProgress = (filtered.length > 0 ? filtered : orders).filter(o => o.status === 'andamento');
      
      if (ordersInProgress.length === 0) {
        showToast('Nenhuma ordem de serviço em andamento para imprimir', 'error');
        return;
      }
      
      const ordersToProcess = ordersInProgress;

      // Buscar todos os orçamentos
      const allBudgets = await budgetApi.getAll();
      const budgetsData = allBudgets.data?.items || allBudgets.data || [];
      
      // Construir linhas da tabela
      let tableRows = '';
      
      for (const order of ordersToProcess) {
        const budgetId = order.budget_id || order.budget?.budget_id;
        let machines = [];
        let budget = null;
        let client = null;
        
        // Buscar orçamento e cliente
        if (budgetId) {
          budget = budgetsData.find(b => b.budget_id === budgetId);
          if (budget) {
            client = budget.client;
            // Buscar máquinas do orçamento
            try {
              const machinesRes = await budgetApi.listMachines(budgetId);
              machines = machinesRes.data || [];
            } catch (err) {
              console.error('Erro ao buscar máquinas:', err);
            }
          }
        }

        const osName = order?.name_os || '-';
        const clientName = client?.name_client || '-';
        const isMondey = order?.moodle ? 'SIM' : 'NÃO';
        const dateApproved = budget?.date_status_update ? new Date(budget.date_status_update).toLocaleDateString('pt-BR') : '-';

        if (machines.length === 0) {
          // Se não houver máquinas, criar uma linha básica para a OS
          tableRows += `
            <tr>
              <td>${osName}</td>
              <td>${clientName}</td>
              <td>${isMondey}</td>
              <td>${dateApproved}</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td class="checkbox"><div class="check-box"></div></td>
            </tr>
          `;
        } else {
          // Criar uma linha para cada máquina da OS
          machines.forEach((machineItem) => {
            const machineCategory = machineItem.machine?.category?.name || '-';
            const machineName = machineItem.machine?.name || '-';
            const machineDescription = machineItem.machine?.description || '-';
            const quantity = machineItem.quantity || 1;

            tableRows += `
              <tr>
                <td>${osName}</td>
                <td>${clientName}</td>
                <td>${isMondey}</td>
                <td>${dateApproved}</td>
                <td>${machineCategory}</td>
                <td>${machineName}</td>
                <td>${machineDescription}</td>
                <td><strong>${quantity}</strong></td>
                <td class="checkbox"><div class="check-box"></div></td>
              </tr>
            `;
          });
        }
      }

      const win = window.open('', '_blank');
      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Relatório de Operação - Ordens de Serviço</title>
          <style>
            @page { 
              size: landscape;
              margin: 8mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              font-family: 'Calibri', 'Arial', sans-serif;
              font-size: 8pt;
              line-height: 1.2;
              color: #000;
              padding: 10px;
            }
            h1 {
              text-align: center;
              font-size: 14pt;
              margin-bottom: 15px;
              text-transform: uppercase;
              font-weight: bold;
              letter-spacing: 1px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000;
            }
            th {
              background-color: #d9d9d9;
              border: 1px solid #000;
              padding: 4px 6px;
              text-align: center;
              font-size: 7pt;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              border: 1px solid #000;
              padding: 3px 5px;
              text-align: center;
              font-size: 7pt;
              vertical-align: middle;
            }
            td:first-child {
              text-align: left;
              font-weight: 600;
              max-width: 140px;
              word-wrap: break-word;
            }
            td:nth-child(2) {
              text-align: left;
              max-width: 130px;
              word-wrap: break-word;
            }
            td:nth-child(5),
            td:nth-child(6),
            td:nth-child(7) {
              text-align: left;
              max-width: 100px;
              word-wrap: break-word;
            }
            td:nth-child(8) {
              text-align: left;
              max-width: 140px;
              word-wrap: break-word;
              font-size: 6.5pt;
              font-style: italic;
            }
            .checkbox {
              width: 30px;
              padding: 2px;
            }
            .check-box {
              width: 20px;
              height: 20px;
              border: 2px solid #000;
              margin: 0 auto;
              background: #fff;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                padding: 5px;
              }
              @page { 
                size: landscape;
                margin: 8mm;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          <h1>Relatório de Operação</h1>
          <table>
            <thead>
              <tr>
                <th style="width: 16%;">OS</th>
                <th style="width: 16%;">CLIENTE</th>
                <th style="width: 6%;">MP</th>
                <th style="width: 10%;">DATA APROV.</th>
                <th style="width: 12%;">CAT. MÁQ.</th>
                <th style="width: 14%;">MÁQ</th>
                <th style="width: 16%;">DESCRIÇÃO</th>
                <th style="width: 6%;">QNT</th>
                <th style="width: 4%;">✓</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      win.document.write(html);
      win.document.close();
      
      try {
        win.focus();
      } catch (e) {
        // ignore
      }

      // Auto print and close
      try {
        const closeWin = () => {
          try { if (!win.closed) win.close(); } catch (e) { }
        };

        if (typeof win.onafterprint !== 'undefined') {
          win.onafterprint = closeWin;
        }
        try { win.addEventListener && win.addEventListener('afterprint', closeWin); } catch (e) {}

        win.print();

        setTimeout(() => {
          try { if (!win.closed) win.close(); } catch (e) {}
        }, 1500);
      } catch (err) {
        try { win.print(); win.close(); } catch (e) { }
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de operação:', error);
      showToast('Erro ao gerar relatório de operação', 'error');
    }
  };

  const handlePrintOrder = () => {
    if (!orderDetail || orderLoadingDetails) return;
    const totalEntries = computeSum(orderEntries, 'value');
    const totalExpenses = computeSum(orderExpenses, 'value');
    const grossReturn = totalEntries - totalExpenses;

    const orderNumber = orderDetail?.id || orderNumberDisplay || orderDetail?.name_os || '-';

    // helper to insert <br> every N characters (for print description wrapping)
    const chunkText = (text, size) => {
      if (!text) return '';
      const result = [];
      for (let i = 0; i < text.length; i += size) {
        result.push(text.slice(i, i + size));
      }
      return result.join('<br/>');
    };

    const printDescription = orderDetail.description ? chunkText(orderDetail.description, 120) : '';

    const win = window.open('', '_blank');
    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ordem de Serviço - ${orderNumber}</title>
        <style>
          @page { size: A4; margin: 18mm }
          body { font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111; font-size: 12px; }
          header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
          h1 { font-size:18px; margin:0 }
          .muted { color:#6b7280; }
          .meta { margin-top:6px }
          table { width:100%; border-collapse:collapse; margin-top:10px }
          th, td { border:1px solid #e5e7eb; padding:8px 10px; text-align:left }
          th { background:#f3f4f6; font-weight:600; }
          .summary { margin-top:12px; padding:10px; border:1px solid #e5e7eb; background:#fafafa }
          .right { text-align:right }
          .small { font-size:11px; color:#374151 }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>Ordem de Serviço: ${orderNumber}</h1>
            <div class="muted small">ID: ${orderDetail.os_id || '-'}</div>
            <div class="meta small">Cliente: ${orderClient ? orderClient.name_client : '-'} • Orçamento: ${orderBudget ? (orderBudget.budget_number ? `#${orderBudget.budget_number}` : orderBudget.budget_id) : '-'}</div>
          </div>
          <div class="small right">Data: ${orderDetail.date ? new Date(orderDetail.date).toLocaleDateString('pt-BR') : '-'}<br/>Faturamento: ${orderDetail.billing_date ? new Date(orderDetail.billing_date).toLocaleDateString('pt-BR') : '-'}</div>
        </header>

        <section class="summary">
          <div>Total Receitas: <strong>${formatCurrency(totalEntries)}</strong></div>
          <div>Total Despesas: <strong>${formatCurrency(totalExpenses)}</strong></div>
          <div>Status: <strong>${getStatusLabel(orderDetail.status)}</strong></div>
          <div>Faturamento: <strong>${orderDetail.billing_date ? new Date(orderDetail.billing_date).toLocaleDateString('pt-BR') : '-'}</strong></div>
          <div style="margin-top:8px;font-size:14px"><strong>Retorno Bruto: ${formatCurrency(grossReturn)}</strong></div>
        </section>

        ${printDescription ? `<section style="margin-top:12px"><h3 style="margin:4px 0">Descrição</h3><div style="white-space:pre-wrap">${printDescription}</div></section>` : ''}

        <h3 style="margin-top:14px">Receitas</h3>
        <table>
          <thead>
            <tr><th>Descrição</th><th>Conta</th><th>NF</th><th>Data</th><th class="right">Valor</th></tr>
          </thead>
          <tbody>
            ${orderEntries.length === 0 ? `<tr><td colspan="5" class="small muted">Nenhuma receita registrada</td></tr>` : orderEntries.map(e => `<tr><td>${e.company || e.description || '-'}</td><td>${e.account?.name_account || e.account_name || '-'}</td><td>${e.NF || '-'}</td><td>${e.date_faturamento ? new Date(e.date_faturamento).toLocaleDateString('pt-BR') : '-'}</td><td class="right">${formatCurrency(e.value)}</td></tr>`).join('')}
          </tbody>
        </table>

        <h3 style="margin-top:14px">Despesas</h3>
        <table>
          <thead>
            <tr><th>Descrição</th><th>Fornecedor</th><th>Tipo</th><th>Data</th><th class="right">Valor</th></tr>
          </thead>
          <tbody>
            ${orderExpenses.length === 0 ? `<tr><td colspan="5" class="small muted">Nenhuma despesa registrada</td></tr>` : orderExpenses.map(ex => {
              // Verificar se é parcela ou despesa direta
              const isParcela = ex.installment_id !== undefined;
              const description = isParcela 
                ? (ex.expense?.description || ex.description || '-') + (ex.installment_number ? ` (Parcela ${ex.installment_number})` : '')
                : (ex.description || '-');
              const supplier = isParcela 
                ? (ex.expense?.supplier?.name_supplier || ex.supplier?.name_supplier || '-')
                : (ex.supplier?.name_supplier || ex.supplier_name || '-');
              const typePayment = isParcela
                ? (ex.expense?.type_payment?.name || ex.type_payment?.name || '-')
                : (ex.type_payment?.name || ex.type_payment_name || '-');
              const date = isParcela
                ? (ex.payment_date || ex.due_date ? new Date(ex.payment_date || ex.due_date).toLocaleDateString('pt-BR') : '-')
                : (ex.date_expense ? new Date(ex.date_expense).toLocaleDateString('pt-BR') : '-');
              const value = ex.value || 0;
              return `<tr><td>${description}</td><td>${supplier}</td><td>${typePayment}</td><td>${date}</td><td class="right">${formatCurrency(value)}</td></tr>`;
            }).join('')}
          </tbody>
        </table>

      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
    try {
      win.focus();
    } catch (e) {
      // ignore
    }

    // Try to close the print window after the print dialog finishes (works in most browsers)
    try {
      const closeWin = () => {
        try { if (!win.closed) win.close(); } catch (e) { }
      };

      // Modern browsers fire afterprint on the window
      if (typeof win.onafterprint !== 'undefined') {
        win.onafterprint = closeWin;
      }
      // Also attach event listener when available
      try { win.addEventListener && win.addEventListener('afterprint', closeWin); } catch (e) {}

      // Call print (may block in many browsers). If print does not block, afterprint handler will close.
      win.print();

      // Fallback: if after a short delay the window is still open, attempt to close it.
      setTimeout(() => {
        try { if (!win.closed) win.close(); } catch (e) {}
      }, 1500);
    } catch (err) {
      // As a last resort, attempt to close the window after print call
      try { win.print(); win.close(); } catch (e) { }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'finalizado': return 'bg-blue-100 text-blue-700';
      case 'faturado': return 'bg-green-100 text-green-700';
      case 'andamento': return 'bg-blue-100 text-blue-700';
      case 'cancelado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'finalizado': return 'Executado';
      case 'andamento': return 'Em Andamento';
      case 'cancelado': return 'Cancelado';
      case 'faturado': return 'Faturado';
      default: return status || 'Pendente';
    }
  };

  // Estatísticas
  const stats = {
    total: orders.length,
    finalizado: orders.filter(o => o.status === 'finalizado').length,
    faturado: orders.filter(o => o.status === 'faturado' || o.status === 'finalizado').length,
    andamento: orders.filter(o => o.status === 'andamento').length,
    cancelado: orders.filter(o => o.status === 'cancelado').length,
  };

  // Safe helper to get type/name for budgets (used in modal badges)
  const getTypeName = (budget) => {
    if (!budget) return '-';
    return budget?.type?.name_type || budget?.name_type || '-';
  };

  // ====== FUNÇÕES PARA GERENCIAR FRETES ======
  const handleOpenFreightModal = () => {
    setFreightForm({ name_freight: '', description: '' });
    setEditingFreight(null);
    setShowFreightModal(true);
  };

  const handleEditFreight = (freight) => {
    setEditingFreight(freight);
    setFreightForm({
      name_freight: freight.name_freight,
      description: freight.description || ''
    });
  };

  const handleSaveFreight = async (e) => {
    e.preventDefault();
    if (!freightForm.name_freight.trim()) {
      showToast('Por favor, preencha o nome do frete', 'error');
      return;
    }

    try {
      setFreightLoading(true);
      if (editingFreight) {
        await freightApi.update(editingFreight.freight_id, freightForm);
        showToast('Frete atualizado com sucesso!', 'success');
      } else {
        await freightApi.create(freightForm);
        showToast('Frete criado com sucesso!', 'success');
      }
      setFreightForm({ name_freight: '', description: '' });
      setEditingFreight(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar frete:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar frete', 'error');
    } finally {
      setFreightLoading(false);
    }
  };

  const handleDeleteFreight = (freight) => {
    setConfirmFreightModal({
      show: true,
      freightId: freight.freight_id,
      freightName: freight.name_freight
    });
  };

  const confirmDeleteFreight = async () => {
    try {
      setFreightLoading(true);
      await freightApi.delete(confirmFreightModal.freightId);
      showToast('Frete excluído com sucesso!', 'success');
      setConfirmFreightModal({ show: false, freightId: null, freightName: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir frete:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir frete', 'error');
      setConfirmFreightModal({ show: false, freightId: null, freightName: '' });
    } finally {
      setFreightLoading(false);
    }
  };

  const cancelDeleteFreight = () => {
    setConfirmFreightModal({ show: false, freightId: null, freightName: '' });
  };

  const handleCancelFreightEdit = () => {
    setEditingFreight(null);
    setFreightForm({ name_freight: '', description: '' });
  };

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      const currentOrder = orders.find(o => o.os_id === orderId) || {};
      const payload = { ...updates };

      const statusProvided = Object.prototype.hasOwnProperty.call(payload, 'status');
      const billingProvided = Object.prototype.hasOwnProperty.call(payload, 'billing_date');
      const currentBilling = normalizeDateOnly(currentOrder.billing_date);

      if (statusProvided) {
        if (payload.status === 'faturado' || payload.status === 'finalizado') {
          if (!billingProvided) {
            payload.billing_date = currentBilling || getTodayDate();
          }
        } else if ((payload.status === 'andamento' || payload.status === 'cancelado') && !billingProvided) {
          payload.billing_date = null;
        }
      }

      if (billingProvided) {
        const normalized = normalizeDateOnly(payload.billing_date);
        if (normalized) {
          payload.billing_date = normalized;
          if (statusProvided) {
            if (payload.status !== 'faturado' && payload.status !== 'finalizado') {
              payload.status = 'faturado';
            }
          } else {
            const effectiveStatus = currentOrder.status;
            payload.status = effectiveStatus === 'finalizado' ? 'finalizado' : 'faturado';
          }
        } else {
          payload.billing_date = null;
          if (!statusProvided) {
            payload.status = 'andamento';
          } else if (payload.status === 'finalizado' || payload.status === 'faturado') {
            payload.status = 'andamento';
          }
        }
      }

      // Normalize updates: convert empty freight_id to null, remove undefined
      if (Object.prototype.hasOwnProperty.call(payload, 'freight_id')) {
        if (payload.freight_id === '' || payload.freight_id === undefined) payload.freight_id = null;
      }

      // simple update flow (no quick panel state)
      await ordersServiceApi.update(orderId, payload);
      const updated = orders.map(o => {
        if (o.os_id !== orderId) return o;
        const merged = { ...o, ...payload };
        if (payload.billing_date === null) merged.billing_date = null;
        return merged;
      });
      setOrders(updated);
      setFiltered(prev => prev.map(o => {
        if (o.os_id !== orderId) return o;
        const merged = { ...o, ...payload };
        if (payload.billing_date === null) merged.billing_date = null;
        return merged;
      }));
      showToast('Ordem atualizada', 'success');
    } catch (err) {
      console.error('Erro ao atualizar ordem:', err);
      showToast('Erro ao atualizar ordem', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-3 py-4 sm:px-4 md:px-6 max-w-full lg:max-w-7xl lg:mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Ordens de Serviço</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Gerencie as ordens de serviço cadastradas</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handlePrintOperationReport}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
                title="Imprimir Relatório de Operação"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Relatório Operação</span>
              </button>
              <button
                onClick={handleOpenFreightModal}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Truck size={16} />
                <span className="hidden sm:inline">Fretes</span>
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all text-sm"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nova Ordem de Serviço</span>
              </button>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 truncate">Total de OS</p>
                  <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="text-gray-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500">{stats.total} ordens</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-green-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-600 truncate font-medium">Faturadas</p>
                  <p className="text-lg font-bold text-green-600">{stats.faturado}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-green-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-green-600">{stats.faturado} ordens</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-600 truncate font-medium">Finalizadas</p>
                  <p className="text-lg font-bold text-blue-600">{stats.finalizado}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="text-blue-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-blue-600">{stats.finalizado} ordens</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-yellow-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-yellow-600 truncate font-medium">Em Andamento</p>
                  <p className="text-lg font-bold text-yellow-600">{stats.andamento}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="text-yellow-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-yellow-600">{stats.andamento} ordens</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-red-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-600 truncate font-medium">Canceladas</p>
                  <p className="text-lg font-bold text-red-600">{stats.cancelado}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <X className="text-red-600" size={20} />
                </div>
              </div>
              <p className="text-[10px] text-red-600">{stats.cancelado} ordens</p>
            </div>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-3">
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, descrição ou aprovador..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={18} />
              Filtros
            </button>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os status</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="faturado">Faturado</option>
                    <option value="andamento">Em Andamento</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Orçamento</label>
                  <select
                    value={filters.budget_id}
                    onChange={(e) => setFilters({ ...filters, budget_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os orçamentos</option>
                    {budgets.map(b => (
                      <option key={b.budget_id} value={b.budget_id}>
                        {b.budget_number ? `#${b.budget_number}` : b.client?.name_client || 'Orçamento'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="text-gray-600 mt-4">Carregando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 p-12 text-center">
            <ClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 font-medium">Nenhuma ordem de serviço encontrada</p>
          </div>
        ) : (
          <>
            {/* Mobile - Cards */}
            <div className="block md:hidden divide-y divide-gray-200 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              {filtered.map((order, index) => (
                <div key={order.os_id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenOrderDetail(order, index)}>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">{order.id || (index + 1)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{order.name_os || 'Sem nome'}</h3>
                        <p className="text-xs text-gray-500 truncate">{formatDate(order.date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(order.os_id); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); askDelete(order.os_id); }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                    <div className="space-y-2 text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between"><span className="text-gray-500">Faturamento:</span><span className="font-medium text-gray-900">{order.billing_date ? formatDate(order.billing_date) : '-'}</span></div>
                      <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-gray-500">Status:</span>
                        <select
                          value={order.status || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            handleUpdateOrder(order.os_id, { status: v });
                          }}
                          className="px-2 py-1 text-xs rounded border"
                        >
                          <option value="andamento">Em Andamento</option>
                          <option value="finalizado">Executado</option>
                          <option value="faturado">Faturado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                        <span className="text-gray-500">Frete:</span>
                        <select
                          value={order.freight_id || ''}
                          onChange={(e) => { const v = e.target.value || null; handleUpdateOrder(order.os_id, { freight_id: v }); }}
                          className="px-2 py-1 text-xs rounded border"
                        >
                          <option value="">Sem frete</option>
                          {freights.map(f => (
                            <option key={f.freight_id} value={f.freight_id}>{f.name_freight}</option>
                          ))}
                        </select>
                      </div>
                      
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop - Tabela estilo Clientes (table-fixed, sticky header, truncation) */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className={filtered.length > 5 ? "overflow-y-auto" : ""} style={{ maxHeight: filtered.length > 5 ? '480px' : 'none' }}>
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[7%]">Nº</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[26%]">Nome da OS</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[14%]">Orçamento</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[11%]">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[12%]">Faturamento</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[12%]">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[18%]">Frete</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase bg-gray-50 w-[10%]">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((order, index) => (
                      <tr key={order.os_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleOpenOrderDetail(order, index)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold text-xs flex-shrink-0">{order.id || (index + 1)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="ml-3 min-w-0 overflow-hidden">
                            <div className="text-sm font-medium text-gray-900 truncate">{order.name_os || '-'}</div>
                            <div className="text-xs text-gray-500 truncate">{order.budget?.client?.name_client || ''}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 truncate">{order.budget?.budget_number ? `#${order.budget.budget_number}` : '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{formatDate(order.date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{order.billing_date ? formatDate(order.billing_date) : '-'}</td>
                        <td className="px-6 py-4">
                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={order.status || ''}
                              onChange={(e) => { const v = e.target.value; handleUpdateOrder(order.os_id, { status: v }); }}
                              className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status).includes('bg-') ? 'border-transparent' : 'border-gray-200'}`}
                              aria-label="Mudar status"
                            >
                              <option value="andamento">Em Andamento</option>
                              <option value="finalizado">Executado</option>
                              <option value="faturado">Faturado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div onClick={(e) => e.stopPropagation()}>
                            <select
                              value={order.freight_id || ''}
                              onChange={(e) => { const v = e.target.value || null; handleUpdateOrder(order.os_id, { freight_id: v }); }}
                              className={`px-2 py-1 text-xs rounded-full border border-transparent`}
                              aria-label="Selecionar frete"
                            >
                              <option value="">Sem frete</option>
                              {freights.map(f => (
                                <option key={f.freight_id} value={f.freight_id}>{f.name_freight}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(order.os_id); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit size={18} /></button>
                            <button onClick={(e) => { e.stopPropagation(); askDelete(order.os_id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
        )}

        {!loading && filtered.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {filtered.length} de {orders.length} ordens
          </div>
        )}
      </div>

      

      {/* Modal de Confirmação de Exclusão */}
      {confirm.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={cancelDelete}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Ordem de Serviço?</h3>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fretes - Ultra Compacto */}
      {showFreightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header Mini */}
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-purple-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Truck className="text-white" size={16} />
                <h2 className="text-base sm:text-lg font-bold text-white">Fretes</h2>
              </div>
              <button
                onClick={() => {
                  setShowFreightModal(false);
                  handleCancelFreightEdit();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo Scrollável */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 sm:p-4 overflow-y-auto flex-1">
              {/* Formulário Mini */}
              <div>
                <div className="bg-purple-50 rounded-lg p-2.5 sm:p-3 border border-purple-200 sticky top-0">
                  <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    {editingFreight ? <Edit size={14} /> : <Plus size={14} />}
                    {editingFreight ? 'Editar' : 'Novo'}
                  </h3>
                  
                  <form onSubmit={handleSaveFreight} className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={freightForm.name_freight}
                        onChange={(e) => setFreightForm({ ...freightForm, name_freight: e.target.value })}
                        placeholder="Ex: Frete Rodoviário"
                        className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                        disabled={freightLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                        Descrição
                      </label>
                      <textarea
                        value={freightForm.description}
                        onChange={(e) => setFreightForm({ ...freightForm, description: e.target.value })}
                        placeholder="Descreva..."
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-xs border border-purple-200 rounded focus:ring-1 focus:ring-purple-500 resize-none"
                        disabled={freightLoading}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={freightLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1.5 text-xs rounded font-medium transition-all disabled:opacity-50"
                      >
                        {freightLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <>
                            {editingFreight ? <Edit size={12} /> : <Plus size={12} />}
                            {editingFreight ? 'Atualizar' : 'Criar'}
                          </>
                        )}
                      </button>
                      
                      {editingFreight && (
                        <button
                          type="button"
                          onClick={handleCancelFreightEdit}
                          className="px-2.5 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-all"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Lista Ultra Compacta */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Truck className="text-purple-600" size={14} />
                    Lista ({freights.length})
                  </h3>
                </div>

                {freights.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Truck size={32} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-600 font-medium text-xs">Nenhum frete cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[calc(85vh-160px)] overflow-y-auto pr-1">
                    {freights.map((freight) => {
                      const orderCount = orders.filter(o => o?.freight_id === freight.freight_id).length;
                      const isEditing = editingFreight?.freight_id === freight.freight_id;
                      
                      return (
                        <div
                          key={freight.freight_id}
                          className={`bg-white rounded p-2 border transition-all ${
                            isEditing 
                              ? 'border-purple-500 shadow ring-1 ring-purple-200' 
                              : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <h4 className="font-semibold text-gray-900 text-xs truncate">{freight.name_freight}</h4>
                                {isEditing && (
                                  <span className="px-1 py-0.5 bg-purple-600 text-white text-[9px] font-semibold rounded">
                                    Editando
                                  </span>
                                )}
                              </div>
                              
                              {freight.description && (
                                <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">{freight.description}</p>
                              )}
                              
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                <ClipboardList size={10} />
                                {orderCount}
                                {orderCount > 0 && <span className="ml-0.5">🔒</span>}
                              </span>
                            </div>
                            
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => handleEditFreight(freight)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                disabled={freightLoading}
                                title="Editar"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteFreight(freight)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                                disabled={freightLoading || orderCount > 0}
                                title={orderCount > 0 ? "Protegido" : "Excluir"}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Mini */}
            <div className="px-3 py-2 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => {
                  setShowFreightModal(false);
                  handleCancelFreightEdit();
                }}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded text-xs font-medium transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Frete */}
      {confirmFreightModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn" onClick={cancelDeleteFreight}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-5 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Truck className="text-purple-600" size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Frete?</h3>
              
              <p className="text-xs text-gray-600 mb-1">
                Você está prestes a excluir:
              </p>
              <p className="font-semibold text-gray-900 mb-3 line-clamp-2 text-sm">
                {confirmFreightModal.freightName}
              </p>
              
              <p className="text-xs text-red-600 mb-4 flex items-center gap-1">
                <span>⚠️</span>
                Esta ação não pode ser desfeita
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDeleteFreight}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteFreight}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-medium"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Ordem de Serviço */}
      {showOrderModal && orderDetail && (
        <div className="print-container fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white print:block" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden print:max-w-full print:shadow-none print:rounded-none print:max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between print:bg-white print:border-b-2 print:border-blue-600 print:px-3 print:py-2">
              <div className="flex items-center gap-3 print:gap-2">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center print:w-8 print:h-8 print:bg-blue-100">
                  <FileText className="text-white print:text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white print:text-blue-900 print:text-lg">Ordem #{orderDetail.id || orderNumberDisplay || ''}</h2>
                  <p className="text-blue-100 text-sm print:text-gray-600 print:text-xs">ID: {orderDetail.os_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintOrder}
                  disabled={orderLoadingDetails}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white print:hidden"
                  title="Imprimir"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white print:hidden"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] print:p-3 print:overflow-visible print:max-h-full">
              {orderLoadingDetails ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-white"></div>
                  <p className="text-gray-200 mt-4">Carregando detalhes...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-3 flex-wrap print:mb-2 print:gap-2">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 print:px-2 print:text-[10px]">{orderBudget ? getTypeName(orderBudget) : 'Orçamento'}</span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700">{formatCurrency(orderBudget?.value || orderDetail.value)}</span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-50 text-gray-700">{orderDetail.date ? formatDate(orderDetail.date) : '-'}</span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">{orderDetail.billing_date ? formatDate(orderDetail.billing_date) : 'Sem faturamento'}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 print:p-2 print:bg-white">
                      <p className="text-xs font-semibold text-blue-600 uppercase mb-2 print:text-[10px]">Cliente</p>
                      <p className="font-semibold text-gray-900">{orderClient ? orderClient.name_client : '-'}</p>
                      <p className="text-sm text-gray-600 mt-1">{orderClient?.email || ''} • {orderClient?.phone || ''}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 print:p-2 print:bg-white">
                      <p className="text-xs font-semibold text-gray-600 uppercase mb-2 print:text-[10px]">Resumo Financeiro</p>
                      <p className="text-sm text-gray-700">Total Receitas: <strong>{formatCurrency(computeSum(orderEntries, 'value'))}</strong></p>
                      <p className="text-sm text-gray-700">Total Despesas: <strong>{formatCurrency(computeSum(orderExpenses, 'value'))}</strong></p>
                      <p className="mt-2 text-lg font-bold">Retorno Bruto: {formatCurrency(computeSum(orderEntries, 'value') - computeSum(orderExpenses, 'value'))}</p>
                      <div className="mt-3 text-xs text-gray-600">
                        <p><strong>Responsável:</strong> {orderDetail.responsible || orderDetail.employee_name || '-'}</p>
                        <p><strong>Faturamento:</strong> {orderDetail.billing_date ? formatDate(orderDetail.billing_date) : '-'}</p>
                      </div>
                    </div>
                  </div>
                  {orderDetail.description && (
                    <div className="mt-4 bg-white border rounded p-3 print:p-2 w-full">
                      <h4 className="text-sm font-semibold mb-2">Descrição</h4>
                      <div className="text-sm text-gray-800 max-w-full break-words whitespace-pre-wrap overflow-auto" style={{ maxHeight: '40vh' }}>{orderDetail.description}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            <style jsx>{`
              @media print {
                .whitespace-pre-wrap { white-space: pre-wrap !important; word-wrap: break-word !important; overflow-wrap: anywhere !important; }
                table { table-layout: fixed !important; word-break: break-word !important; }
                th, td { white-space: normal !important; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            `}</style>
          </div>
        </div>
      )}

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />
    </div>
  );
}
