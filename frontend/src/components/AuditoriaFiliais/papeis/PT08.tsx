import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Dices, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeloStatus } from '@/components/ui/LayoutPagina';
import {
  AreaTexto, BotaoAdicionar, BotaoRemover, CabecalhoPapel, CLASSE_BOTAO_PRIMARIO, CLASSE_CONTROLE, Divisor, Entrada, Grade,
  RodapePapel, Secao, Selecao, useAviso,
} from '../componentes';
import { Tabela, Td, Th } from '../tabela';
import { obterAuditoria, obterPapel, salvarPapel } from '../armazenamento';
import { novaSemente, sortearItens } from '../amostragem';
import { codigoEmpresaSispetro } from '../empresas';
import { formatarData, formatarMoeda } from '../formatacao';
import { buscarComprasPedagio, compraComSucesso, ROTULO_CONFIRMACAO, SITUACAO_PEDAGIO, type ValeCompra } from '../pedagios';

type RegistroPedagio = {
  id: number;
  oc: string;
  carga: string;
  status: string;
  rota: string;
  motivo: string;
  rotaCorreta: string;
  observacoes: string;
  /** Vale sorteado do módulo de Pedágios (só nas linhas que vieram do sorteio). */
  vale?: ValeCompra;
};

type TipoRegistro = 'cancelados' | 'compras';

/** Registro do sorteio das compras, gravado para comprovar como a amostra foi tirada. */
type SorteioCompras = {
  filial: string;
  codEmpresa: number;
  de: string;
  ate: string;
  semente: number;
  meta: number;
  populacao: { total: number; comSucesso: number; porSituacao: Record<string, number> };
  avisos: string[];
  sorteadoEm: string;
};

/** Formato gravado (mesmo da versão anterior, chave auditoria_<id>_pt08, + o sorteio). */
type DadosPT08 = {
  sorteioCompras?: SorteioCompras | null;
  cancelados: RegistroPedagio[];
  compras: RegistroPedagio[];
  periodoInicio: string;
  periodoFim: string;
  resultado: string;
  observacoes: string;
  providenciaAplicada: string;
  status: 'rascunho' | 'finalizado';
};

const AMOSTRA_CANCELADOS = 10;
const AMOSTRA_COMPRAS = 20;

const OPCOES_RESULTADO_PT08 = ['De acordo', 'Parcialmente de acordo', 'Desacordo'];

const ABAS = ['Pedágios cancelados', 'Compras realizadas'];

const criarRegistro = (id: number): RegistroPedagio => ({
  id,
  oc: '',
  carga: '',
  status: '',
  rota: '',
  motivo: '',
  rotaCorreta: '',
  observacoes: '',
});

const criarAmostra = (quantidade: number): RegistroPedagio[] =>
  Array.from({ length: quantidade }, (_, index) => criarRegistro(index + 1));

const ehCorreto = (valor: string): boolean => {
  const normalizado = valor.trim().toLowerCase();
  return normalizado === 'sim' || normalizado === 'ok';
};

const percentual = (corretos: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((corretos / total) * 100).toFixed(2).replace('.', ',')}%`;
};

/** Lista salva só é usada se for um array não vazio (regra da versão anterior). */
const listaSalva = (lista: RegistroPedagio[] | undefined, padrao: number) =>
  Array.isArray(lista) && lista.length > 0 ? lista : criarAmostra(padrao);

/** Colunas de cada aba: [campo, título, largura mínima do input, placeholder]. */
type Coluna = { campo: keyof RegistroPedagio; titulo: string; largura: string; placeholder: string };

const COLUNAS_CANCELADOS: Coluna[] = [
  { campo: 'oc', titulo: 'OC', largura: 'min-w-[6rem]', placeholder: 'OC' },
  { campo: 'carga', titulo: 'Carga', largura: 'min-w-[7rem]', placeholder: 'Carga' },
  { campo: 'status', titulo: 'Status', largura: 'min-w-[7rem]', placeholder: 'Status' },
  { campo: 'rota', titulo: 'Rota', largura: 'min-w-[8rem]', placeholder: 'Rota' },
  { campo: 'motivo', titulo: 'Motivo', largura: 'min-w-[9rem]', placeholder: 'Motivo' },
  { campo: 'observacoes', titulo: 'Observações', largura: 'min-w-[12rem]', placeholder: 'Observações' },
];

const COLUNAS_COMPRAS: Coluna[] = [
  { campo: 'oc', titulo: 'OC', largura: 'min-w-[6rem]', placeholder: 'OC' },
  { campo: 'carga', titulo: 'Carga', largura: 'min-w-[7rem]', placeholder: 'Carga' },
  { campo: 'status', titulo: 'Status', largura: 'min-w-[7rem]', placeholder: 'Status' },
  { campo: 'rota', titulo: 'Rota', largura: 'min-w-[8rem]', placeholder: 'Rota' },
  { campo: 'rotaCorreta', titulo: 'Rota correta?', largura: 'min-w-[8rem]', placeholder: 'SIM / OK' },
  { campo: 'observacoes', titulo: 'Observações', largura: 'min-w-[12rem]', placeholder: 'Observações' },
];

const OPCOES_SIM_NAO = [{ valor: 'sim', rotulo: 'SIM' }, { valor: 'nao', rotulo: 'NÃO' }];

const rotaDoVale = (v: ValeCompra) => `${v.origem ?? '?'} → ${v.destino ?? '?'}`;

/** Converte um vale sorteado na linha da aba de compras. */
const registroDoVale = (v: ValeCompra, id: number): RegistroPedagio => ({
  ...criarRegistro(id),
  carga: v.carga,
  status: compraComSucesso(v) ? 'Compra aceita' : 'Sem compra aceita',
  rota: rotaDoVale(v),
  vale: v,
});

/** Indicador de leitura: rótulo pequeno e valor grande. */
function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="pl-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{rotulo}</span>
      <span className="numeros-tabulares text-lg font-black text-slate-900 dark:text-slate-50">{valor}</span>
      {detalhe && <span className="numeros-tabulares text-sm text-slate-600 dark:text-slate-300">{detalhe}</span>}
    </div>
  );
}

/** Tabela das compras sorteadas: dados do vale (só leitura) + conferência do auditor. */
function TabelaComprasSorteadas({ registros, aoAtualizar }: {
  registros: RegistroPedagio[];
  aoAtualizar: (registroId: number, campo: keyof RegistroPedagio, valor: string) => void;
}) {
  return (
    <Tabela className="shadow-none">
      <thead>
        <tr>
          <Th className="px-2">#</Th>
          <Th className="px-2">Carga</Th>
          <Th className="px-2">Vale</Th>
          <Th className="px-2">Compra em</Th>
          <Th className="px-2">Rota</Th>
          <Th className="px-2 text-right">Valor</Th>
          <Th className="px-2">Compra</Th>
          <Th className="px-2">Confirmação</Th>
          <Th className="px-2">Situação (Pedágios)</Th>
          <Th className="px-2">Rota correta?</Th>
          <Th className="px-2">Observações</Th>
        </tr>
      </thead>
      <tbody>
        {registros.map((r, i) => {
          const v = r.vale;
          if (!v) return null;
          const situacao = v.situacao ? SITUACAO_PEDAGIO[v.situacao] ?? { rotulo: v.situacao, tom: 'neutro' as const } : null;
          return (
            <tr key={r.id} className="align-top">
              <Td className="numeros-tabulares px-2 py-2 text-xs text-slate-400">{String(i + 1).padStart(2, '0')}</Td>
              <Td className="numeros-tabulares px-2 py-2 font-bold text-slate-900 dark:text-slate-50">{v.carga}</Td>
              <Td className="numeros-tabulares px-2 py-2">{v.numeroVale}</Td>
              <Td className="numeros-tabulares whitespace-nowrap px-2 py-2">{formatarData(v.dataInclusao)}</Td>
              <Td className="min-w-[180px] px-2 py-2">
                <span className="block">{rotaDoVale(v)}</span>
                {v.placa && <span className="text-xs text-slate-400">{v.placa}</span>}
              </Td>
              <Td className="numeros-tabulares whitespace-nowrap px-2 py-2 text-right">{formatarMoeda(v.valor)}</Td>
              <Td className="whitespace-nowrap px-2 py-2">
                {compraComSucesso(v)
                  ? <SeloStatus tom="ok">{v.compraOk ? 'Compra aceita' : 'Aceita no CIOT'}</SeloStatus>
                  : <SeloStatus tom="erro">Sem compra aceita</SeloStatus>}
                {v.mensagemErro && <span className="mt-1 block max-w-[200px] text-xs text-rose-600 dark:text-rose-400">{v.mensagemErro}</span>}
              </Td>
              <Td className="whitespace-nowrap px-2 py-2">
                {v.statusConfirmacao ? ROTULO_CONFIRMACAO[v.statusConfirmacao] ?? `Código ${v.statusConfirmacao}` : '-'}
              </Td>
              <Td className="min-w-[160px] px-2 py-2">
                {situacao ? <SeloStatus tom={situacao.tom}>{situacao.rotulo}</SeloStatus> : <span className="text-slate-400">-</span>}
                {v.diagnostico && v.situacao !== 'CONCILIADO' && (
                  <span className="mt-1 block max-w-[280px] text-xs text-slate-500 dark:text-slate-400" title={v.diagnostico}>
                    {v.diagnostico.length > 160 ? `${v.diagnostico.slice(0, 160)}…` : v.diagnostico}
                  </span>
                )}
              </Td>
              <Td className="min-w-[100px] px-2 py-2">
                <select
                  value={r.rotaCorreta}
                  onChange={e => aoAtualizar(r.id, 'rotaCorreta', e.target.value)}
                  aria-label={`Rota correta - linha ${i + 1}`}
                  className={cn(CLASSE_CONTROLE, 'w-full')}
                >
                  <option value="">-</option>
                  {OPCOES_SIM_NAO.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
                </select>
              </Td>
              <Td className="min-w-[180px] px-2 py-2">
                <input
                  aria-label={`Observações - linha ${i + 1}`}
                  placeholder="Observações"
                  value={r.observacoes}
                  onChange={e => aoAtualizar(r.id, 'observacoes', e.target.value)}
                  className={CLASSE_CONTROLE}
                />
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Tabela>
  );
}

/** Tabela editável de registros (uma por aba). */
function TabelaRegistros({ registros, colunas, aoAtualizar, aoRemover }: {
  registros: RegistroPedagio[];
  colunas: Coluna[];
  aoAtualizar: (registroId: number, campo: keyof RegistroPedagio, valor: string) => void;
  aoRemover: (registroId: number) => void;
}) {
  return (
    <Tabela className="shadow-none">
      <thead>
        <tr>
          {colunas.map(c => <Th key={c.campo} className="px-2">{c.titulo}</Th>)}
          <Th className="px-2" />
        </tr>
      </thead>
      <tbody>
        {registros.map(registro => (
          <tr key={registro.id}>
            {colunas.map(c => (
              <Td key={c.campo} className="px-2 py-2">
                <input
                  aria-label={c.titulo}
                  placeholder={c.placeholder}
                  value={String(registro[c.campo] ?? '')}
                  onChange={e => aoAtualizar(registro.id, c.campo, e.target.value)}
                  className={cn(CLASSE_CONTROLE, c.largura)}
                />
              </Td>
            ))}
            <Td className="w-10 px-2 py-2">
              {registros.length > 1 && <BotaoRemover rotulo="Remover linha" onClick={() => aoRemover(registro.id)} />}
            </Td>
          </tr>
        ))}
      </tbody>
    </Tabela>
  );
}

export default function PT08() {
  const { id } = useParams();
  const aviso = useAviso();

  const [aba, setAba] = useState(0);

  // Carrega uma vez o que já foi salvo (mesmas regras do código anterior: só aplica campos preenchidos).
  const [salvo] = useState(() => (id ? obterPapel<Partial<DadosPT08>>(id, 8) : null));

  const [cancelados, setCancelados] = useState<RegistroPedagio[]>(() => listaSalva(salvo?.cancelados, AMOSTRA_CANCELADOS));
  const [compras, setCompras] = useState<RegistroPedagio[]>(() => listaSalva(salvo?.compras, AMOSTRA_COMPRAS));

  const [auditoria] = useState(() => (id ? obterAuditoria(id) : null));
  const [periodoInicio, setPeriodoInicio] = useState(salvo?.periodoInicio || auditoria?.periodoInicio || '');
  const [periodoFim, setPeriodoFim] = useState(salvo?.periodoFim || auditoria?.periodoFim || '');
  const [sorteioCompras, setSorteioCompras] = useState<SorteioCompras | null>(salvo?.sorteioCompras ?? null);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  const codEmpresa = codigoEmpresaSispetro(auditoria?.cnpj);
  const periodoInvalido = periodoInicio !== '' && periodoFim !== '' && periodoInicio > periodoFim;
  const podeSortear = codEmpresa !== null && periodoInicio !== '' && periodoFim !== '' && !periodoInvalido && !buscando;

  /** Sorteia AMOSTRA_COMPRAS vales comprados da filial no período (módulo de Pedágios). */
  const sortearCompras = async () => {
    if (!podeSortear || codEmpresa === null) return;
    const jaConferido = compras.some(r => r.rotaCorreta !== '' || r.observacoes !== '' || (!r.vale && r.carga !== ''));
    if ((sorteioCompras || jaConferido)
      && !window.confirm('Sortear de novo substitui a amostra de compras e apaga o que já foi conferido nela. Continuar?')) return;
    setBuscando(true);
    setErroBusca(null);
    try {
      const vales = await buscarComprasPedagio(codEmpresa, periodoInicio, periodoFim);
      const semente = novaSemente();
      const sorteados = sortearItens(vales, AMOSTRA_COMPRAS, semente);
      const comSucesso = vales.filter(compraComSucesso).length;
      const porSituacao: Record<string, number> = {};
      for (const v of vales) {
        const chave = v.situacao ?? 'SEM_SITUACAO';
        porSituacao[chave] = (porSituacao[chave] ?? 0) + 1;
      }
      const avisos: string[] = [];
      if (vales.length === 0) avisos.push('Não há vales-pedágio comprados para a filial no período: nenhum vale foi sorteado.');
      else if (vales.length < AMOSTRA_COMPRAS) {
        avisos.push(`Não há dados mínimos: a filial tem só ${vales.length} ${vales.length === 1 ? 'vale comprado' : 'vales comprados'} no período, todos foram usados, e a amostra ficou com ${vales.length} de ${AMOSTRA_COMPRAS}.`);
      }
      if (periodoInicio < '2026-06-01') avisos.push('O módulo de Pedágios tem vales a partir de 01/06/2026; antes disso o período fica sem dados.');
      setCompras(sorteados.map((v, i) => registroDoVale(v, i + 1)));
      setSorteioCompras({
        filial: sorteados[0]?.filial ?? auditoria?.filial ?? '',
        codEmpresa,
        de: periodoInicio,
        ate: periodoFim,
        semente,
        meta: AMOSTRA_COMPRAS,
        populacao: { total: vales.length, comSucesso, porSituacao },
        avisos,
        sorteadoEm: new Date().toISOString(),
      });
      aviso.mostrar(`Amostra sorteada: ${sorteados.length} vales. Salve o PT08 para gravar.`);
    } catch (e) {
      setErroBusca(e instanceof Error ? e.message : 'Erro ao buscar os vales-pedágio.');
    } finally {
      setBuscando(false);
    }
  };

  const [resultado, setResultado] = useState(salvo?.resultado || 'De acordo');
  const [observacoes, setObservacoes] = useState(salvo?.observacoes || '');
  const [providenciaAplicada, setProvidenciaAplicada] = useState(salvo?.providenciaAplicada || '');

  const atualizarRegistro = (tipo: TipoRegistro, registroId: number, campo: keyof RegistroPedagio, valor: string) => {
    const setter = tipo === 'cancelados' ? setCancelados : setCompras;
    setter(atual => atual.map(registro => (registro.id === registroId ? { ...registro, [campo]: valor } : registro)));
  };

  const adicionarRegistro = (tipo: TipoRegistro) => {
    const registros = tipo === 'cancelados' ? cancelados : compras;
    const setter = tipo === 'cancelados' ? setCancelados : setCompras;
    const novoId = registros.length > 0 ? Math.max(...registros.map(registro => registro.id)) + 1 : 1;
    setter(atual => [...atual, criarRegistro(novoId)]);
  };

  const removerRegistro = (tipo: TipoRegistro, registroId: number) => {
    const setter = tipo === 'cancelados' ? setCancelados : setCompras;
    setter(atual => atual.filter(registro => registro.id !== registroId));
  };

  // A planilha de origem define os campos, mas não define critérios de
  // conformidade para Status/Rota/Motivo. Por isso, o único critério percentual
  // explicitamente definido na fonte é "Rota correta?" da aba de compras realizadas.
  const totalCancelados = cancelados.length;
  const totalCompras = compras.length;
  const corretosRotaCompras = compras.filter(registro => ehCorreto(registro.rotaCorreta)).length;
  const comprasSorteadas = compras.some(r => r.vale);
  const comprasComSucesso = compras.filter(r => r.vale && compraComSucesso(r.vale)).length;

  const salvar = (status: 'rascunho' | 'finalizado') => {
    if (!id) return;
    const dados: DadosPT08 = {
      sorteioCompras,
      cancelados,
      compras,
      periodoInicio,
      periodoFim,
      resultado,
      observacoes,
      providenciaAplicada,
      status,
    };
    salvarPapel(id, 8, dados);
    aviso.mostrar(status === 'rascunho' ? 'PT08 salvo como rascunho.' : 'PT08 finalizado.');
  };

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={8} descricao="Conferência Pedágio" />

      {/* 1. Período */}
      <Secao numero={1} titulo="Período Analisado">
        <Grade colunas={2}>
          <Entrada rotulo="Data inicial" type="date" valor={periodoInicio} aoMudar={setPeriodoInicio} />
          <Entrada rotulo="Data final" type="date" valor={periodoFim} aoMudar={setPeriodoFim} />
        </Grade>
      </Secao>

      {/* 2. Conferência (abas) */}
      <Secao numero={2} titulo="Conferência de Pedágio">
        <div role="tablist" className="-mt-1 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
          {ABAS.map((rotulo, indice) => {
            const ativa = aba === indice;
            return (
              <button
                key={rotulo}
                type="button"
                role="tab"
                aria-selected={ativa}
                onClick={() => setAba(indice)}
                className={cn(
                  '-mb-px border-b-2 px-3.5 pb-2.5 pt-1.5 text-sm font-bold transition-colors',
                  ativa
                    ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
                )}
              >
                {rotulo}
              </button>
            );
          })}
        </div>

        {aba === 0 ? (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">Amostra de 10 Pedágios Cancelados.</p>
            <TabelaRegistros
              registros={cancelados}
              colunas={COLUNAS_CANCELADOS}
              aoAtualizar={(registroId, campo, valor) => atualizarRegistro('cancelados', registroId, campo, valor)}
              aoRemover={registroId => removerRegistro('cancelados', registroId)}
            />
            <Divisor />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Total da amostra: <span className="numeros-tabulares">{totalCancelados}</span>
              </p>
              <BotaoAdicionar onClick={() => adicionarRegistro('cancelados')}>Adicionar linha</BotaoAdicionar>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Amostra de {AMOSTRA_COMPRAS} pedágios comprados, sorteados entre os vales da filial no período analisado (módulo de Pedágios da Intranet). Pela carga, confira se a compra teve sucesso na Target.
            </p>

            {codEmpresa === null && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                {auditoria?.cnpj
                  ? 'O CNPJ desta filial não é da Ciapetro (01.466.091), então não dá para achar o código da empresa no Sispetro. Preencha a amostra à mão.'
                  : 'Esta auditoria não tem o CNPJ da filial (foi criada antes da lista de filiais). Crie uma nova auditoria escolhendo a filial, ou preencha a amostra à mão.'}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={sortearCompras} disabled={!podeSortear} className={CLASSE_BOTAO_PRIMARIO}
                title={periodoInvalido ? 'A data inicial está depois da data final' : codEmpresa !== null && (!periodoInicio || !periodoFim) ? 'Informe o período analisado' : undefined}>
                {buscando ? <Loader2 size={15} className="animate-spin" /> : <Dices size={15} />}
                {buscando ? 'Buscando vales...' : sorteioCompras ? 'Sortear de novo' : `Buscar vales e sortear ${AMOSTRA_COMPRAS}`}
              </button>
              {codEmpresa !== null && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {auditoria?.filial} · empresa {codEmpresa} no Sispetro · {formatarData(periodoInicio)} a {formatarData(periodoFim)}
                </span>
              )}
              {erroBusca && <span role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">{erroBusca}</span>}
            </div>

            {sorteioCompras && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                <Grade colunas={4}>
                  <Indicador rotulo="Vales comprados no período" valor={sorteioCompras.populacao.total.toLocaleString('pt-BR')}
                    detalhe={`${formatarData(sorteioCompras.de)} a ${formatarData(sorteioCompras.ate)}`} />
                  <Indicador rotulo="Com compra aceita" valor={sorteioCompras.populacao.comSucesso.toLocaleString('pt-BR')}
                    detalhe={percentual(sorteioCompras.populacao.comSucesso, sorteioCompras.populacao.total)} />
                  <Indicador rotulo="Amostra" valor={`${compras.filter(r => r.vale).length} de ${sorteioCompras.meta}`} />
                  <Indicador rotulo="Sorteio" valor={`#${sorteioCompras.semente}`}
                    detalhe={new Date(sorteioCompras.sorteadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} />
                </Grade>
                {Object.keys(sorteioCompras.populacao.porSituacao).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Situação dos vales do período:</span>
                    {Object.entries(sorteioCompras.populacao.porSituacao).sort((a, b) => b[1] - a[1]).map(([chave, qtd]) => {
                      const s = SITUACAO_PEDAGIO[chave] ?? { rotulo: chave === 'SEM_SITUACAO' ? 'Sem situação' : chave, tom: 'neutro' as const };
                      return <SeloStatus key={chave} tom={s.tom}>{s.rotulo}: {qtd.toLocaleString('pt-BR')}</SeloStatus>;
                    })}
                  </div>
                )}
                {sorteioCompras.avisos.length > 0 && (
                  <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                    {sorteioCompras.avisos.map(a => (
                      <li key={a} className="flex items-start gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {comprasSorteadas ? (
              <TabelaComprasSorteadas
                registros={compras}
                aoAtualizar={(registroId, campo, valor) => atualizarRegistro('compras', registroId, campo, valor)}
              />
            ) : (
              <TabelaRegistros
                registros={compras}
                colunas={COLUNAS_COMPRAS}
                aoAtualizar={(registroId, campo, valor) => atualizarRegistro('compras', registroId, campo, valor)}
                aoRemover={registroId => removerRegistro('compras', registroId)}
              />
            )}
            <Divisor />
            <Tabela className="shadow-none">
              <thead>
                <tr>
                  <Th>Critério</Th>
                  <Th className="text-right">Corretos</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Percentual</Th>
                </tr>
              </thead>
              <tbody>
                {comprasSorteadas && (
                  <tr>
                    <Td className="font-semibold">Compra com sucesso (Target)</Td>
                    <Td className="numeros-tabulares text-right">{comprasComSucesso}</Td>
                    <Td className="numeros-tabulares text-right">{totalCompras}</Td>
                    <Td className="numeros-tabulares text-right font-bold">{percentual(comprasComSucesso, totalCompras)}</Td>
                  </tr>
                )}
                <tr>
                  <Td className="font-semibold">Rota correta?</Td>
                  <Td className="numeros-tabulares text-right">{corretosRotaCompras}</Td>
                  <Td className="numeros-tabulares text-right">{totalCompras}</Td>
                  <Td className="numeros-tabulares text-right font-bold">{percentual(corretosRotaCompras, totalCompras)}</Td>
                </tr>
              </tbody>
            </Tabela>
            {!comprasSorteadas && <BotaoAdicionar onClick={() => adicionarRegistro('compras')}>Adicionar linha</BotaoAdicionar>}
          </>
        )}
      </Secao>

      {/* 3. Resultado */}
      <Secao numero={3} titulo="Resultado">
        <Selecao
          rotulo="Resultado da conferência"
          valor={resultado}
          aoMudar={setResultado}
          opcoes={OPCOES_RESULTADO_PT08}
          placeholder=""
        />
      </Secao>

      {/* 4. Observações */}
      <Secao numero={4} titulo="Observações">
        <AreaTexto
          rotulo="Observações"
          linhas={4}
          valor={observacoes}
          aoMudar={setObservacoes}
          placeholder="Informe observações da conferência..."
        />
      </Secao>

      {/* 5. Providência aplicada */}
      <Secao numero={5} titulo="Providência Aplicada">
        <AreaTexto
          rotulo="Providência aplicada"
          linhas={4}
          valor={providenciaAplicada}
          aoMudar={setProvidenciaAplicada}
          placeholder="Descreva a providência aplicada..."
        />
      </Secao>

      <RodapePapel numero={8} aoSalvarRascunho={() => salvar('rascunho')} aoFinalizar={() => salvar('finalizado')} />
      {aviso.elemento}
    </>
  );
}
