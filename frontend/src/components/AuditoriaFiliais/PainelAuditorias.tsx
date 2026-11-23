import { useMemo, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, ClipboardList, Hourglass, Plus } from 'lucide-react';
import { CabecalhoPagina } from '@/components/ui/LayoutPagina';
import { USUARIO_TESTE } from '@/components/Layout/sessaoTeste';
import { listarAuditorias } from './armazenamento';
import { CLASSE_BOTAO_PRIMARIO, CLASSE_BOTAO_SECUNDARIO } from './componentes';
import { formatarMesCurto } from './formatacao';
import { NavegacaoModulo } from './NavegacaoModulo';
import { rotasAuditoria } from './rotas';
import { auditoriaConcluida, BarraProgresso, Tabela, Td, Th } from './tabela';

function CartaoKpi({ rotulo, valor, icone, cor }: { rotulo: string; valor: number; icone: ReactNode; cor: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cor}`}>{icone}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{rotulo}</p>
        <p className="numeros-tabulares text-3xl font-black text-slate-900 dark:text-slate-50">{valor}</p>
      </div>
    </div>
  );
}

export function PainelAuditorias() {
  const navigate = useNavigate();
  const auditorias = useMemo(() => listarAuditorias(), []);
  const emAndamento = auditorias.filter(a => !auditoriaConcluida(a));
  const concluidas = auditorias.length - emAndamento.length;
  const primeiroNome = USUARIO_TESTE.nome.split(' ')[0];

  return (
    <div className="space-y-6 p-6 font-sans">
      <CabecalhoPagina
        icone={<ClipboardCheck size={20} />}
        titulo="Auditoria Filiais"
        subtitulo={`Olá, ${primeiroNome}! Acompanhe as auditorias das filiais e os papéis de trabalho.`}
        setor="controladoria"
        acoes={
          <Link to={rotasAuditoria.nova()} className={CLASSE_BOTAO_PRIMARIO}>
            <Plus size={15} /> Nova auditoria
          </Link>
        }
      >
        <NavegacaoModulo />
      </CabecalhoPagina>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CartaoKpi rotulo="Auditorias" valor={auditorias.length} icone={<ClipboardList size={20} />} cor="bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" />
        <CartaoKpi rotulo="Em andamento" valor={emAndamento.length} icone={<Hourglass size={20} />} cor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <CartaoKpi rotulo="Concluídas" valor={concluidas} icone={<CheckCircle2 size={20} />} cor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-50">Auditorias em andamento</h2>
          <Link to={rotasAuditoria.lista()} className={CLASSE_BOTAO_SECUNDARIO}>Ver todas</Link>
        </div>

        {emAndamento.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-14 text-center dark:border-slate-700">
            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"><ClipboardCheck size={28} className="text-slate-400" /></div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Nenhuma auditoria em andamento</p>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">Crie uma auditoria para começar a preencher os papéis de trabalho da filial.</p>
          </div>
        ) : (
          <Tabela>
            <thead>
              <tr><Th>Filial</Th><Th>Período</Th><Th>Progresso</Th><Th className="text-right">Ação</Th></tr>
            </thead>
            <tbody>
              {emAndamento.map(a => (
                <tr key={a.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <Td className="font-bold text-slate-900 dark:text-slate-50">{a.filial || '-'}</Td>
                  <Td>{formatarMesCurto(a.mesReferencia)}</Td>
                  <Td><BarraProgresso id={a.id} /></Td>
                  <Td className="text-right">
                    <button type="button" onClick={() => navigate(rotasAuditoria.detalhe(a.id))} className="text-sm font-bold text-blue-700 hover:underline dark:text-blue-300">
                      Abrir
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </div>
    </div>
  );
}
