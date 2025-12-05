import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, FileText, BarChart3 } from 'lucide-react';
import { financialApi } from '../../../services/api';

const formatCurrency = (value) => Number(value || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPercentage = (value) => `${Number(value || 0).toFixed(2)}%`;

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Componente de gráfico de linha
const LineChart = ({ data, title, showLegend = true }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  if (!data || data.length === 0) return null;

  const width = 900;
  const height = 240;
  const padding = { top: 35, right: 80, bottom: 45, left: 85 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Encontrar valores máximo e mínimo
  const allValues = data.flatMap(serie => serie.values);
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  // Escala Y
  const getY = (value) => {
    return padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
  };

  // Escala X
  const getX = (index) => {
    return padding.left + (index * chartWidth) / 11;
  };

  // Linha zero
  const zeroY = getY(0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm w-full overflow-x-auto">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      <div className="min-w-[900px] relative">
        <svg width={width} height={height}>
          {/* Grid horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = minValue + valueRange * ratio;
            const y = getY(value);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          {/* Linha zero */}
          {minValue < 0 && (
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={zeroY}
              y2={zeroY}
              stroke="#475569"
              strokeWidth="2"
            />
          )}

          {/* Grid vertical e labels dos meses */}
          {monthNames.map((month, i) => {
            const x = getX(i);
            return (
              <g key={i}>
                <line
                  x1={x}
                  x2={x}
                  y1={padding.top}
                  y2={height - padding.bottom}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                >
                  {month}
                </text>
              </g>
            );
          })}

          {/* Linhas dos dados */}
          {data.map((serie, serieIndex) => {
            const points = serie.values.map((value, i) => ({
              x: getX(i),
              y: getY(value),
              value: value,
              month: i,
            }));

            const pathData = points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ');

            return (
              <g key={serieIndex}>
                {/* Linha */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={serie.color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Pontos com hover */}
                {points.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="3.5"
                      fill={serie.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    {/* Área maior para hover */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="8"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint({ serieIndex, month: i, value: p.value, x: p.x, y: p.y, label: serie.label, color: serie.color })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}
              </g>
            );
          })}

          {/* Legenda */}
          {showLegend && data.map((serie, i) => {
            return (
              <g key={i}>
                <rect
                  x={width - padding.right + 12}
                  y={padding.top + i * 20}
                  width="18"
                  height="3"
                  fill={serie.color}
                />
                <text
                  x={width - padding.right + 35}
                  y={padding.top + i * 20 + 4}
                  fontSize="10"
                  fill="#475569"
                  fontWeight="500"
                >
                  {serie.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip hover */}
        {hoveredPoint && (
          <div 
            className="absolute bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-50"
            style={{
              left: `${hoveredPoint.x}px`,
              top: `${hoveredPoint.y - 60}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold mb-1" style={{ color: hoveredPoint.color }}>
              {hoveredPoint.label}
            </div>
            <div className="text-[11px]">
              {monthNames[hoveredPoint.month]}: <span className="font-bold">{formatCurrency(hoveredPoint.value)}</span>
            </div>
            {/* Seta */}
            <div 
              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid #111827',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default function ResumoAnual() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState([]);
  const [previousYearData, setPreviousYearData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGraphs, setShowGraphs] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentResponse, previousResponse] = await Promise.all([
        financialApi.resumoAnual({ ano: year }),
        financialApi.resumoAnual({ ano: year - 1 })
      ]);
      setData(currentResponse.data || []);
      setPreviousYearData(previousResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar resumo anual:', error);
      setData([]);
      setPreviousYearData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [year]);

  // Calcular totais anuais
  const totals = data.reduce((acc, month) => ({
    entradas: acc.entradas + Number(month.entradas_totais || 0),
    saidas: acc.saidas + Number(month.saidas_totais || 0),
    lucro: acc.lucro + Number(month.lucro || 0),
    vendido: acc.vendido + Number(month.vendido || 0),
    faturadoOS: acc.faturadoOS + Number(month.valor_faturado_os || 0),
    numOS: acc.numOS + Number(month.num_os_faturadas || 0),
  }), { entradas: 0, saidas: 0, lucro: 0, vendido: 0, faturadoOS: 0, numOS: 0 });

  const percentualLucroAnual = totals.entradas > 0 ? ((totals.lucro / totals.entradas) * 100) : 0;

  const subtleBorder = '1px solid rgba(148, 163, 184, 0.18)';

  // Preparar dados para gráfico de Entradas vs Saídas
  const prepareEntradasSaidasChart = () => {
    const entradasValues = Array(12).fill(0);
    const saidasValues = Array(12).fill(0);

    data.forEach(month => {
      const monthIndex = month.mes_num - 1;
      entradasValues[monthIndex] = Number(month.entradas_totais || 0);
      saidasValues[monthIndex] = Number(month.saidas_totais || 0);
    });

    return [
      { label: 'Entradas', color: '#3b82f6', values: entradasValues },
      { label: 'Saídas', color: '#ef4444', values: saidasValues }
    ];
  };

  // Preparar dados para gráfico de comparação de lucro
  const prepareLucroComparativoChart = () => {
    const currentYearLucro = Array(12).fill(0);
    const previousYearLucro = Array(12).fill(0);

    data.forEach(month => {
      const monthIndex = month.mes_num - 1;
      currentYearLucro[monthIndex] = Number(month.lucro || 0);
    });

    previousYearData.forEach(month => {
      const monthIndex = month.mes_num - 1;
      previousYearLucro[monthIndex] = Number(month.lucro || 0);
    });

    return [
      { label: `${year - 1}`, color: '#94a3b8', values: previousYearLucro },
      { label: `${year}`, color: '#10b981', values: currentYearLucro }
    ];
  };

  const entradasSaidasData = prepareEntradasSaidasChart();
  const lucroComparativoData = prepareLucroComparativoChart();

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <div className="max-w-[1220px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="leading-tight">
              <h1 className="text-xl font-semibold text-slate-900">Boletim</h1>
              <p className="text-xs text-slate-500">Visão consolidada mensal do ano</p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs uppercase tracking-wide text-slate-500">Ano</label>
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              <button
                type="button"
                onClick={() => setShowGraphs(!showGraphs)}
                className={`ml-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  showGraphs 
                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300 shadow-sm'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                {showGraphs ? 'Ocultar Gráficos' : 'Ver Gráficos'}
              </button>
            </div>
          </div>
        </div>

        {/* Gráficos - aparecem quando botão é clicado */}
        {showGraphs && !loading && data.length > 0 && (
          <div className="space-y-4 mb-4 animate-in slide-in-from-top duration-300">
            <LineChart
              data={entradasSaidasData}
              title="Entradas vs Saídas - Análise Mensal"
            />
            
            <LineChart
              data={lucroComparativoData}
              title={`Comparação de Lucro: ${year} vs ${year - 1}`}
            />
          </div>
        )}

        {/* Resumo Geral do Ano */}
        {!loading && data.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Total de Entradas</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.entradas)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Total de Saídas</p>
                <p className="text-lg font-bold text-rose-600">{formatCurrency(totals.saidas)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Lucro do Ano</p>
                <p className={`text-lg font-bold ${totals.lucro >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(totals.lucro)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">% Margem Anual</p>
                <p className={`text-lg font-bold ${percentualLucroAnual >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatPercentage(percentualLucroAnual)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela Mensal */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-slate-600">Carregando dados...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              <p>Nenhum dado encontrado para o ano {year}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-30 bg-slate-100/95 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="sticky top-0 left-0 z-40 bg-slate-100/95 px-3 py-2 text-left font-medium shadow-sm">
                      Mês
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-right font-medium shadow-sm">
                      Entradas
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-right font-medium shadow-sm">
                      Saídas
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-right font-medium shadow-sm">
                      Lucro
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-right font-medium shadow-sm">
                      % Lucro
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-right font-medium shadow-sm">
                      Vendido
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-right font-medium shadow-sm">
                      Faturado
                    </th>
                    <th className="sticky top-0 z-30 bg-slate-100/95 px-3 py-2 text-right font-medium shadow-sm">
                      OS Fechadas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((month, idx) => {
                    const isPositive = Number(month.lucro) >= 0;
                    const baseBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                    return (
                      <tr 
                        key={idx} 
                        className={`${baseBg} border-b hover:bg-sky-50 transition-colors`}
                        style={{ borderBottom: subtleBorder }}
                      >
                        <td className="sticky left-0 z-10 px-3 py-2 whitespace-nowrap" style={{ borderRight: subtleBorder, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">
                              {month.mes_num}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {monthNames[month.mes_num - 1]} {month.ano}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-semibold text-emerald-600" style={{ borderLeft: subtleBorder }}>
                          {formatCurrency(month.entradas_totais)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-semibold text-rose-600" style={{ borderLeft: subtleBorder }}>
                          {formatCurrency(month.saidas_totais)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-bold" style={{ borderLeft: subtleBorder }}>
                          <span className={isPositive ? 'text-blue-600' : 'text-orange-600'}>
                            {formatCurrency(month.lucro)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right" style={{ borderLeft: subtleBorder }}>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            isPositive ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {formatPercentage(month.percentual_lucro)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium text-purple-600" style={{ borderLeft: subtleBorder }}>
                          {formatCurrency(month.vendido)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-xs font-medium text-indigo-600" style={{ borderLeft: subtleBorder }}>
                          {formatCurrency(month.valor_faturado_os)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right" style={{ borderLeft: subtleBorder }}>
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                            {month.num_os_faturadas}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
