import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus } from 'lucide-react';
import { BarraFiltros, CabecalhoPagina, CampoFiltro } from '@/components/ui/LayoutPagina';
import { CLASSE_CONTROLE_FILTRO } from '@/components/ui/layoutPaginaClasses';
import { listarAuditorias } from './armazenamento';
import { CLASSE_BOTAO_PRIMARIO } from './componentes';
import { formatarData, formatarMesCurto } from './formatacao';
import { NavegacaoModulo } from './NavegacaoModulo';
import { rotasAuditoria } from './rotas';
import { auditoriaConcluida, BarraProgresso, SeloAuditoria, Tabela, Td, Th } from './tabela';

export function ListaAuditorias() {
  const navigate = useNavigate();
  const todas = useMemo(() => listarAuditorias(), []);
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState<'' | 'andamento' | 'concluida'>('');

  const auditorias = todas.filter(a => {
    if (busca && !`${a.filial} ${a.auditor}`.toLowerCase().includes(busca.toLowerCase())) return false;
    if (situacao === 'andamento' && auditoriaConcluida(a)) return false;
    if (situacao === 'concluida' && !auditoriaConcluida(a)) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6 font-sans">
      <CabecalhoPagina
        icone={<ClipboardCheck size={20} />}
        titulo="Auditoria Filiais"
        subtitulo="Gerencie as auditorias realizadas e em andamento."
        setor="controladoria"
        acoes={
          <Link to={rotasAuditoria.nova()} className={CLASSE_BOTAO_PRIMARIO}>
            <Plus size={15} /> Nova auditoria
          </Link>
        }
      >
        <NavegacaoModulo />
      </CabecalhoPagina>

      <BarraFiltros>
        <CampoFiltro rotulo="Buscar" largura="flex">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Filial ou auditor..." className={CLASSE_CONTROLE_FILTRO} />
        </CampoFiltro>
        <CampoFiltro rotulo="Situação" largura="sm">
          <select value={situacao} onChange={e => setSituacao(e.target.value as typeof situacao)} className={CLASSE_CONTROLE_FILTRO}>
            <option value="">Todas</option>
            <option value="andamento">Em andamento</option>
            <option value="concluida">Concluídas</option>
          </select>
        </CampoFiltro>
      </BarraFiltros>

      {auditorias.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-14 text-center dark:border-slate-700">
          <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"><ClipboardCheck size={28} className="text-slate-400" /></div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{todas.length === 0 ? 'Nenhuma auditoria criada ainda' : 'Nenhuma auditoria com esses filtros'}</p>
        </div>
      ) : (
        <Tabela>
          <thead>
            <tr><Th>Filial</Th><Th>Período</Th><Th>Data</Th><Th>Auditor</Th><Th>Progresso</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {auditorias.map(a => (
              <tr
                key={a.id}
                onClick={() => navigate(rotasAuditoria.detalhe(a.id))}
                className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <Td className="font-bold text-slate-900 dark:text-slate-50">{a.filial || '-'}</Td>
                <Td>{formatarMesCurto(a.mesReferencia)}</Td>
                <Td className="numeros-tabulares">{formatarData(a.dataAuditoria)}</Td>
                <Td>{a.auditor}</Td>
                <Td><BarraProgresso id={a.id} /></Td>
                <Td><SeloAuditoria auditoria={a} /></Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </div>
  );
}
