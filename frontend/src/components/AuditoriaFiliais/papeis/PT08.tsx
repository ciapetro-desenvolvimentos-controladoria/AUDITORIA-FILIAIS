import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AreaTexto, BotaoAdicionar, BotaoRemover, CabecalhoPapel, CLASSE_CONTROLE, Divisor, Entrada, Grade,
  RodapePapel, Secao, Selecao, useAviso,
} from '../componentes';
import { Tabela, Td, Th } from '../tabela';
import { obterPapel, salvarPapel } from '../armazenamento';

type RegistroPedagio = {
  id: number;
  oc: string;
  carga: string;
  status: string;
  rota: string;
  motivo: string;
  rotaCorreta: string;
  observacoes: string;
};

type TipoRegistro = 'cancelados' | 'compras';

/** Formato gravado (mesmo da versão anterior, chave auditoria_<id>_pt08). */
type DadosPT08 = {
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

  const [periodoInicio, setPeriodoInicio] = useState(salvo?.periodoInicio || '');
  const [periodoFim, setPeriodoFim] = useState(salvo?.periodoFim || '');

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

  const salvar = (status: 'rascunho' | 'finalizado') => {
    if (!id) return;
    const dados: DadosPT08 = {
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Amostra de 20 Pedágios Comprados/Confirmados.</p>
            <TabelaRegistros
              registros={compras}
              colunas={COLUNAS_COMPRAS}
              aoAtualizar={(registroId, campo, valor) => atualizarRegistro('compras', registroId, campo, valor)}
              aoRemover={registroId => removerRegistro('compras', registroId)}
            />
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
                <tr>
                  <Td className="font-semibold">Rota correta?</Td>
                  <Td className="numeros-tabulares text-right">{corretosRotaCompras}</Td>
                  <Td className="numeros-tabulares text-right">{totalCompras}</Td>
                  <Td className="numeros-tabulares text-right font-bold">{percentual(corretosRotaCompras, totalCompras)}</Td>
                </tr>
              </tbody>
            </Tabela>
            <BotaoAdicionar onClick={() => adicionarRegistro('compras')}>Adicionar linha</BotaoAdicionar>
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
