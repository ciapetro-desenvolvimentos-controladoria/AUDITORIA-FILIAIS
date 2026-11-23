import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import { CabecalhoPagina } from '@/components/ui/LayoutPagina';
import { obterAuditoria, situacaoPapel } from './armazenamento';
import { CLASSE_BOTAO_SECUNDARIO, SeloSituacaoPapel } from './componentes';
import { formatarData, formatarMes } from './formatacao';
import { codigoPapel, PAPEIS_TRABALHO } from './papeisTrabalho';
import { rotasAuditoria } from './rotas';
import { BarraProgresso, SeloAuditoria } from './tabela';

function Info({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{rotulo}</p>
      <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{children}</p>
    </div>
  );
}

export function DetalheAuditoria() {
  const { id = '' } = useParams();
  const auditoria = id ? obterAuditoria(id) : null;

  if (!auditoria) {
    return (
      <div className="space-y-6 p-6 font-sans">
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"><ClipboardCheck size={32} className="text-slate-400" /></div>
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">Auditoria não encontrada</h2>
          <Link to={rotasAuditoria.lista()} className={CLASSE_BOTAO_SECUNDARIO}><ArrowLeft size={15} /> Voltar às auditorias</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 font-sans">
      <CabecalhoPagina
        icone={<ClipboardCheck size={20} />}
        titulo={`Auditoria · ${auditoria.filial}`}
        subtitulo={formatarMes(auditoria.mesReferencia)}
        setor="controladoria"
        selos={<SeloAuditoria auditoria={auditoria} />}
        acoes={<Link to={rotasAuditoria.lista()} className={CLASSE_BOTAO_SECUNDARIO}><ArrowLeft size={15} /> Auditorias</Link>}
      >
        <div className="grid grid-cols-2 gap-4 py-1.5 sm:grid-cols-3 lg:grid-cols-6">
          <Info rotulo="Filial">{auditoria.filial}</Info>
          <Info rotulo="Mês de referência">{formatarMes(auditoria.mesReferencia)}</Info>
          <Info rotulo="Data da auditoria">{formatarData(auditoria.dataAuditoria)}</Info>
          <Info rotulo="Período auditado">{formatarData(auditoria.periodoInicio)} → {formatarData(auditoria.periodoFim)}</Info>
          <Info rotulo="Auditor">{auditoria.auditor}</Info>
          <Info rotulo="Tipo">{auditoria.tipo === 'presencial' ? 'Presencial' : 'Remota'}</Info>
        </div>
      </CabecalhoPagina>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">Papéis de trabalho</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Selecione um papel de trabalho para iniciar a análise.</p>
          </div>
          <div className="w-full sm:w-64"><BarraProgresso id={auditoria.id} /></div>
        </div>

        <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {PAPEIS_TRABALHO.map(papel => (
            <li key={papel.numero} className="border-b border-slate-100 last:border-b-0 dark:border-slate-700/70">
              <Link
                to={rotasAuditoria.papel(auditoria.id, papel.numero)}
                className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <span className="flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-black text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {codigoPapel(papel.numero)}
                </span>
                <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{papel.nome}</span>
                <SeloSituacaoPapel situacao={situacaoPapel(auditoria.id, papel.numero)} />
                <ChevronRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
