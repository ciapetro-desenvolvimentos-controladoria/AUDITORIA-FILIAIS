import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AreaTexto, BotaoAdicionar, BotaoRemover, CabecalhoPapel, CLASSE_CONTROLE, Entrada, Grade,
  RodapePapel, Secao, Selecao, useAviso,
} from '../componentes';
import { Tabela, Td, Th } from '../tabela';
import { obterPapel, salvarPapel } from '../armazenamento';

type Resultado = 'De acordo' | 'Parcialmente de acordo' | 'Desacordo';

const OPCOES_RESULTADO_PT: Resultado[] = ['De acordo', 'Parcialmente de acordo', 'Desacordo'];

type Registro = {
  id: number;
  numeroNFe: string;
  dataNFe: string;
  operacao: string;
  numeroMDFe: string;
  dataMDFe: string;
};

type PT11Data = {
  registros: Registro[];
  responsavel: string;
  data: string;
  resultado: Resultado;
  observacoes: string;
  providenciaAplicada: string;
  status: 'rascunho' | 'finalizado';
};

const criarLinha = (id: number): Registro => ({
  id,
  numeroNFe: '',
  dataNFe: '',
  operacao: 'S',
  numeroMDFe: '',
  dataMDFe: '',
});

export default function PT11() {
  const { id } = useParams();
  const aviso = useAviso();

  // Dados salvos lidos uma vez, na abertura (mesmas regras do carregamento anterior).
  const [salvo] = useState(() => (id ? obterPapel<PT11Data>(id, 11) : null));
  const [registros, setRegistros] = useState<Registro[]>(() => salvo?.registros || 
    Array.from({ length: 20 }, (_, index) => criarLinha(index + 1)),
  );
  const [responsavel, setResponsavel] = useState(salvo?.responsavel || '');
  const [data, setData] = useState(salvo?.data || '');
  const [resultado, setResultado] = useState<Resultado>(salvo?.resultado || 'De acordo');
  const [observacoes, setObservacoes] = useState(salvo?.observacoes || '');
  const [providenciaAplicada, setProvidenciaAplicada] = useState(salvo?.providenciaAplicada || '');


  const atualizarRegistro = (registroId: number, campo: keyof Registro, valor: string) =>
    setRegistros(atual => atual.map(r => (r.id === registroId ? { ...r, [campo]: valor } : r)));

  const adicionarRegistro = () => {
    const novoId = registros.length > 0 ? Math.max(...registros.map(r => r.id)) + 1 : 1;
    setRegistros(atual => [...atual, criarLinha(novoId)]);
  };

  const removerRegistro = (registroId: number) =>
    setRegistros(atual => atual.filter(r => r.id !== registroId));

  const salvar = (status: 'rascunho' | 'finalizado') => {
    if (!id) return;
    const dados: PT11Data = { registros, responsavel, data, resultado, observacoes, providenciaAplicada, status };
    salvarPapel(id, 11, dados);
    aviso.mostrar(status === 'rascunho' ? 'PT11 salvo como rascunho.' : 'PT11 finalizado.');
  };

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={11} descricao="Conferência Emissão/Encerramento MDF-e" />

      <Secao
        numero={1}
        titulo="Amostragem Emissão/Encerramento MDF-e"
        descricao="Confira as NF-e selecionadas e verifique a emissão e o encerramento do MDF-e correspondente."
      >
        <Tabela>
          <thead>
            <tr>
              <Th className="min-w-[130px]">Nº NF-e</Th>
              <Th className="min-w-[150px]">Data NF-e</Th>
              <Th className="min-w-[100px]">Operação</Th>
              <Th className="min-w-[140px]">Nº MDF-e</Th>
              <Th className="min-w-[150px]">Data MDF-e</Th>
              <Th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {registros.map(item => (
              <tr key={item.id}>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Nº NF-e"
                    className={CLASSE_CONTROLE}
                    value={item.numeroNFe}
                    onChange={e => atualizarRegistro(item.id, 'numeroNFe', e.target.value)}
                    placeholder="NF-e"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Data NF-e"
                    type="date"
                    className={CLASSE_CONTROLE}
                    value={item.dataNFe}
                    onChange={e => atualizarRegistro(item.id, 'dataNFe', e.target.value)}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <select
                    aria-label="Operação"
                    className={CLASSE_CONTROLE}
                    value={item.operacao}
                    onChange={e => atualizarRegistro(item.id, 'operacao', e.target.value)}
                  >
                    <option value="S">S</option>
                    <option value="E">E</option>
                  </select>
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Nº MDF-e"
                    className={CLASSE_CONTROLE}
                    value={item.numeroMDFe}
                    onChange={e => atualizarRegistro(item.id, 'numeroMDFe', e.target.value)}
                    placeholder="MDF-e"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Data MDF-e"
                    type="date"
                    className={CLASSE_CONTROLE}
                    value={item.dataMDFe}
                    onChange={e => atualizarRegistro(item.id, 'dataMDFe', e.target.value)}
                  />
                </Td>
                <Td className="px-2 py-2">
                  {registros.length > 1 && <BotaoRemover rotulo="Remover linha" onClick={() => removerRegistro(item.id)} />}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
        <div>
          <BotaoAdicionar onClick={adicionarRegistro}>Adicionar linha</BotaoAdicionar>
        </div>
      </Secao>

      <Secao numero={2} titulo="Levantamento">
        <Grade colunas={3}>
          <Entrada rotulo="Levantamento realizado por" classeCampo="sm:col-span-2" valor={responsavel} aoMudar={setResponsavel} />
          <Entrada rotulo="Data" type="date" valor={data} aoMudar={setData} />
        </Grade>
      </Secao>

      <Secao numero={3} titulo="Resultado">
        <Selecao
          rotulo="Resultado da conferência"
          placeholder=""
          valor={resultado}
          aoMudar={v => setResultado(v as Resultado)}
          opcoes={OPCOES_RESULTADO_PT}
        />
      </Secao>

      <Secao numero={4} titulo="Observações">
        <AreaTexto
          rotulo="Observações"
          linhas={4}
          placeholder="Informe observações da conferência..."
          valor={observacoes}
          aoMudar={setObservacoes}
        />
      </Secao>

      <Secao numero={5} titulo="Providência Aplicada">
        <AreaTexto
          rotulo="Providência aplicada"
          linhas={4}
          placeholder="Descreva a providência aplicada..."
          valor={providenciaAplicada}
          aoMudar={setProvidenciaAplicada}
        />
      </Secao>

      <RodapePapel numero={11} aoSalvarRascunho={() => salvar('rascunho')} aoFinalizar={() => salvar('finalizado')} />
      {aviso.elemento}
    </>
  );
}
