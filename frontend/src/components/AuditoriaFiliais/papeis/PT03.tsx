import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Dices, Loader2, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SeloStatus } from '@/components/ui/LayoutPagina';
import {
  AreaTexto, CabecalhoPapel, CLASSE_BOTAO_FILTRO, CLASSE_BOTAO_PRIMARIO, CLASSE_CONTROLE, Entrada, Grade, RodapePapel, Secao,
  SeletorResultado, useAviso,
} from '../componentes';
import { obterAuditoria, obterPapel, salvarPapel } from '../armazenamento';
import { novaSemente, ROTULO_MODALIDADE, sortearAmostra, type Modalidade, type ResultadoSorteio } from '../amostragem';
import { formatarData, formatarMoeda } from '../formatacao';
import { buscarPopulacaoVendas } from '../sispetro';
import { Tabela, Td, Th } from '../tabela';
import type { Resultado } from '../tipos';

type Amostra = {
  numeroNF: string;
  localizado: string;
  er: string;
  data: string;
  assinatura: string;
  rg: string;
  confOpe: string;
  /* Dados da nota sorteada no Sispetro (vazios quando a linha é digitada à mão). */
  sequencial?: string;
  serie?: string;
  dataNf?: string;
  cliente?: string;
  valor?: string;
  chaveAcesso?: string;
  modalidade?: Modalidade;
  complemento?: boolean;
};

/** Registro do sorteio, gravado junto com a amostra para comprovar como ela foi tirada. */
interface RegistroSorteio {
  filial: { nome: string; cnpj: string };
  de: string;
  ate: string;
  semente: number;
  meta: number;
  populacao: ResultadoSorteio['populacao'];
  avisos: string[];
  consultadoEm: string;
  sorteadoEm: string;
}

interface DadosPT03 {
  sorteio: RegistroSorteio | null;
  amostras: Amostra[];
  periodoInicio: string;
  periodoFim: string;
  totalNF: string;
  totalManifestadas: string;
  resultado: Resultado;
  observacoes: string;
  status: 'rascunho' | 'finalizado';
}

type CampoSelecaoAmostra = 'localizado' | 'er' | 'data' | 'assinatura' | 'rg' | 'confOpe';

const AMOSTRA_MANUAL = 30;
const criarAmostra = (): Amostra => ({ numeroNF: '', localizado: '', er: '', data: '', assinatura: '', rg: '', confOpe: '' });

const OPCOES_SIM_NAO = [
  { valor: 'sim', rotulo: 'SIM' },
  { valor: 'nao', rotulo: 'NÃO' },
];
const OPCOES_ER = [
  { valor: 'E', rotulo: 'E' },
  { valor: 'R', rotulo: 'R' },
];

/** Colunas de seleção da tabela, na ordem do original. */
const COLUNAS_SELECAO: { campo: CampoSelecaoAmostra; rotulo: string; opcoes: { valor: string; rotulo: string }[]; minimo: string }[] = [
  { campo: 'localizado', rotulo: 'Localizado?', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[110px]' },
  { campo: 'er', rotulo: 'E/R', opcoes: OPCOES_ER, minimo: 'min-w-[80px]' },
  { campo: 'data', rotulo: 'Data', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[110px]' },
  { campo: 'assinatura', rotulo: 'Assinatura', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[110px]' },
  { campo: 'rg', rotulo: 'RG', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[90px]' },
  { campo: 'confOpe', rotulo: 'Conf. Ope.', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[110px]' },
];

function contarCorretos(amostras: Amostra[], campo: CampoSelecaoAmostra) {
  return amostras.filter(amostra => {
    const valor = amostra[campo].toString().toLowerCase();
    return valor === 'sim' || valor === 'ok';
  }).length;
}

function calcularPercentual(corretos: number, total: number) {
  if (!total) return 0;
  return (corretos / total) * 100;
}

function formatarPercentual(valor: number) {
  return `${valor.toFixed(2).replace('.', ',')}%`;
}

/** Alguma conferência já foi marcada na amostra? (para avisar antes de sortear de novo) */
const temConferencia = (amostras: Amostra[]) =>
  amostras.some(a => COLUNAS_SELECAO.some(c => a[c.campo] !== ''));

/** Indicador de leitura: rótulo pequeno, valor grande e detalhe opcional. */
function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="pl-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{rotulo}</span>
      <span className="numeros-tabulares text-lg font-black text-slate-900 dark:text-slate-50">{valor}</span>
      {detalhe && <span className="numeros-tabulares text-sm text-slate-600 dark:text-slate-300">{detalhe}</span>}
    </div>
  );
}

export default function PT03() {
  const { id } = useParams();
  const aviso = useAviso();
  const [auditoria] = useState(() => (id ? obterAuditoria(id) : null));
  const [salvo] = useState(() => (id ? obterPapel<Partial<DadosPT03>>(id, 3) : null));

  const [sorteio, setSorteio] = useState<RegistroSorteio | null>(salvo?.sorteio ?? null);
  const [amostras, setAmostras] = useState<Amostra[]>(() =>
    Array.isArray(salvo?.amostras) && salvo.amostras.length > 0 ? salvo.amostras : Array.from({ length: AMOSTRA_MANUAL }, criarAmostra));
  const [amostraDe, setAmostraDe] = useState(salvo?.sorteio?.de ?? auditoria?.periodoInicio ?? '');
  const [amostraAte, setAmostraAte] = useState(salvo?.sorteio?.ate ?? auditoria?.periodoFim ?? '');
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  const [periodoInicio, setPeriodoInicio] = useState(salvo?.periodoInicio ?? '');
  const [periodoFim, setPeriodoFim] = useState(salvo?.periodoFim ?? '');
  const [totalNF, setTotalNF] = useState(salvo?.totalNF ?? '');
  const [totalManifestadas, setTotalManifestadas] = useState(salvo?.totalManifestadas ?? '');
  const [resultado, setResultado] = useState<Resultado>(salvo?.resultado ?? '');
  const [observacoes, setObservacoes] = useState(salvo?.observacoes ?? '');
  const [arquivo, setArquivo] = useState<File | null>(null);

  const cnpjFilial = auditoria?.cnpj ?? '';
  const periodoAmostraInvalido = amostraDe !== '' && amostraAte !== '' && amostraDe > amostraAte;
  const podeSortear = !!cnpjFilial && amostraDe !== '' && amostraAte !== '' && !periodoAmostraInvalido && !buscando;

  const atualizarAmostra = (index: number, campo: keyof Amostra, valor: string) =>
    setAmostras(atuais => atuais.map((a, i) => (i === index ? { ...a, [campo]: valor } : a)));

  const sortear = async () => {
    if (!podeSortear) return;
    if ((sorteio || temConferencia(amostras))
      && !window.confirm('Sortear de novo substitui a amostra atual e apaga as conferências já marcadas nela. Continuar?')) return;
    setBuscando(true);
    setErroBusca(null);
    try {
      const populacao = await buscarPopulacaoVendas(cnpjFilial, amostraDe, amostraAte);
      const r = sortearAmostra(populacao.notas, novaSemente());
      setAmostras(r.notas.map(n => ({
        ...criarAmostra(),
        numeroNF: n.numeroNf,
        sequencial: n.sequencial,
        serie: n.serie,
        dataNf: n.dataNf,
        cliente: n.cliente,
        valor: n.valor,
        chaveAcesso: n.chaveAcesso,
        modalidade: n.modalidade,
        complemento: n.complemento,
      })));
      setSorteio({
        filial: { nome: populacao.filial.nome, cnpj: populacao.filial.cnpj },
        de: populacao.de,
        ate: populacao.ate,
        semente: r.semente,
        meta: r.meta,
        populacao: r.populacao,
        avisos: r.avisos,
        consultadoEm: populacao.consultadoEm,
        sorteadoEm: new Date().toISOString(),
      });
      aviso.mostrar(`Amostra sorteada: ${r.notas.length} notas. Salve o PT03 para gravar.`);
    } catch (e) {
      setErroBusca(e instanceof Error ? e.message : 'Erro ao consultar o Sispetro.');
    } finally {
      setBuscando(false);
    }
  };

  const salvar = (status: DadosPT03['status']) => {
    if (!id) return;
    const dados: DadosPT03 = { sorteio, amostras, periodoInicio, periodoFim, totalNF, totalManifestadas, resultado, observacoes, status };
    salvarPapel(id, 3, dados);
    aviso.mostrar(status === 'rascunho' ? 'PT03 salvo como rascunho.' : 'PT03 finalizado.');
  };

  const totalAmostra = amostras.length;
  const resumo: { rotulo: string; campo: CampoSelecaoAmostra }[] = [
    { rotulo: 'Localizado', campo: 'localizado' },
    { rotulo: 'Data', campo: 'data' },
    { rotulo: 'Assinatura', campo: 'assinatura' },
    { rotulo: 'RG', campo: 'rg' },
    { rotulo: 'Conf. Ope.', campo: 'confOpe' },
  ];

  const numeroTotalNF = Number(totalNF) || 0;
  const numeroManifestadas = Number(totalManifestadas) || 0;
  const numeroNaoManifestadas = Math.max(numeroTotalNF - numeroManifestadas, 0);
  const percentualManifestada = numeroTotalNF > 0 ? (numeroManifestadas / numeroTotalNF) * 100 : 0;

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={3} descricao="Conferência dos canhotos e manifestação das notas fiscais." />

      <Secao titulo="Manifestação das Notas Fiscais" descricao="Informe o período completo analisado e o resumo da manifestação das NF-es de venda.">
        <Grade colunas={2}>
          <Entrada rotulo="Início do período" type="date" valor={periodoInicio} aoMudar={setPeriodoInicio} />
          <Entrada rotulo="Fim do período" type="date" valor={periodoFim} aoMudar={setPeriodoFim} />
        </Grade>
        <Grade colunas={4}>
          <Entrada rotulo="Total de NF-es (venda)" type="number" valor={totalNF} aoMudar={setTotalNF} />
          <Entrada rotulo="Total NFe manifestadas (confirmação)" type="number" valor={totalManifestadas} aoMudar={setTotalManifestadas} />
          <Entrada rotulo="Total NFe não manifestadas" valor={numeroNaoManifestadas ? String(numeroNaoManifestadas) : ''} />
          <Indicador rotulo="% Manifestada" valor={formatarPercentual(percentualManifestada)} />
        </Grade>
      </Secao>

      <Secao
        titulo="Seleção da amostra (Sispetro)"
        descricao="Notas de venda da filial no período (NF-e não canceladas). São sorteadas 15 com modalidade Retira e 15 com Entrega; se faltar numa, completa com a outra."
      >
        {!cnpjFilial && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            Esta auditoria foi criada antes da lista de filiais e não tem o CNPJ da filial, então não dá para consultar o Sispetro. Crie uma nova auditoria escolhendo a filial na lista, ou preencha a amostra à mão abaixo.
          </p>
        )}
        <Grade colunas={3}>
          <Entrada rotulo="Filial" valor={auditoria ? (cnpjFilial ? `${auditoria.filial} · ${cnpjFilial}` : auditoria.filial) : '-'} />
          <Entrada rotulo="Data inicial da amostragem" type="date" valor={amostraDe} aoMudar={setAmostraDe} />
          <Entrada rotulo="Data final da amostragem" type="date" valor={amostraAte} aoMudar={setAmostraAte} />
        </Grade>
        {periodoAmostraInvalido && <p role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">A data inicial está depois da data final.</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={sortear} disabled={!podeSortear} className={CLASSE_BOTAO_PRIMARIO}>
            {buscando ? <Loader2 size={15} className="animate-spin" /> : <Dices size={15} />}
            {buscando ? 'Consultando o Sispetro...' : sorteio ? 'Sortear de novo' : 'Buscar no Sispetro e sortear'}
          </button>
          {erroBusca && <span role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">{erroBusca}</span>}
        </div>

        {sorteio && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/30">
            <Grade colunas={5}>
              <Indicador rotulo="População · Retira" valor={sorteio.populacao.retira.toLocaleString('pt-BR')} />
              <Indicador rotulo="População · Entrega" valor={sorteio.populacao.entrega.toLocaleString('pt-BR')} />
              <Indicador rotulo="Notas de venda" valor={sorteio.populacao.total.toLocaleString('pt-BR')} detalhe={`${formatarData(sorteio.de)} a ${formatarData(sorteio.ate)}`} />
              <Indicador rotulo="Amostra" valor={`${totalAmostra} de ${sorteio.meta}`} />
              <Indicador
                rotulo="Sorteio"
                valor={`#${sorteio.semente}`}
                detalhe={new Date(sorteio.sorteadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              />
            </Grade>
            {sorteio.avisos.length > 0 && (
              <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                {sorteio.avisos.map(a => (
                  <li key={a} className="flex items-start gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{a}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Secao>

      <Secao
        titulo="Amostragem dos Canhotos"
        descricao={sorteio ? `Amostra de ${totalAmostra} notas fiscais sorteadas no Sispetro.` : `Amostra de ${AMOSTRA_MANUAL} notas fiscais (sorteie acima ou digite os números).`}
      >
        {totalAmostra === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma nota na amostra.</p>
        ) : (
          <Tabela className="shadow-none">
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Número NF</Th>
                {sorteio && <><Th>Emissão</Th><Th>Cliente</Th><Th className="text-right">Valor</Th><Th>Modalidade</Th></>}
                {COLUNAS_SELECAO.map(c => <Th key={c.campo}>{c.rotulo}</Th>)}
              </tr>
            </thead>
            <tbody>
              {amostras.map((amostra, index) => (
                <tr key={amostra.sequencial ?? index}>
                  <Td className="numeros-tabulares py-2 text-xs text-slate-400">{String(index + 1).padStart(2, '0')}</Td>
                  <Td className="min-w-[110px] py-2">
                    {amostra.sequencial ? (
                      <span className="numeros-tabulares font-bold text-slate-900 dark:text-slate-50" title={amostra.chaveAcesso || undefined}>
                        {amostra.numeroNF}{amostra.serie ? <span className="font-normal text-slate-400">-{amostra.serie}</span> : null}
                      </span>
                    ) : (
                      <input
                        value={amostra.numeroNF}
                        onChange={e => atualizarAmostra(index, 'numeroNF', e.target.value)}
                        placeholder={String(index + 1).padStart(2, '0')}
                        aria-label={`Número NF - linha ${index + 1}`}
                        className={CLASSE_CONTROLE}
                      />
                    )}
                  </Td>
                  {sorteio && (
                    <>
                      <Td className="numeros-tabulares whitespace-nowrap py-2">{formatarData(amostra.dataNf)}</Td>
                      <Td className="max-w-[220px] truncate py-2" >{amostra.cliente || '-'}</Td>
                      <Td className="numeros-tabulares whitespace-nowrap py-2 text-right">{formatarMoeda(amostra.valor)}</Td>
                      <Td className="whitespace-nowrap py-2">
                        {amostra.modalidade ? (
                          <span className="inline-flex items-center gap-1">
                            <SeloStatus tom={amostra.modalidade === 'R' ? 'info' : 'neutro'}>{ROTULO_MODALIDADE[amostra.modalidade]}</SeloStatus>
                            {amostra.complemento && <SeloStatus tom="atencao">complemento</SeloStatus>}
                          </span>
                        ) : '-'}
                      </Td>
                    </>
                  )}
                  {COLUNAS_SELECAO.map(c => (
                    <Td key={c.campo} className={cn(c.minimo, 'py-2')}>
                      <select
                        value={amostra[c.campo]}
                        onChange={e => atualizarAmostra(index, c.campo, e.target.value)}
                        aria-label={`${c.rotulo} - linha ${index + 1}`}
                        className={cn(CLASSE_CONTROLE, 'w-full')}
                      >
                        <option value="">-</option>
                        {c.opcoes.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
                      </select>
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Tabela>
        )}
      </Secao>

      <Secao titulo="Resumo da amostragem">
        <Grade colunas={5}>
          {resumo.map(r => {
            const corretos = contarCorretos(amostras, r.campo);
            return (
              <Indicador
                key={r.campo}
                rotulo={r.rotulo}
                valor={formatarPercentual(calcularPercentual(corretos, totalAmostra))}
                detalhe={`${corretos}/${totalAmostra}`}
              />
            );
          })}
        </Grade>
      </Secao>

      <Secao titulo="Resultado da conferência">
        <SeletorResultado valor={resultado} aoMudar={setResultado} />
      </Secao>

      <Secao titulo="Observações">
        <AreaTexto rotulo="Observações da conferência" linhas={4} valor={observacoes} aoMudar={setObservacoes} />
      </Secao>

      <Secao titulo="Evidências" descricao="Anexe, se necessário, os canhotos utilizados na amostra.">
        {/* Como no original: o seletor aceita vários arquivos, mas só o primeiro é guardado (e o anexo ainda não é gravado). */}
        <div className="flex flex-wrap items-center gap-3">
          <label className={cn(CLASSE_BOTAO_FILTRO, 'cursor-pointer')}>
            <Paperclip size={14} /> Anexar arquivo
            <input type="file" hidden multiple onChange={e => setArquivo(e.target.files?.[0] ?? null)} />
          </label>
          {arquivo && (
            <span className="inline-flex items-center gap-1.5 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
              <Paperclip size={13} className="text-slate-400" /> {arquivo.name}
            </span>
          )}
        </div>
      </Secao>

      <RodapePapel numero={3} aoSalvarRascunho={() => salvar('rascunho')} aoFinalizar={() => salvar('finalizado')} />
      {aviso.elemento}
    </>
  );
}
