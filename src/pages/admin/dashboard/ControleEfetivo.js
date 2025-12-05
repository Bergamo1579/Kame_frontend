import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsApi, financialApi } from '../../../services/api';

function generateDaysOfYear(year) {
  const days = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const subtleBorder = '1px solid rgba(148, 163, 184, 0.18)';

// Componente Tooltip com detalhes específicos por tipo
const DetailedValueTooltip = ({ date, accountId, type, children, onClick }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [details, setDetails] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  const loadDetails = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await financialApi.controleEfetivoDetalhes({
        date: date,
        account_id: accountId === 'all' ? 'all' : accountId
      });
      const data = res.data || [];
      setDetails(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setDetails([]);
    } finally {
      setLoading(false);
    }
  }, [date, accountId]);
  
  React.useEffect(() => {
    if (showTooltip && details.length === 0) {
      loadDetails();
    }
  }, [showTooltip, details.length, loadDetails]);
  
  // Filtrar detalhes por tipo
  const filteredDetails = React.useMemo(() => {
    if (!details || details.length === 0) return [];
    
    return details.filter(item => {
      const categoria = item.categoria?.toLowerCase() || '';
      const tipoItem = item.tipo?.toLowerCase() || '';
      
      switch(type) {
        case 'despesas':
          return tipoItem.includes('despesa') && !categoria.includes('custo') && !categoria.includes('imprevisto');
        case 'fixo':
          return categoria.includes('custo');
        case 'Imprev.':
          return categoria.includes('imprevisto');
        case 'entradas':
          return tipoItem.includes('entrada') && !categoria.includes('regulamentação') && !categoria.includes('regulamentacao');
        case 'entradaReg':
          return categoria.includes('regulamentação') || categoria.includes('regulamentacao');
        default:
          return false;
      }
    });
  }, [details, type]);
  
  const bgColor = type === 'entradas' || type === 'entradaReg' ? 'bg-emerald-600' : 'bg-rose-600';
  const hasItems = filteredDetails.length > 0;
  
  return (
    <div className="relative inline-block">
      <div 
        className={hasItems ? 'cursor-pointer' : ''}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
      >
        {children}
      </div>
      
      {showTooltip && hasItems && (
        <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 ${bgColor} text-white text-[9px] rounded shadow-lg pointer-events-none animate-in fade-in duration-150 min-w-[160px] max-w-[220px]`}>
          <div className="p-1.5 space-y-0 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="text-center py-1 text-white/70">Carregando...</div>
            ) : (
              filteredDetails.map((item, idx) => (
                <div key={idx} className="px-1 py-0.5 border-b border-white/10 last:border-0">
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <span className="truncate flex-1 text-white/90">
                      {item.cliente || item.fornecedor || 'Sem cliente'}
                    </span>
                    {item.parcela && item.parcela !== '-' && (
                      <span className="text-white/60 text-[8px] whitespace-nowrap">{item.parcela}</span>
                    )}
                    <span className="font-semibold whitespace-nowrap">R$ {formatCurrency(item.valor)}</span>
                  </div>
                  <div className="text-[8px] text-white/70 truncate mt-0.5">
                    {item.categoria}{item.subcategoria ? ` • ${item.subcategoria}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: type === 'entradas' || type === 'entradaReg' ? '4px solid #059669' : '4px solid #dc2626',
              marginTop: '-4px'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Componente Tooltip reutilizável
const ValueTooltip = ({ label, value, type = 'neutral', items = [], children }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  const bgColors = {
    despesa: 'bg-rose-600',
    entrada: 'bg-emerald-600',
    neutral: 'bg-slate-700',
    sobra: 'bg-blue-600',
  };
  
  const textColors = {
    despesa: 'text-rose-600',
    entrada: 'text-emerald-600',
    neutral: 'text-slate-700',
    sobra: 'text-blue-600',
  };
  
  return (
    <div className="relative inline-block group">
      <div 
        className="cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      
      {showTooltip && (
        <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 ${bgColors[type]} text-white text-xs rounded-lg whitespace-nowrap shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-200`}>
          <div className="px-3 py-2">
            <div className="font-semibold">{label}</div>
            <div className="text-white/90 text-[11px] mt-0.5">{value}</div>
            {items && items.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/20 space-y-1 max-h-48 overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={idx} className="text-[10px] text-white/80 flex justify-between gap-3">
                    <span className="truncate max-w-[200px]">{item.descricao || item.categoria}</span>
                    <span className="font-mono whitespace-nowrap">R$ {formatCurrency(item.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-${bgColors[type].replace('bg-', '')} -mt-0.5`}
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `4px solid ${type === 'despesa' ? '#dc2626' : type === 'entrada' ? '#059669' : type === 'sobra' ? '#2563eb' : '#475569'}`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Componente para mostrar detalhes do dia em tooltip
const DayDetailsTooltip = ({ date, accountId, hasMovement, children }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [details, setDetails] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  
  const loadDetails = React.useCallback(async () => {
      setLoading(true);
      try {
        const res = await financialApi.controleEfetivoDetalhes({
          date: date,
          account_id: accountId === 'all' ? 'all' : accountId
        });
        const data = res.data || [];
        setDetails(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err);
        setDetails([]);
      } finally {
        setLoading(false);
      }
    }, [date, accountId]);
  
  React.useEffect(() => {
    if (showTooltip && hasMovement && details.length === 0) {
      loadDetails();
    }
  }, [showTooltip, hasMovement, details.length, loadDetails]);
  
  return (
    <div className="relative inline-block">
      <div 
        className={hasMovement ? 'cursor-pointer' : ''}
        onMouseEnter={() => hasMovement && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      
      {showTooltip && hasMovement && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs rounded-lg shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 max-w-xs">
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-slate-400">
                <svg className="animate-spin h-4 w-4 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : details.length === 0 ? (
              <div className="text-slate-400 text-center py-2">Nenhuma movimentação</div>
            ) : (
              details.map((item, idx) => {
                const isDespesa = item.tipo.toLowerCase().includes('despesa');
                const isParcelado = item.parcela && item.parcela !== '-';
                
                return (
                  <div key={idx} className={`border-l-2 pl-2 py-1 ${isDespesa ? 'border-rose-500' : 'border-emerald-500'}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-semibold text-[10px] ${isDespesa ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.categoria}
                      </span>
                      <span className={`font-bold ${isDespesa ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isDespesa ? '−' : '+'} R$ {formatCurrency(item.valor)}
                      </span>
                    </div>
                    
                    {item.subcategoria && (
                      <div className="text-[9px] text-slate-400 mb-0.5">
                        📁 {item.subcategoria}
                      </div>
                    )}
                    
                    <div className="text-[9px] text-slate-300 truncate">
                      {item.cliente || item.fornecedor ? (
                        <>👤 {item.cliente || item.fornecedor}</>
                      ) : (
                        <>📍 Não informado</>
                      )}
                    </div>
                    
                    {isParcelado && (
                      <div className="text-[9px] text-blue-400 mt-0.5">
                        📋 Parcela {item.parcela}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Arrow */}
          <div 
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid #111827',
              marginTop: '-4px'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default function ControleEfetivo() {
  const now = new Date();
  const navigate = useNavigate();
  const [year, setYear] = useState(now.getFullYear());
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState(() => {
    // Recuperar última conta selecionada do localStorage
    return localStorage.getItem('controleEfetivo_lastAccount') || 'all';
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [openMonthInfo, setOpenMonthInfo] = useState(null);

  // Carregar contas ao montar o componente
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await accountsApi.getAll();
        const data = res.data || [];
        const list = Array.isArray(data) ? data : [];
        setAccounts(list);
        
        // Se não houver conta salva e houver contas, selecionar a primeira
        const savedAccount = localStorage.getItem('controleEfetivo_lastAccount');
        if (!savedAccount && list.length > 0) {
          setAccountId(list[0].account_id);
        }
      } catch (err) {
        console.error('Erro ao carregar contas:', err);
        setAccounts([]);
      }
    };
    loadAccounts();
  }, []);

  // Função para buscar dados do controle efetivo
  const loadControleEfetivo = React.useCallback(async () => {
    setLoading(true);
    try {
      console.log('Buscando dados:', { year: String(year), account_id: accountId });
      const res = await financialApi.controleEfetivo({ 
        year: String(year), 
        account_id: accountId === 'all' ? 'all' : accountId 
      });
      
      console.log('Resposta da API:', res.data);
      const data = res.data || [];
      
      // Os dados já vêm no formato correto da API
      const formatted = (Array.isArray(data) ? data : []).map(item => {
        // Garantir que a data está no formato YYYY-MM-DD
        const dateStr = item.date;
        const dateParts = dateStr.split('T')[0]; // Remove timestamp se houver
        
        return {
          date: dateParts,
          account_id: item.account_id,
          despesas_gerais: Number(item.despesas_gerais || 0),
          custo_fixo: Number(item.custo_fixo || 0),
          imprevisto: Number(item.imprevisto || 0),
          entradas: Number(item.entradas || 0),
          entrada_regulamentacao: Number(item.entrada_regulamentacao || 0),
          sobra: Number(item.sobra || 0),
          sobra_total: Number(item.sobra_total || 0),
        };
      });

      console.log('Dados formatados:', formatted.length, 'registros');
      console.log('Primeiros 5 registros:', formatted.slice(0, 5));
      setEntries(formatted);
    } catch (err) {
      console.error('Erro ao carregar dados do controle efetivo:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [year, accountId]);

  // Carregar dados automaticamente quando ano ou conta mudar
  useEffect(() => {
    if (accountId) {
      loadControleEfetivo();
      // Salvar última conta selecionada
      localStorage.setItem('controleEfetivo_lastAccount', accountId);
    }
  }, [year, accountId, loadControleEfetivo]);

  const tableRef = useRef(null);
  const clickTimeoutRef = useRef(null);

  const days = useMemo(() => generateDaysOfYear(year), [year]);

  const todayKey = useMemo(() => {
    const t = new Date();

    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  // Filtered entries by selected account - Não precisa mais filtrar aqui, API já filtra
  const filteredEntries = useMemo(() => {
    console.log('Total entries:', entries.length);
    return entries;
  }, [entries]);

  // Map entries by date for quick lookup
  const entriesByDate = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach(e => {
      if (e.date) {
        map.set(e.date, e);
      }
    });
    console.log('Mapa de datas criado:', map.size, 'entradas');
    console.log('Primeiras 5 chaves do mapa:', Array.from(map.keys()).slice(0, 5));
    return map;
  }, [filteredEntries]);

  // Cumulative calculation across days - agora usa dados da API que já incluem sobra e sobra_total
  const rows = useMemo(() => {
    const result = [];
    for (const d of days) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const e = entriesByDate.get(key) || {};

      const despesas = Number(e.despesas_gerais || 0);
      const fixo = Number(e.custo_fixo || 0);
      const imprev = Number(e.imprevisto || 0);
      const entradasVal = Number(e.entradas || 0);
      const entradaReg = Number(e.entrada_regulamentacao || 0);
      
      // Agora sobra e sobra_total já vêm calculados da API
      const sobra = Number(e.sobra || 0);
      const cumulativeTotal = Number(e.sobra_total || 0);

      result.push({
        date: key,
        display: `${dd}/${mm}`,
        month: d.getMonth(),
        despesas,
        fixo,
        imprev,
        entradas: entradasVal,
        entradaReg,
        sobra,
        cumulativeTotal,
      });
    }
    
    // Log para debug dos primeiros 5 dias
    console.log('Primeiros 5 dias processados:', result.slice(0, 5));
    const diasComDados = result.filter(r => r.despesas > 0 || r.entradas > 0 || r.fixo > 0 || r.imprev > 0);
    console.log('Dias com dados:', diasComDados.length);
    
    return result;
  }, [entriesByDate, days]);

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const goToToday = () => {
    if (!tableRef.current) return;
    const row = tableRef.current.querySelector('[data-date="' + todayKey + '"]');
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // add a quick pulse effect
      row.classList.add('ring', 'ring-4', 'ring-yellow-300');
      setTimeout(() => row.classList.remove('ring', 'ring-4', 'ring-yellow-300'), 1500);
      const t = new Date();
      setSelectedMonth(t.getMonth());
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => setSelectedMonth(null), 700);
    }
  };

  const goToMonth = (monthIndex) => {
    if (!tableRef.current) return;
    const row = tableRef.current.querySelector(`[data-month-start="${monthIndex}"]`) || tableRef.current.querySelector(`[data-month="${monthIndex}"]`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('ring', 'ring-4', 'ring-indigo-200');
      setTimeout(() => row.classList.remove('ring', 'ring-4', 'ring-indigo-200'), 1500);
      setSelectedMonth(monthIndex);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => setSelectedMonth(null), 700);
    }
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  const goToTop = () => {
    if (tableRef.current) {
      tableRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  };

  // Build display rows with month separator rows interleaved
  const displayRows = useMemo(() => {
    const out = [];
    let lastMonth = -1;
    for (const r of rows) {
      if (r.month !== lastMonth) {
        out.push({ type: 'month', month: r.month, monthName: monthNames[r.month] });
        lastMonth = r.month;
      }
      const isMonthStart = r.date.endsWith('-01');
      out.push({ type: 'day', ...r, isMonthStart });
    }
    return out;
  }, [rows, monthNames]);

  // Aggregate per month
  const monthTotals = useMemo(() => {
    const m = {};
    rows.forEach(r => {
      const k = r.month;
      if (!m[k]) m[k] = { despesas: 0, entradas: 0, sobra: 0, sobra_total_ultimo_dia: 0 };
      // despesas gerais is despesas + fixo + imprev
      m[k].despesas += (Number(r.despesas) || 0) + (Number(r.fixo) || 0) + (Number(r.imprev) || 0);
      m[k].entradas += (Number(r.entradas) || 0) + (Number(r.entradaReg) || 0);
      // Guardar a sobra total do último dia do mês
      m[k].sobra_total_ultimo_dia = Number(r.cumulativeTotal) || 0;
    });
    // compute sobra como a diferença do mês
    Object.keys(m).forEach(k => {
      m[k].sobra = m[k].entradas - m[k].despesas;
    });
    return m;
  }, [rows]);

  // Render a small per-day bar chart for a given month showing daily sobra (green up, red down)
  const renderMonthChart = (monthIndex) => {
    const monthRows = rows.filter(r => r.month === monthIndex);
    if (!monthRows || monthRows.length === 0) return null;
    const values = monthRows.map(r => Number(r.sobra || 0));
    const n = values.length;
    const width = 280;
    const height = 120;
    const paddingTop = 8;
    const paddingBottom = 20;
    const paddingX = 12;
    const innerH = height - paddingTop - paddingBottom;
    const baseline = paddingTop + innerH / 2;
    const maxAbs = Math.max(...values.map(v => Math.abs(v)), 1);
    const barW = Math.max(3, Math.floor((width - paddingX * 2) / n) - 1);
    const barSpacing = 1;

    // Escala logarítmica suave para valores pequenos ficarem visíveis
    const scaleValue = (v) => {
      const absV = Math.abs(v);
      if (absV === 0) return 0;
      // Escala com raiz quadrada para suavizar diferenças
      return Math.sign(v) * Math.sqrt(absV / maxAbs);
    };

    return (
      <div className="flex flex-col items-center gap-2">
        <svg width={width} height={height} className="block">
          {/* Gradiente de fundo */}
          <defs>
            <linearGradient id={`grad-pos-${monthIndex}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id={`grad-neg-${monthIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          
          {/* Linha de base */}
          <line x1={paddingX} x2={width - paddingX} y1={baseline} y2={baseline} stroke="#475569" strokeWidth={1.5} strokeDasharray="3,3" opacity={0.5} />
          
          {/* Barras */}
          {values.map((v, i) => {
            const x = paddingX + i * (barW + barSpacing);
            const scaled = scaleValue(v);
            const h = Math.abs(scaled) * (innerH / 2);
            const isPos = v >= 0;
            const fill = isPos ? `url(#grad-pos-${monthIndex})` : `url(#grad-neg-${monthIndex})`;
            const stroke = isPos ? '#10B981' : '#ef4444';
            const actualH = Math.max(h, v !== 0 ? 2 : 0); // Altura mínima de 2px para valores não-zero
            
            return (
              <g key={i}>
                <rect 
                  x={x} 
                  y={v >= 0 ? baseline - actualH : baseline} 
                  width={barW} 
                  height={actualH} 
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={0.5}
                  rx={1}
                  className="transition-opacity hover:opacity-80"
                />
                {/* Tooltip visual no hover */}
                <title>{`Dia ${i + 1}: ${formatCurrency(v)}`}</title>
              </g>
            );
          })}
          
          {/* Labels de referência */}
          <text x={paddingX} y={paddingTop - 2} fontSize="9" fill="#94a3b8" fontWeight="500">+</text>
          <text x={paddingX} y={height - 4} fontSize="9" fill="#94a3b8" fontWeight="500">−</text>
          <text x={width - paddingX} y={baseline + 4} fontSize="8" fill="#64748b" textAnchor="end" fontFamily="monospace">
            max: {formatCurrency(maxAbs)}
          </text>
        </svg>
        <div className="text-[10px] text-slate-400 text-center">
          Variação diária (escala ajustada)
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <div className="max-w-[1220px] mx-auto">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="leading-tight">
              <h1 className="text-xl font-semibold text-slate-900">Controle Efetivo</h1>
              <p className="text-xs text-slate-500">Resumo diário do caixa e das entradas.</p>
            </div>
            <button
              type="button"
              onClick={goToToday}
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Ir para hoje
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-slate-500">Ano</span>
              <div className="relative">
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {Array.from({ length: 6 }).map((_, i) => {
                    const y = now.getFullYear() - 2 + i;
                    return (
                      <option key={y} value={y}>{y}</option>
                    );
                  })}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </label>

            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-slate-500">Conta</span>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="min-w-[160px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="all">Todas</option>
                  {accounts.map(a => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.name_account}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1 ml-auto">
              {monthNames.map((m, idx) => {
                const isSelected = selectedMonth === idx;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => goToMonth(idx)}
                    aria-pressed={isSelected}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${isSelected ? 'bg-blue-600 text-white shadow ring-2 ring-blue-200' : 'bg-white text-slate-600 border border-transparent hover:border-blue-200 hover:shadow-sm'}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-auto"
          ref={tableRef}
          style={{ maxHeight: '75vh' }}
        >
          {loading && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm font-medium text-slate-700">Carregando dados do ano {year}...</p>
              </div>
            </div>
          )}
          
          {!loading && entries.length > 0 && (
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-30 bg-slate-100/95 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="sticky top-0 left-0 z-40 bg-slate-100/95 px-3 py-2 text-center font-medium shadow-sm">Dia</th>
                <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-center font-medium shadow-sm">Despesas</th>
                <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-center font-medium shadow-sm">Custo</th>
                <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-center font-medium shadow-sm">Imprev.</th>
                <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-center font-medium shadow-sm">Entradas</th>
                <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-center font-medium shadow-sm">Entrada Reg.</th>
                <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-center font-medium shadow-sm">Sobra</th>
                <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-center font-medium shadow-sm">Sobra Total</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((item) => {
                if (item.type === 'month') {
                  const tot = monthTotals[item.month] || { despesas: 0, entradas: 0, sobra: 0 };
                  const isOpen = openMonthInfo === item.month;
                  return (
                    <tr key={`m-${item.month}`} className="bg-slate-900/95 text-slate-50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold tracking-wide">{item.monthName}</span>
                            <span className="text-xs uppercase tracking-widest text-slate-300">Resumo mensal</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-slate-300">Despesas</span>
                              <span className="font-medium text-rose-200">{formatCurrency(tot.despesas)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-slate-300">Entradas</span>
                              <span className="font-medium text-emerald-200">{formatCurrency(tot.entradas)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-slate-300">Sobra Mês</span>
                              <span className={`font-semibold ${Number(tot.sobra) < 0 ? 'text-rose-200' : 'text-emerald-200'}`}>{formatCurrency(tot.sobra)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-slate-300">Sobra Total</span>
                              <span className={`font-semibold ${Number(tot.sobra_total_ultimo_dia) < 0 ? 'text-rose-200' : 'text-emerald-200'}`}>{formatCurrency(tot.sobra_total_ultimo_dia)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOpenMonthInfo(isOpen ? null : item.month)}
                              aria-expanded={isOpen}
                              className="ml-auto rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
                            >
                              Detalhes
                            </button>
                          </div>
                        </div>
                        {isOpen && (
                          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-800/50 px-4 py-3">
                            <div className="flex items-center justify-center">
                              {renderMonthChart(item.month)}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }
                const r = item;
                const baseBg = r.date === todayKey ? 'bg-amber-50' : r.month % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                const rowClass = [
                  baseBg,
                  'border-b',
                  'hover:bg-sky-50 transition-colors cursor-pointer',
                  r.date === todayKey ? 'ring-1 ring-amber-300' : '',
                ].join(' ').trim();
                const stickyBg = r.date === todayKey ? 'bg-amber-50' : r.month % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                // Verifica se tem movimentação no dia
                const hasMovement = r.despesas > 0 || r.fixo > 0 || r.imprev > 0 || r.entradas > 0 || r.entradaReg > 0;
                return (
                  <tr
                    key={r.date}
                    data-date={r.date}
                    data-month={r.month}
                    {...(r.isMonthStart ? { 'data-month-start': r.month } : {})}
                    className={rowClass}
                    style={{ borderBottom: subtleBorder }}
                  >
                    <td
                      className={`sticky left-0 z-10 ${stickyBg} px-3 py-2 text-xs font-semibold text-center text-slate-600`}
                      style={{ borderRight: subtleBorder }}
                    >
                      {r.display}
                    </td>
                    <td className="px-3 py-2 text-xs text-right font-medium text-rose-600" style={{ borderLeft: subtleBorder }}>
                      <DetailedValueTooltip date={r.date} accountId={accountId} type="despesas" onClick={() => navigate(`/admin/despesas?date=${r.date}`)}>
                        {formatCurrency(r.despesas)}
                      </DetailedValueTooltip>
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-rose-500" style={{ borderLeft: subtleBorder }}>
                      <DetailedValueTooltip date={r.date} accountId={accountId} type="fixo" onClick={() => navigate(`/admin/despesas?date=${r.date}`)}>
                        {formatCurrency(r.fixo)}
                      </DetailedValueTooltip>
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-rose-500" style={{ borderLeft: subtleBorder }}>
                      <DetailedValueTooltip date={r.date} accountId={accountId} type="imprev" onClick={() => navigate(`/admin/despesas?date=${r.date}`)}>
                        {formatCurrency(r.imprev)}
                      </DetailedValueTooltip>
                    </td>
                    <td className="px-3 py-2 text-xs text-right font-medium text-emerald-600" style={{ borderLeft: subtleBorder }}>
                      <DetailedValueTooltip date={r.date} accountId={accountId} type="entradas" onClick={() => navigate(`/admin/entradas?date=${r.date}`)}>
                        {formatCurrency(r.entradas)}
                      </DetailedValueTooltip>
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-amber-600" style={{ borderLeft: subtleBorder }}>
                      <DetailedValueTooltip date={r.date} accountId={accountId} type="entradaReg" onClick={() => navigate(`/admin/entradas?date=${r.date}`)}>
                        {formatCurrency(r.entradaReg)}
                      </DetailedValueTooltip>
                    </td>
                    <td
                      className={`px-3 py-2 text-xs text-right font-semibold ${r.sobra < 0 ? 'text-rose-700 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}
                      style={{ borderLeft: subtleBorder }}
                    >
                      {formatCurrency(r.sobra)}
                    </td>
                    <td
                      className={`px-3 py-2 text-xs text-right font-semibold ${r.cumulativeTotal < 0 ? 'text-rose-800 bg-rose-50' : 'text-emerald-700'}`}
                      style={{ borderLeft: subtleBorder }}
                    >
                      {formatCurrency(r.cumulativeTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Floating back-to-top button */}
      <button
        type="button"
        onClick={goToTop}
        aria-label="Voltar ao topo"
        className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        style={{ opacity: 0.95 }}
      >
        ↑
      </button>
    </div>
  );
}
