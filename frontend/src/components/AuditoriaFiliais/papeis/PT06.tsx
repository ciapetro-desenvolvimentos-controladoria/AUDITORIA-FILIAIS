import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AreaTexto, Bloco, BotaoAdicionar, BotaoRemover, CabecalhoPapel, CLASSE_CONTROLE, Entrada, Grade,
  RodapePapel, Secao, useAviso,
} from '../componentes';
import { Tabela, Td, Th } from '../tabela';
import { obterPapel, salvarPapel } from '../armazenamento';

type Produto = 'Diesel' | 'Gasolina';
type Volume = 300 | 500;
type SituacaoCaixa = 'Fechada' | 'Aberta';

type EstoqueAditivo = {
  id: number;
  produto: Produto;
  volume: Volume;
  lote: string;
  validade: string;
  situacao: SituacaoCaixa;
  quantidadeFrascos: string;
  mlPorFrasco: string;
};

/** Formato gravado (mesmo da versão anterior, chave auditoria_<id>_pt06). */
type DadosPT06 = {
  itens: EstoqueAditivo[];
  estoqueSistemaDiesel: string;
  estoqueSistemaGasolina: string;
  responsavel: string;
  data: string;
  observacoes: string;
  status: 'rascunho' | 'finalizado';
};

const criarLinha = (id: number): EstoqueAditivo => ({
  id,
  produto: 'Diesel',
  volume: 500,
  lote: '',
  validade: '',
  situacao: 'Fechada',
  quantidadeFrascos: '',
  mlPorFrasco: '',
});

function calcularLitros(item: EstoqueAditivo): number {
  const quantidade = Number(item.quantidadeFrascos);
  const ml = Number(item.mlPorFrasco);
  if (!Number.isFinite(quantidade) || !Number.isFinite(ml)) return 0;
  if (quantidade <= 0 || ml <= 0) return 0;
  return (quantidade * ml) / 1000;
}

/** Cartão de número em destaque (resumo do estoque). */
function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/30">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{rotulo}</p>
      <p className="numeros-tabulares mt-1 text-2xl font-black text-slate-900 dark:text-slate-50">{valor}</p>
    </div>
  );
}

/** Linha "rótulo: valor" usada na conferência com o sistema. */
function LinhaValor({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <p className={cn('text-sm text-slate-700 dark:text-slate-200', destaque && 'font-bold')}>
      {rotulo}: <span className="numeros-tabulares">{valor}</span>
    </p>
  );
}

export default function PT06() {
  const { id } = useParams();
  const aviso = useAviso();

  // Carrega uma vez o que já foi salvo (mesmas regras do código anterior: só aplica campos preenchidos).
  const [salvo] = useState(() => (id ? obterPapel<Partial<DadosPT06>>(id, 6) : null));

  const [itens, setItens] = useState<EstoqueAditivo[]>(
    () => salvo?.itens || [criarLinha(1), criarLinha(2), criarLinha(3)],
  );
  const [estoqueSistemaDiesel, setEstoqueSistemaDiesel] = useState(salvo?.estoqueSistemaDiesel || '');
  const [estoqueSistemaGasolina, setEstoqueSistemaGasolina] = useState(salvo?.estoqueSistemaGasolina || '');
  const [responsavel, setResponsavel] = useState(salvo?.responsavel || '');
  const [data, setData] = useState(salvo?.data || '');
  const [observacoes, setObservacoes] = useState(salvo?.observacoes || '');

  const atualizarItem = (itemId: number, campo: keyof EstoqueAditivo, valor: string) => {
    setItens(atual => atual.map(item => (item.id !== itemId ? item : { ...item, [campo]: valor })));
  };

  const atualizarValidade = (itemId: number, valor: string) => {
    let numeros = valor.replace(/\D/g, '');
    if (numeros.length > 6) numeros = numeros.slice(0, 6);
    let formatado = numeros;
    if (numeros.length > 2) formatado = numeros.slice(0, 2) + '/' + numeros.slice(2);
    atualizarItem(itemId, 'validade', formatado);
  };

  const adicionarItem = () => {
    const novoId = itens.length > 0 ? Math.max(...itens.map(item => item.id)) + 1 : 1;
    setItens(atual => [...atual, criarLinha(novoId)]);
  };

  const removerItem = (itemId: number) => {
    setItens(atual => atual.filter(item => item.id !== itemId));
  };

  const totalDiesel = itens.filter(item => item.produto === 'Diesel').reduce((total, item) => total + calcularLitros(item), 0);
  const totalGasolina = itens.filter(item => item.produto === 'Gasolina').reduce((total, item) => total + calcularLitros(item), 0);

  const sistemaDiesel = Number(estoqueSistemaDiesel) || 0;
  const sistemaGasolina = Number(estoqueSistemaGasolina) || 0;
  const diferencaDiesel = totalDiesel - sistemaDiesel;
  const diferencaGasolina = totalGasolina - sistemaGasolina;

  const salvar = (status: 'rascunho' | 'finalizado') => {
    if (!id) return;
    const dados: DadosPT06 = {
      itens,
      estoqueSistemaDiesel,
      estoqueSistemaGasolina,
      responsavel,
      data,
      observacoes,
      status,
    };
    salvarPapel(id, 6, dados);
    aviso.mostrar(status === 'rascunho' ? 'PT06 salvo como rascunho.' : 'PT06 finalizado.');
  };

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={6} descricao="Conferência Estoque de Aditivos" />

      {/* 1. Resumo */}
      <Secao numero={1} titulo="Resumo do Estoque">
        <Grade colunas={3}>
          <Indicador rotulo="Diesel - Contagem" valor={`${totalDiesel.toFixed(3)} L`} />
          <Indicador rotulo="Gasolina - Contagem" valor={`${totalGasolina.toFixed(3)} L`} />
          <Indicador rotulo="Total Geral" valor={`${(totalDiesel + totalGasolina).toFixed(3)} L`} />
        </Grade>
      </Secao>

      {/* 2. Estoque */}
      <Secao
        numero={2}
        titulo="Estoque de Aditivos"
        descricao="Informe o estoque físico encontrado na filial, considerando lote, validade, situação da caixa e quantidade de produto."
      >
        <Tabela className="shadow-none">
          <thead>
            <tr>
              <Th className="px-2">Produto</Th>
              <Th className="px-2">Volume</Th>
              <Th className="px-2">Lote</Th>
              <Th className="px-2">Validade</Th>
              <Th className="px-2">Caixa</Th>
              <Th className="px-2">Frascos</Th>
              <Th className="px-2">ML/frasco</Th>
              <Th className="px-2 text-right">Total L</Th>
              <Th className="px-2" />
            </tr>
          </thead>
          <tbody>
            {itens.map(item => (
              <tr key={item.id}>
                <Td className="px-2 py-2">
                  <select
                    aria-label="Produto"
                    value={item.produto}
                    onChange={e => atualizarItem(item.id, 'produto', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[7rem]')}
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Gasolina">Gasolina</option>
                  </select>
                </Td>
                <Td className="px-2 py-2">
                  <select
                    aria-label="Volume"
                    value={item.volume}
                    onChange={e => atualizarItem(item.id, 'volume', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[6rem]')}
                  >
                    <option value={300}>300 ml</option>
                    <option value={500}>500 ml</option>
                  </select>
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Lote"
                    placeholder="Lote"
                    value={item.lote}
                    onChange={e => atualizarItem(item.id, 'lote', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[7rem]')}
                  />
                </Td>
                <Td className="px-2 py-2">
                  {/* Validade MM/AAAA */}
                  <input
                    aria-label="Validade"
                    placeholder="MM/AAAA"
                    inputMode="numeric"
                    value={item.validade}
                    onChange={e => atualizarValidade(item.id, e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[7.5rem]')}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <select
                    aria-label="Caixa"
                    value={item.situacao}
                    onChange={e => atualizarItem(item.id, 'situacao', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[7rem]')}
                  >
                    <option value="Fechada">Fechada</option>
                    <option value="Aberta">Aberta</option>
                  </select>
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Frascos"
                    type="number"
                    placeholder="Qtd."
                    value={item.quantidadeFrascos}
                    onChange={e => atualizarItem(item.id, 'quantidadeFrascos', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[6rem]')}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="ML/frasco"
                    type="number"
                    placeholder="ML"
                    value={item.mlPorFrasco}
                    onChange={e => atualizarItem(item.id, 'mlPorFrasco', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[6rem]')}
                  />
                </Td>
                <Td className="numeros-tabulares whitespace-nowrap px-2 py-2 text-right font-bold">
                  {calcularLitros(item).toFixed(3)} L
                </Td>
                <Td className="w-10 px-2 py-2">
                  {itens.length > 1 && <BotaoRemover rotulo="Remover linha" onClick={() => removerItem(item.id)} />}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
        <BotaoAdicionar onClick={adicionarItem}>Adicionar linha</BotaoAdicionar>
      </Secao>

      {/* 3. Conferência com o sistema */}
      <Secao numero={3} titulo="Conferência com o Sistema">
        <Grade colunas={2}>
          <Bloco titulo="Aditivo Diesel">
            <Entrada rotulo="Sistema - Litros" type="number" valor={estoqueSistemaDiesel} aoMudar={setEstoqueSistemaDiesel} />
            <LinhaValor rotulo="Contagem" valor={`${totalDiesel.toFixed(3)} L`} destaque />
            <LinhaValor rotulo="Diferença" valor={`${diferencaDiesel.toFixed(3)} L`} />
          </Bloco>
          <Bloco titulo="Aditivo Gasolina">
            <Entrada rotulo="Sistema - Litros" type="number" valor={estoqueSistemaGasolina} aoMudar={setEstoqueSistemaGasolina} />
            <LinhaValor rotulo="Contagem" valor={`${totalGasolina.toFixed(3)} L`} destaque />
            <LinhaValor rotulo="Diferença" valor={`${diferencaGasolina.toFixed(3)} L`} />
          </Bloco>
        </Grade>
      </Secao>

      {/* 4. Levantamento */}
      <Secao numero={4} titulo="Levantamento">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Entrada rotulo="Levantamento realizado por" valor={responsavel} aoMudar={setResponsavel} classeCampo="sm:col-span-2" />
          <Entrada rotulo="Data" type="date" valor={data} aoMudar={setData} />
        </div>
      </Secao>

      {/* 5. Observações */}
      <Secao numero={5} titulo="Observações">
        <AreaTexto
          rotulo="Observações"
          linhas={4}
          valor={observacoes}
          aoMudar={setObservacoes}
          placeholder="Informe observações da conferência..."
        />
      </Secao>

      <RodapePapel numero={6} aoSalvarRascunho={() => salvar('rascunho')} aoFinalizar={() => salvar('finalizado')} />
      {aviso.elemento}
    </>
  );
}
