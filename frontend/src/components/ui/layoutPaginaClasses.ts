/** Classes padrão dos controles da BarraFiltros (ver LayoutPagina.tsx). */

/** Classe padrão de select/input dentro de CampoFiltro. */
export const CLASSE_CONTROLE_FILTRO =
  'w-full h-9 px-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-normal';

/** Botão secundário discreto da barra de filtros (Expandir, Limpar...). */
export const CLASSE_BOTAO_FILTRO =
  'h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap';

/** Cor (bolinha) de cada setor nos filtros, mesma paleta da faixa lateral do
 * CabecalhoPagina e do resto do sistema (Obrigações, Agenda). */
export const COR_PONTO_SETOR: Record<string, string> = {
  fiscal: 'bg-rose-500', contabil: 'bg-cyan-500', estoque: 'bg-amber-500', controladoria: 'bg-blue-600', trading: 'bg-indigo-600', sesmt: 'bg-yellow-500',
  gerencia_executiva: 'bg-fuchsia-600', operacoes: 'bg-orange-500', suprimentos: 'bg-teal-500',
};
