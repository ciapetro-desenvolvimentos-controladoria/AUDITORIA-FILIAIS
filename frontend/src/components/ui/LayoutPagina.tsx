import React from 'react';

/** Peças visuais compartilhadas pelas telas operacionais (Entregas, Rotinas,
 * Impostos): mesmo cabeçalho, mesma barra de filtros, mesmo selo de setor e de
 * status. Só visual; nenhuma regra de negócio mora aqui. Pedido do Pedro,
 * 2026-09-25: padronizar e alinhar o layout entre as telas. */

const SETOR_LABELS: Record<string, string> = {
  fiscal: 'Fiscal', contabil: 'Contábil', estoque: 'Estoque', controladoria: 'Controladoria', trading: 'Trading', gerencia_executiva: 'Gerência Executiva', operacoes: 'Operações', suprimentos: 'Suprimentos', sesmt: 'SESMT',
};

// Mesma paleta por setor usada no resto do sistema (Obrigações, Agenda).
const SETOR_SELO: Record<string, string> = {
  fiscal:        'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
  contabil:      'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800',
  estoque:       'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
  controladoria: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  trading:       'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
  sesmt:         'text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  gerencia_executiva: 'text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-900/30 border-fuchsia-200 dark:border-fuchsia-800',
  operacoes:     'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
  suprimentos:   'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',
};
const SETOR_ICONE: Record<string, string> = {
  fiscal:        'bg-rose-600 text-white shadow-rose-600/30',
  contabil:      'bg-cyan-600 text-white shadow-cyan-600/30',
  estoque:       'bg-amber-500 text-white shadow-amber-500/30',
  controladoria: 'bg-blue-700 text-white shadow-blue-700/30',
  trading:       'bg-indigo-600 text-white shadow-indigo-600/30',
  sesmt:         'bg-yellow-600 text-white shadow-yellow-600/30',
  gerencia_executiva: 'bg-fuchsia-600 text-white shadow-fuchsia-600/30',
  operacoes:     'bg-orange-500 text-white shadow-orange-500/30',
  suprimentos:   'bg-teal-600 text-white shadow-teal-600/30',
};
const SETOR_FAIXA: Record<string, string> = {
  fiscal: 'bg-rose-500', contabil: 'bg-cyan-500', estoque: 'bg-amber-500', controladoria: 'bg-blue-600', trading: 'bg-indigo-600', sesmt: 'bg-yellow-500',
  gerencia_executiva: 'bg-fuchsia-600', operacoes: 'bg-orange-500', suprimentos: 'bg-teal-500',
};

export function SeloSetor({ setor }: { setor: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${SETOR_SELO[setor] ?? 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700'}`}>
      {SETOR_LABELS[setor] ?? setor}
    </span>
  );
}

interface CabecalhoProps {
  icone: React.ReactNode;
  titulo: string;
  subtitulo?: string;
  /** Define a cor do ícone e da faixa lateral; sem setor, usa o azul padrão. */
  setor?: string | null;
  /** Selos extras ao lado do título (mês fechado, somente leitura...). */
  selos?: React.ReactNode;
  /** Lado direito: seletor de competência e ações principais. */
  acoes?: React.ReactNode;
  /** Versão baixa, pra telas que precisam de altura (Agenda): mesmas peças,
   * menos padding e ícone/título menores. */
  compacto?: boolean;
  /** Conteúdo extra dentro do mesmo cartão, abaixo do título (ex.: filtros). */
  children?: React.ReactNode;
}

/** Cabeçalho único das telas operacionais: ícone colorido pelo setor, título,
 * selo do setor e subtítulo à esquerda; competência e ações à direita. */
export function CabecalhoPagina({ icone, titulo, subtitulo, setor, selos, acoes, compacto, children }: CabecalhoProps) {
  const chave = setor ?? '';
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <span className={`absolute left-0 inset-y-0 w-1.5 ${SETOR_FAIXA[chave] ?? 'bg-blue-900'}`}/>
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pl-6 pr-4 ${compacto ? 'py-2.5' : 'py-4'}`}>
        <div className={`flex items-center min-w-0 ${compacto ? 'gap-3' : 'gap-3.5'}`}>
          <div className={`flex flex-shrink-0 items-center justify-center rounded-xl shadow-lg ${compacto ? 'h-9 w-9' : 'h-11 w-11'} ${SETOR_ICONE[chave] ?? 'bg-blue-900 text-white shadow-blue-900/30'}`}>
            {icone}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`font-black tracking-tight text-slate-900 dark:text-slate-50 ${compacto ? 'text-lg md:text-xl leading-tight' : 'text-xl md:text-2xl'}`}>{titulo}</h1>
              {setor && <SeloSetor setor={setor}/>}
              {selos}
            </div>
            {subtitulo && <p className={`text-slate-500 dark:text-slate-400 ${compacto ? 'text-xs' : 'text-sm mt-0.5'}`}>{subtitulo}</p>}
          </div>
        </div>
        {acoes && <div className="flex items-center gap-2 flex-wrap md:justify-end">{acoes}</div>}
      </div>
      {children && <div className="border-t border-slate-100 dark:border-slate-700 pl-6 pr-4 py-2">{children}</div>}
    </div>
  );
}

/** Contêiner da barra de filtros: mesma altura, espaçamento e borda em todas as telas. */
export function BarraFiltros({ children, rodape }: { children: React.ReactNode; rodape?: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {rodape && <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-2">{rodape}</div>}
    </div>
  );
}

/** Um campo da barra de filtros: rótulo pequeno em cima, controle embaixo. */
export function CampoFiltro({ rotulo, children, largura = 'md' }: {
  rotulo: string; children: React.ReactNode; largura?: 'xs' | 'sm' | 'md' | 'lg' | 'flex';
}) {
  const w = { xs: 'w-full sm:w-32', sm: 'w-full sm:w-40', md: 'w-full sm:w-52', lg: 'w-full sm:w-64', flex: 'flex-1 min-w-[12rem]' }[largura];
  return (
    <label className={`flex flex-col gap-1 ${w}`}>
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-0.5">{rotulo}</span>
      {children}
    </label>
  );
}

export type TomStatus = 'ok' | 'atencao' | 'erro' | 'neutro' | 'info';

const TOM: Record<TomStatus, string> = {
  ok:      'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50',
  atencao: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
  erro:    'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
  neutro:  'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600',
  info:    'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50',
};

/** Selo de status com LARGURA FIXA: assim todos ficam alinhados na coluna,
 * independente do texto (era o que deixava os responsáveis "tortos"). */
export function SeloStatus({ tom, children, icone, pulsar }: {
  tom: TomStatus; children: React.ReactNode; icone?: React.ReactNode; pulsar?: boolean;
}) {
  return (
    <span className={`inline-flex w-[6.5rem] items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${TOM[tom]} ${pulsar ? 'animate-pulse' : ''}`}>
      {icone}{children}
    </span>
  );
}
