import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Paperclip, Plus, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CabecalhoPagina, SeloStatus, type TomStatus } from '@/components/ui/LayoutPagina';
import { CLASSE_BOTAO_FILTRO, CLASSE_CONTROLE_FILTRO } from '@/components/ui/layoutPaginaClasses';
import { codigoPapel, papelPorNumero } from './papeisTrabalho';
import { rotasAuditoria } from './rotas';
import type { Resultado, SituacaoPapel } from './tipos';

/* ─────────────────────────────────────────────────────────────────────────────
   Peças visuais do módulo, montadas sobre o padrão da Intranet
   (components/ui/LayoutPagina.tsx). Só visual; regra de negócio fica nas telas.
   ───────────────────────────────────────────────────────────────────────────── */

/** Classes de botão no padrão da Intranet (mesmas do LayoutPrincipal/Pedágios). */
export const CLASSE_BOTAO_PRIMARIO =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-blue-900 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600';
export const CLASSE_BOTAO_SECUNDARIO =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';
export { CLASSE_BOTAO_FILTRO };

/** Controle de formulário (input/select): mesmo visual dos filtros da Intranet. */
export const CLASSE_CONTROLE = CLASSE_CONTROLE_FILTRO;
export const CLASSE_AREA_TEXTO =
  'w-full min-h-[72px] px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500';

/* ── Estrutura ─────────────────────────────────────────────────────────────── */

/** Cartão de seção numerada ("1. Conferência dos saldos"). */
export function Secao({ numero, titulo, descricao, acoes, children, className }: {
  numero?: number | string;
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800', className)}>
      <header className="flex flex-col gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {numero !== undefined && (
            <span className="mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 px-1.5 text-xs font-black text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {numero}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-50">{titulo}</h2>
            {descricao && <p className="text-sm text-slate-500 dark:text-slate-400">{descricao}</p>}
          </div>
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </header>
      <div className="space-y-4 px-5 py-4">{children}</div>
    </section>
  );
}

/** Bloco interno de uma seção (ex.: um cartão, uma linha repetível). */
export function Bloco({ titulo, acoes, children, className }: {
  titulo?: React.ReactNode; acoes?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/30', className)}>
      {(titulo || acoes) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {titulo && <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{titulo}</h3>}
          {acoes}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Subtitulo({ children, descricao }: { children: React.ReactNode; descricao?: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{children}</h3>
      {descricao && <p className="text-xs text-slate-500 dark:text-slate-400">{descricao}</p>}
    </div>
  );
}

export function Divisor() {
  return <hr className="my-2 border-slate-100 dark:border-slate-700" />;
}

/** Grade responsiva de campos: 1 coluna no celular, `colunas` no desktop. */
export function Grade({ colunas = 3, children, className }: { colunas?: 1 | 2 | 3 | 4 | 5 | 6; children: React.ReactNode; className?: string }) {
  const cols = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-3 lg:grid-cols-5', 6: 'sm:grid-cols-3 lg:grid-cols-6' }[colunas];
  return <div className={cn('grid grid-cols-1 gap-3', cols, className)}>{children}</div>;
}

/* ── Campos ────────────────────────────────────────────────────────────────── */

/** Rótulo pequeno em cima e controle embaixo (mesmo estilo do CampoFiltro da Intranet). */
export function Campo({ rotulo, ajuda, children, className }: {
  rotulo: string; ajuda?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="pl-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{rotulo}</span>
      {children}
      {ajuda && <span className="pl-0.5 text-[11px] text-slate-500 dark:text-slate-400">{ajuda}</span>}
    </label>
  );
}

type PropsEntrada = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  rotulo: string;
  valor: string;
  aoMudar?: (valor: string) => void;
  ajuda?: React.ReactNode;
  classeCampo?: string;
};

export function Entrada({ rotulo, valor, aoMudar, ajuda, classeCampo, className, readOnly, ...resto }: PropsEntrada) {
  return (
    <Campo rotulo={rotulo} ajuda={ajuda} className={classeCampo}>
      <input
        {...resto}
        readOnly={readOnly || !aoMudar}
        value={valor}
        onChange={e => aoMudar?.(e.target.value)}
        className={cn(CLASSE_CONTROLE, (readOnly || !aoMudar) && 'cursor-default bg-slate-100 dark:bg-slate-800', className)}
      />
    </Campo>
  );
}

export function AreaTexto({ rotulo, valor, aoMudar, linhas = 3, placeholder, classeCampo }: {
  rotulo: string; valor: string; aoMudar: (valor: string) => void; linhas?: number; placeholder?: string; classeCampo?: string;
}) {
  return (
    <Campo rotulo={rotulo} className={classeCampo}>
      <textarea rows={linhas} value={valor} placeholder={placeholder} onChange={e => aoMudar(e.target.value)} className={CLASSE_AREA_TEXTO} />
    </Campo>
  );
}

export interface OpcaoSelecao { valor: string; rotulo: string }

export function Selecao({ rotulo, valor, aoMudar, opcoes, placeholder = 'Selecione...', classeCampo }: {
  rotulo: string; valor: string; aoMudar: (valor: string) => void; opcoes: (OpcaoSelecao | string)[]; placeholder?: string; classeCampo?: string;
}) {
  return (
    <Campo rotulo={rotulo} className={classeCampo}>
      <select value={valor} onChange={e => aoMudar(e.target.value)} className={CLASSE_CONTROLE}>
        {placeholder !== '' && <option value="">{placeholder}</option>}
        {opcoes.map(o => {
          const op = typeof o === 'string' ? { valor: o, rotulo: o } : o;
          return <option key={op.valor} value={op.valor}>{op.rotulo}</option>;
        })}
      </select>
    </Campo>
  );
}

/* ── Resultado / situação ──────────────────────────────────────────────────── */

// eslint-disable-next-line react-refresh/only-export-components
export const OPCOES_RESULTADO: OpcaoSelecao[] = [
  { valor: 'acordo', rotulo: 'De acordo' },
  { valor: 'parcial', rotulo: 'Parcialmente de acordo' },
  { valor: 'desacordo', rotulo: 'Em desacordo' },
];

export function SeletorResultado({ valor, aoMudar, rotulo = 'Resultado' }: { valor: Resultado; aoMudar: (v: Resultado) => void; rotulo?: string }) {
  return <Selecao rotulo={rotulo} valor={valor} aoMudar={v => aoMudar(v as Resultado)} opcoes={OPCOES_RESULTADO} />;
}

/** Tom do selo pelo texto do resultado (aceita "acordo" ou "De acordo"). */
// eslint-disable-next-line react-refresh/only-export-components
export function tomDoResultado(resultado: string): TomStatus {
  const r = resultado.toLowerCase();
  if (!r) return 'neutro';
  if (r.includes('parcial')) return 'atencao';
  if (r.includes('desacordo') || r.includes('em desacordo')) return 'erro';
  if (r.includes('acordo')) return 'ok';
  return 'info';
}

const SITUACAO_PAPEL: Record<SituacaoPapel, { rotulo: string; tom: TomStatus }> = {
  nao_iniciado: { rotulo: 'Não iniciado', tom: 'neutro' },
  rascunho: { rotulo: 'Rascunho', tom: 'atencao' },
  finalizado: { rotulo: 'Finalizado', tom: 'ok' },
};

export function SeloSituacaoPapel({ situacao }: { situacao: SituacaoPapel }) {
  const s = SITUACAO_PAPEL[situacao];
  return <SeloStatus tom={s.tom}>{s.rotulo}</SeloStatus>;
}

/** Valor de diferença (físico − sistema) com selo "Sem diferença" quando zera. */
export function ValorDiferenca({ rotulo = 'Diferença', valor }: { rotulo?: string; valor: string }) {
  const n = valor === '' ? null : Number(valor);
  const cor = n === null ? 'text-slate-400' : n === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  return (
    <Campo rotulo={rotulo}>
      <div className="flex h-9 items-center gap-2">
        <span className={cn('numeros-tabulares text-lg font-black', cor)}>
          {n === null ? '-' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
        {n === 0 && <SeloStatus tom="ok">Sem diferença</SeloStatus>}
      </div>
    </Campo>
  );
}

/* ── Botões utilitários ───────────────────────────────────────────────────── */

export function BotaoAdicionar({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={CLASSE_BOTAO_FILTRO}>
      <Plus size={14} /> {children}
    </button>
  );
}

export function BotaoRemover({ onClick, rotulo = 'Remover' }: { onClick: () => void; rotulo?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
    >
      <Trash2 size={15} />
    </button>
  );
}

/** Botão de anexo (input de arquivo escondido) + nome do arquivo escolhido. */
export function BotaoAnexo({ rotulo, accept, nomeArquivo, aoEscolher }: {
  rotulo: string; accept?: string; nomeArquivo?: string | null; aoEscolher: (arquivo: File | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className={cn(CLASSE_BOTAO_FILTRO, 'cursor-pointer')}>
        <Paperclip size={14} /> {rotulo}
        <input type="file" hidden accept={accept} onChange={e => aoEscolher(e.target.files?.[0] ?? null)} />
      </label>
      {nomeArquivo && (
        <span className="inline-flex items-center gap-1.5 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
          <Paperclip size={13} className="text-slate-400" /> {nomeArquivo}
        </span>
      )}
    </div>
  );
}

/* ── Cabeçalho e rodapé dos papéis de trabalho ────────────────────────────── */

/** Cabeçalho padrão de um PT: ícone da Controladoria, "PT 07", nome e Voltar. */
export function CabecalhoPapel({ idAuditoria, numero, descricao, selos }: {
  idAuditoria?: string; numero: number; descricao?: string; selos?: React.ReactNode;
}) {
  const papel = papelPorNumero(numero);
  return (
    <CabecalhoPagina
      icone={<ClipboardCheck size={20} />}
      titulo={`${codigoPapel(numero)} · ${papel?.nome ?? ''}`}
      subtitulo={descricao}
      setor="controladoria"
      selos={selos}
      acoes={idAuditoria && (
        <Link to={rotasAuditoria.detalhe(idAuditoria)} className={CLASSE_BOTAO_SECUNDARIO}>
          <ArrowLeft size={15} /> Voltar à auditoria
        </Link>
      )}
    />
  );
}

/** Barra de ações no fim do PT: Salvar rascunho / Finalizar. */
export function RodapePapel({ numero, aoSalvarRascunho, aoFinalizar }: {
  numero: number; aoSalvarRascunho?: () => void; aoFinalizar?: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white/90 px-6 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <button type="button" onClick={aoSalvarRascunho} className={CLASSE_BOTAO_SECUNDARIO}>
        <Save size={15} /> Salvar rascunho
      </button>
      <button type="button" onClick={aoFinalizar} className={CLASSE_BOTAO_PRIMARIO}>
        <CheckCircle2 size={15} /> Finalizar {codigoPapel(numero)}
      </button>
    </div>
  );
}

/** Aviso curto de confirmação (substitui o alert() do navegador). */
// eslint-disable-next-line react-refresh/only-export-components
export function useAviso() {
  const [aviso, setAviso] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 3000);
    return () => window.clearTimeout(t);
  }, [aviso]);
  const elemento = aviso ? (
    <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-lg dark:border-emerald-900/50 dark:bg-emerald-950/80 dark:text-emerald-300">
      <CheckCircle2 size={16} /> {aviso}
    </div>
  ) : null;
  return { mostrar: setAviso, elemento };
}
