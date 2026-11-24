import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, ClipboardPen, ClipboardPlus, Save } from 'lucide-react';
import { CabecalhoPagina } from '@/components/ui/LayoutPagina';
import { usuarioTeste } from '@/components/Layout/sessaoTeste';
import { obterAuditoria, salvarAuditoria } from './armazenamento';
import { CLASSE_BOTAO_PRIMARIO, CLASSE_BOTAO_SECUNDARIO, Entrada, Grade, Secao, Selecao } from './componentes';
import { listarEmpresas, opcoesFiliais, type EmpresaCatalogo } from './empresas';
import { rotasAuditoria } from './rotas';
import type { AuditoriaFilial, TipoAuditoria } from './tipos';

const dataIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Tela "Nova auditoria". */
export function NovaAuditoria() {
  return <FormularioAuditoria />;
}

/** Edição dos dados de uma auditoria já criada (datas, período, responsável...). */
export function EditarAuditoria() {
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
  return <FormularioAuditoria inicial={auditoria} />;
}

/** Formulário único: sem `inicial` cria uma auditoria; com `inicial` edita a existente. */
function FormularioAuditoria({ inicial }: { inicial?: AuditoriaFilial }) {
  const navigate = useNavigate();
  const editando = !!inicial;
  const [empresas, setEmpresas] = useState<EmpresaCatalogo[]>([]);
  const [empresaId, setEmpresaId] = useState(inicial?.empresaId ?? '');
  const [mesReferencia, setMesReferencia] = useState(inicial?.mesReferencia ?? '');
  const [dataAuditoria, setDataAuditoria] = useState(inicial?.dataAuditoria ?? '');
  const [periodoInicio, setPeriodoInicio] = useState(inicial?.periodoInicio ?? '');
  const [periodoFim, setPeriodoFim] = useState(inicial?.periodoFim ?? '');
  const [auditor, setAuditor] = useState(() => inicial?.auditor ?? usuarioTeste().nome);
  const [tipo, setTipo] = useState<TipoAuditoria>(inicial?.tipo ?? 'presencial');
  const [erroFiliais, setErroFiliais] = useState<string | null>(null);

  // Na edição a filial fica fixa (os papéis de trabalho já são dela), então não
  // precisa carregar a lista.
  useEffect(() => {
    if (editando) return;
    let ativo = true;
    listarEmpresas()
      .then(lista => { if (ativo) setEmpresas(lista); })
      .catch((e: unknown) => { if (ativo) setErroFiliais(e instanceof Error ? e.message : 'Erro ao carregar as filiais.'); });
    return () => { ativo = false; };
  }, [editando]);

  const filiais = useMemo(() => opcoesFiliais(empresas), [empresas]);
  const filialEscolhida = filiais.find(f => f.id === empresaId);

  // Na criação, ao escolher a data da auditoria: período = 6 meses antes até a
  // data (com 10 dias de folga) e mês de referência = o da data. Na edição não
  // mexe em nada sozinho, para não apagar um período já ajustado à mão.
  const aoMudarData = (valor: string) => {
    setDataAuditoria(valor);
    if (editando || !valor) return;
    const [ano, mes, dia] = valor.split('-').map(Number);
    setPeriodoInicio(dataIso(new Date(ano, mes - 1 - 6, dia - 10)));
    setPeriodoFim(dataIso(new Date(ano, mes - 1, dia - 10)));
    setMesReferencia(`${ano}-${String(mes).padStart(2, '0')}`);
  };

  const periodoInvalido = periodoInicio !== '' && periodoFim !== '' && periodoInicio > periodoFim;
  const podeSalvar = (editando || !!filialEscolhida) && dataAuditoria !== '' && auditor.trim() !== '' && !periodoInvalido;
  const motivoBloqueio = periodoInvalido
    ? 'A data inicial do período está depois da data final'
    : 'Informe a filial, a data da auditoria e o auditor';

  const salvar = () => {
    const dados = { mesReferencia, dataAuditoria, periodoInicio, periodoFim, auditor: auditor.trim(), tipo };
    if (inicial) {
      salvarAuditoria({ ...inicial, ...dados });
      navigate(rotasAuditoria.detalhe(inicial.id));
      return;
    }
    if (!filialEscolhida) return;
    const nova: AuditoriaFilial = {
      id: crypto.randomUUID(),
      filial: filialEscolhida.nome,
      empresaId: filialEscolhida.id,
      cnpj: filialEscolhida.cnpj,
      ...dados,
      status: 'Em andamento',
      criadaEm: new Date().toISOString(),
    };
    salvarAuditoria(nova);
    navigate(rotasAuditoria.detalhe(nova.id));
  };

  const voltar = inicial ? rotasAuditoria.detalhe(inicial.id) : rotasAuditoria.lista();

  return (
    <div className="space-y-6 p-6 font-sans">
      <CabecalhoPagina
        icone={editando ? <ClipboardPen size={20} /> : <ClipboardPlus size={20} />}
        titulo={editando ? `Editar auditoria · ${inicial.filial}` : 'Nova auditoria'}
        subtitulo={editando ? 'Ajuste as datas, o período ou o responsável.' : 'Informe os dados iniciais da auditoria.'}
        setor="controladoria"
      />

      <div className="max-w-3xl space-y-6">
        <Secao numero={1} titulo="Filial e data">
          <Grade colunas={2}>
            {editando ? (
              <Entrada
                rotulo="Filial"
                valor={inicial.cnpj ? `${inicial.filial} · ${inicial.cnpj}` : inicial.filial}
                ajuda="A filial não muda depois de criada a auditoria."
              />
            ) : (
              <Selecao
                rotulo="Filial"
                valor={empresaId}
                aoMudar={setEmpresaId}
                placeholder={erroFiliais ? 'Não foi possível carregar as filiais' : filiais.length ? 'Selecione a filial...' : 'Carregando filiais...'}
                opcoes={filiais.map(f => ({ valor: f.id, rotulo: f.rotulo }))}
              />
            )}
            <Selecao
              rotulo="Tipo de auditoria"
              valor={tipo}
              aoMudar={v => setTipo(v as TipoAuditoria)}
              placeholder=""
              opcoes={[{ valor: 'presencial', rotulo: 'Presencial' }, { valor: 'remota', rotulo: 'Remota' }]}
            />
            <Entrada rotulo="Data da auditoria" type="date" valor={dataAuditoria} aoMudar={aoMudarData} />
            <Entrada rotulo="Mês de referência" type="month" valor={mesReferencia} aoMudar={setMesReferencia} />
          </Grade>
          {erroFiliais && <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">{erroFiliais}</p>}
        </Secao>

        <Secao
          numero={2}
          titulo="Período auditado"
          descricao={editando ? 'Ajuste as datas do período auditado, se precisar.' : 'Preenchido sozinho com os 6 meses anteriores à data da auditoria; ajuste se precisar.'}
        >
          <Grade colunas={2}>
            <Entrada rotulo="Data inicial" type="date" valor={periodoInicio} aoMudar={setPeriodoInicio} />
            <Entrada rotulo="Data final" type="date" valor={periodoFim} aoMudar={setPeriodoFim} />
          </Grade>
          {periodoInvalido && <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">A data inicial está depois da data final.</p>}
        </Secao>

        <Secao numero={3} titulo="Responsável">
          <Entrada rotulo="Auditor" valor={auditor} aoMudar={setAuditor} />
        </Secao>

        <div className="flex justify-end gap-2">
          <Link to={voltar} className={CLASSE_BOTAO_SECUNDARIO}>Cancelar</Link>
          <button type="button" onClick={salvar} disabled={!podeSalvar} className={CLASSE_BOTAO_PRIMARIO} title={podeSalvar ? undefined : motivoBloqueio}>
            {editando ? <><Save size={15} /> Salvar alterações</> : 'Criar auditoria'}
          </button>
        </div>
      </div>
    </div>
  );
}
