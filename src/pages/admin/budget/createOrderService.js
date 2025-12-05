export async function createOrderServiceFromBudget(budget, clients, employees, ordersServiceApi, showToast) {
  try {
    // Buscar nome do cliente
    let clientName = 'Cliente';
    let clientCode = 'CLI';
    let client = null;
    if (budget.client_id || budget.client?.client_id) {
      const cId = budget.client_id || budget.client?.client_id;
      client = clients.find(c => c.client_id === cId) || null;
      if (client?.name_client) {
        clientName = client.name_client;
        clientCode = client.name_client.replace(/\s+/g, '').substring(0, 3).toUpperCase();
      }
    }

    // Buscar nome do funcionário responsável
    let employeeName = 'Sistema';
    if (budget.employee_id || budget.employee?.employee_id) {
      const eId = budget.employee_id || budget.employee?.employee_id;
      const employee = employees.find(e => e.employee_id === eId);
      employeeName = employee?.name || employee?.name_employee || 'Sistema';
    }

    // Pegar o ID numérico do orçamento (não o UUID)
    const budgetNumericId = budget.budget_number || budget.id || '0';

    // Determinar data de aprovação (prefere date_status_update, depois created_at)
    const approvalDateRaw = budget.date_status_update || budget.created_at || new Date().toISOString();
    const approvalDate = new Date(approvalDateRaw);
    const monthAbbr = approvalDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
    const year2 = approvalDate.getFullYear().toString().slice(-2);

    // Client reference (uppercased); fallback to first 3 letters of name if missing
    const clientRef = (client?.reference || clientCode || '').toString().toUpperCase();

    // Gerar código no formato: <clientRef><budgetNumber><MON><YY>
    const osName = `${clientRef}${budgetNumericId}${monthAbbr}${year2}`;

    // Garantir que temos um budget_id
    const budgetId = budget.budget_id || budget.id || budget.id_budget || null;
    if (!budgetId) {
      console.error('createOrderServiceFromBudget: budget_id ausente no orçamento:', budget);
      showToast && showToast('Não foi possível criar OS automática: id do orçamento ausente', 'warning');
      return null;
    }

    const osDescription = budget.description_budget || `OS gerada automaticamente - Cliente: ${clientName}`;

    const osData = {
      name_os: osName,
      budget_id: budgetId,
      date: approvalDate.toISOString().split('T')[0],
      description: osDescription,
    };

    console.log('Tentando criar OS com payload (shared helper):', osData);
    const resp = await ordersServiceApi.create(osData);
    console.log('✅ Ordem de Serviço criada automaticamente (shared helper):', resp?.data || resp);
    showToast && showToast(`Ordem de Serviço ${osName} criada automaticamente!`, 'success');
    return resp?.data;
  } catch (error) {
    console.error('❌ Erro ao criar OS automaticamente (shared helper):', error, error.response?.data || 'no response');
    const errorMsg = error.response?.data?.message || 'Erro desconhecido';
    showToast && showToast(`Orçamento salvo, mas houve erro ao criar OS: ${errorMsg}`, 'warning');
    return null;
  }
}
