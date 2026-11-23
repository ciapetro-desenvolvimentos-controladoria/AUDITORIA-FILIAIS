import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaTexto, CabecalhoPapel, CLASSE_BOTAO_FILTRO, CLASSE_CONTROLE, Entrada, Grade, RodapePapel, Secao, SeletorResultado,
} from '../componentes';
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
};

type CampoSelecaoAmostra = Exclude<keyof Amostra, 'numeroNF'>;

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
  { campo: 'localizado', rotulo: 'Localizado?', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[130px]' },
  { campo: 'er', rotulo: 'E/R', opcoes: OPCOES_ER, minimo: 'min-w-[100px]' },
  { campo: 'data', rotulo: 'Data', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[130px]' },
  { campo: 'assinatura', rotulo: 'Assinatura', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[130px]' },
  { campo: 'rg', rotulo: 'RG', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[100px]' },
  { campo: 'confOpe', rotulo: 'Conf. Ope.', opcoes: OPCOES_SIM_NAO, minimo: 'min-w-[130px]' },
];

function contarCorretos(amostras: Amostra[], campo: keyof Amostra) {
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

  const [amostras, setAmostras] = useState<Amostra[]>(() => Array.from({ length: 30 }, criarAmostra));
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [totalNF, setTotalNF] = useState('');
  const [totalManifestadas, setTotalManifestadas] = useState('');
  const [resultado, setResultado] = useState<Resultado>('');
  const [observacoes, setObservacoes] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);

  const atualizarAmostra = (index: number, campo: keyof Amostra, valor: string) =>
    setAmostras(atuais => atuais.map((a, i) => (i === index ? { ...a, [campo]: valor } : a)));

  const totalAmostra = amostras.length;
  const resumo: { rotulo: string; campo: keyof Amostra }[] = [
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

      <Secao titulo="Amostragem dos Canhotos" descricao="Amostra de 30 notas fiscais.">
        <Tabela className="shadow-none">
          <thead>
            <tr>
              <Th>Número NF</Th>
              {COLUNAS_SELECAO.map(c => <Th key={c.campo}>{c.rotulo}</Th>)}
            </tr>
          </thead>
          <tbody>
            {amostras.map((amostra, index) => (
              <tr key={index}>
                <Td className="min-w-[130px] py-2">
                  <input
                    value={amostra.numeroNF}
                    onChange={e => atualizarAmostra(index, 'numeroNF', e.target.value)}
                    placeholder={String(index + 1).padStart(2, '0')}
                    className={CLASSE_CONTROLE}
                  />
                </Td>
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
                detalhe={`${corretos}/30`}
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
        {/* Como no original: o seletor aceita vários arquivos, mas só o primeiro é guardado. */}
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

      {/* Como na versão anterior, o PT03 ainda não grava (os botões não têm ação). */}
      <RodapePapel numero={3} />
    </>
  );
}
