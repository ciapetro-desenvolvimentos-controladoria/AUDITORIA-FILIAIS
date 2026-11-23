import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AreaTexto, BotaoAdicionar, BotaoRemover, CabecalhoPapel, CLASSE_CONTROLE, Divisor, Entrada, Grade,
  RodapePapel, Secao, Selecao, Subtitulo, useAviso,
} from '../componentes';
import { Tabela, Td, Th } from '../tabela';
import { obterPapel, salvarPapel } from '../armazenamento';

type PosicaoOC = {
  id: number;
  oc: string;
  carregado: string;
  chegouDestino: string;
  horarioPreenchimento: string;
  observacoes: string;
};

/** Formato gravado (mesmo da versão anterior, chave auditoria_<id>_pt07). */
type DadosPT07 = {
  posicoes: PosicaoOC[];
  periodoInicio: string;
  periodoFim: string;
  resultado: string;
  observacoes: string;
  providenciaAplicada: string;
  status: 'rascunho' | 'finalizado';
};

const QUANTIDADE_PADRAO_OCS = 30;

const OPCOES_RESULTADO_PT07 = ['De acordo', 'Parcialmente de acordo', 'Desacordo'];

const criarPosicao = (id: number): PosicaoOC => ({
  id,
  oc: '',
  carregado: '',
  chegouDestino: '',
  horarioPreenchimento: '',
  observacoes: '',
});

const criarPosicoes = (quantidade: number): PosicaoOC[] =>
  Array.from({ length: quantidade }, (_, index) => criarPosicao(index + 1));

const ehCorreto = (valor: string): boolean => {
  const normalizado = valor.trim().toLowerCase();
  return normalizado === 'sim' || normalizado === 'ok';
};

const calcularPercentual = (corretos: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((corretos / total) * 100).toFixed(2).replace('.', ',')}%`;
};

export default function PT07() {
  const { id } = useParams();
  const aviso = useAviso();

  // Carrega uma vez o que já foi salvo (mesmas regras do código anterior: só aplica campos preenchidos).
  const [salvo] = useState(() => (id ? obterPapel<Partial<DadosPT07>>(id, 7) : null));

  const [posicoes, setPosicoes] = useState<PosicaoOC[]>(() => {
    const posicoesSalvas = salvo?.posicoes;
    return Array.isArray(posicoesSalvas) && posicoesSalvas.length > 0 ? posicoesSalvas : criarPosicoes(QUANTIDADE_PADRAO_OCS);
  });
  const [periodoInicio, setPeriodoInicio] = useState(salvo?.periodoInicio || '');
  const [periodoFim, setPeriodoFim] = useState(salvo?.periodoFim || '');
  const [resultado, setResultado] = useState(salvo?.resultado || 'De acordo');
  const [observacoes, setObservacoes] = useState(salvo?.observacoes || '');
  const [providenciaAplicada, setProvidenciaAplicada] = useState(salvo?.providenciaAplicada || '');

  const atualizarPosicao = (posicaoId: number, campo: keyof PosicaoOC, valor: string) => {
    setPosicoes(atual => atual.map(posicao => (posicao.id === posicaoId ? { ...posicao, [campo]: valor } : posicao)));
  };

  const adicionarPosicao = () => {
    const novoId = posicoes.length > 0 ? Math.max(...posicoes.map(posicao => posicao.id)) + 1 : 1;
    setPosicoes(atual => [...atual, criarPosicao(novoId)]);
  };

  const removerPosicao = (posicaoId: number) => {
    setPosicoes(atual => atual.filter(posicao => posicao.id !== posicaoId));
  };

  // Cada critério possui sua própria totalidade e percentual.
  // Não existe percentual geral somando os três critérios.
  const totalOCs = posicoes.length;
  const corretosCarregado = posicoes.filter(posicao => ehCorreto(posicao.carregado)).length;
  const corretosDestino = posicoes.filter(posicao => ehCorreto(posicao.chegouDestino)).length;
  const corretosHorario = posicoes.filter(posicao => ehCorreto(posicao.horarioPreenchimento)).length;

  const resumo = [
    { criterio: 'Carregado', corretos: corretosCarregado },
    { criterio: 'Chegou ao Destino', corretos: corretosDestino },
    { criterio: 'Horário de Preenchimento', corretos: corretosHorario },
  ];

  const salvar = (status: 'rascunho' | 'finalizado') => {
    if (!id) return;
    const dados: DadosPT07 = {
      posicoes,
      periodoInicio,
      periodoFim,
      resultado,
      observacoes,
      providenciaAplicada,
      status,
    };
    salvarPapel(id, 7, dados);
    aviso.mostrar(status === 'rascunho' ? 'PT07 salvo como rascunho.' : 'PT07 finalizado.');
  };

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={7} descricao="Conferência Posição OC" />

      {/* 1. Período */}
      <Secao numero={1} titulo="Período Analisado">
        <Grade colunas={2}>
          <Entrada rotulo="Data inicial" type="date" valor={periodoInicio} aoMudar={setPeriodoInicio} />
          <Entrada rotulo="Data final" type="date" valor={periodoFim} aoMudar={setPeriodoFim} />
        </Grade>
      </Secao>

      {/* 2. Conferência */}
      <Secao
        numero={2}
        titulo="Conferência Posição OC"
        descricao="São consideradas 30 OCs por padrão. Quando a população disponível possuir menos OCs, serão utilizadas apenas as OCs existentes. Nos critérios Carregado, Chegou ao Destino e Horário de Preenchimento, os valores SIM ou OK são considerados corretos."
      >
        <Tabela className="shadow-none">
          <thead>
            <tr>
              <Th className="px-2">OC</Th>
              <Th className="px-2">Carregado</Th>
              <Th className="px-2">Chegou ao Destino</Th>
              <Th className="px-2">Horário Preenchimento</Th>
              <Th className="px-2">Observações</Th>
              <Th className="px-2" />
            </tr>
          </thead>
          <tbody>
            {posicoes.map(posicao => (
              <tr key={posicao.id}>
                <Td className="px-2 py-2">
                  <input
                    aria-label="OC"
                    placeholder="OC"
                    value={posicao.oc}
                    onChange={e => atualizarPosicao(posicao.id, 'oc', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[6rem]')}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Carregado"
                    placeholder="SIM / OK"
                    value={posicao.carregado}
                    onChange={e => atualizarPosicao(posicao.id, 'carregado', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[7rem]')}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Chegou ao Destino"
                    placeholder="SIM / OK"
                    value={posicao.chegouDestino}
                    onChange={e => atualizarPosicao(posicao.id, 'chegouDestino', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[7rem]')}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Horário Preenchimento"
                    placeholder="SIM / OK"
                    value={posicao.horarioPreenchimento}
                    onChange={e => atualizarPosicao(posicao.id, 'horarioPreenchimento', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[7rem]')}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Observações"
                    placeholder="Observações"
                    value={posicao.observacoes}
                    onChange={e => atualizarPosicao(posicao.id, 'observacoes', e.target.value)}
                    className={cn(CLASSE_CONTROLE, 'min-w-[12rem]')}
                  />
                </Td>
                <Td className="w-10 px-2 py-2">
                  {posicoes.length > 1 && <BotaoRemover rotulo="Remover linha" onClick={() => removerPosicao(posicao.id)} />}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>

        <Divisor />

        <Subtitulo>Resumo da Conferência</Subtitulo>
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
            {resumo.map(linha => (
              <tr key={linha.criterio}>
                <Td className="font-semibold">{linha.criterio}</Td>
                <Td className="numeros-tabulares text-right">{linha.corretos}</Td>
                <Td className="numeros-tabulares text-right">{totalOCs}</Td>
                <Td className="numeros-tabulares text-right font-bold">{calcularPercentual(linha.corretos, totalOCs)}</Td>
              </tr>
            ))}
          </tbody>
        </Tabela>

        <BotaoAdicionar onClick={adicionarPosicao}>Adicionar linha</BotaoAdicionar>
      </Secao>

      {/* 3. Resultado */}
      <Secao numero={3} titulo="Resultado">
        <Selecao
          rotulo="Resultado da conferência"
          valor={resultado}
          aoMudar={setResultado}
          opcoes={OPCOES_RESULTADO_PT07}
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

      <RodapePapel numero={7} aoSalvarRascunho={() => salvar('rascunho')} aoFinalizar={() => salvar('finalizado')} />
      {aviso.elemento}
    </>
  );
}
