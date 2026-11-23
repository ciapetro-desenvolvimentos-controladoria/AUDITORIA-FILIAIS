import React from 'react';
import { cn } from '@/lib/utils';
import { SeloStatus } from '@/components/ui/LayoutPagina';
import { progressoAuditoria } from './armazenamento';
import type { AuditoriaFilial } from './tipos';

/** Tabela no padrão visual da Intranet: cartão branco, cabeçalho em caixa alta. */
export function Tabela({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('tabela-scroll overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('border-b border-slate-100 px-4 py-3 text-slate-700 dark:border-slate-700/70 dark:text-slate-200', className)}>{children}</td>;
}

/** Barra de progresso dos papéis de trabalho finalizados. */
export function BarraProgresso({ id }: { id: string }) {
  const { finalizados, total } = progressoAuditoria(id);
  const pct = Math.round((finalizados / total) * 100);
  return (
    <div className="flex min-w-[9rem] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div className={cn('h-full rounded-full', pct === 100 ? 'bg-emerald-500' : 'bg-blue-600')} style={{ width: `${pct}%` }} />
      </div>
      <span className="numeros-tabulares w-12 text-right text-xs font-bold text-slate-500 dark:text-slate-400">{finalizados}/{total}</span>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function auditoriaConcluida(a: AuditoriaFilial) {
  const { finalizados, total } = progressoAuditoria(a.id);
  return finalizados === total;
}

export function SeloAuditoria({ auditoria }: { auditoria: AuditoriaFilial }) {
  return auditoriaConcluida(auditoria)
    ? <SeloStatus tom="ok">Concluída</SeloStatus>
    : <SeloStatus tom="info">Em andamento</SeloStatus>;
}
