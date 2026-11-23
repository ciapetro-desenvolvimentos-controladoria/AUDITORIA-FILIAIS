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

type RegistroFalta = {
  id: number;
  numeroNF: string;
  produto: string;
  dataDesc: string;
  quantidadeFalta: string;
  boletimEmitido: string;
  dataEnvioBoletim: string;
  diasAtraso: string;
  boletimCorreto: string;
};

type PT10Data = {
  registros: RegistroFalta[];
  responsavel: string;
  data: string;
  resultado: Resultado;
  observacoes: string;
  providenciaAplicada: string;
  status: 'rascunho' | 'finalizado';
};

const criarLinha = (id: number): RegistroFalta => ({
  id,
  numeroNF: '',
  produto: '',
  dataDesc: '',
  quantidadeFalta: '',
  boletimEmitido: '',
  dataEnvioBoletim: '',
  diasAtraso: '',
  boletimCorreto: '',
});

function SelecaoSimNao({ rotulo, valor, aoMudar }: { rotulo: string; valor: string; aoMudar: (v: string) => void }) {
  return (
    <select aria-label={rotulo} className={CLASSE_CONTROLE} value={valor} onChange={e => aoMudar(e.target.value)}>
      <option value="">Selecione</option>
      <option value="SIM">SIM</option>
      <option value="NÃO">NÃO</option>
    </select>
  );
}

export default function PT10() {
  const { id } = useParams();
  const aviso = useAviso();

  // Dados salvos lidos uma vez, na abertura (mesmas regras do carregamento anterior).
  const [salvo] = useState(() => (id ? obterPapel<PT10Data>(id, 10) : null));
  const [registros, setRegistros] = useState<RegistroFalta[]>(() => salvo?.registros || 
    Array.from({ length: 20 }, (_, index) => criarLinha(index + 1)),
  );
  const [responsavel, setResponsavel] = useState(salvo?.responsavel || '');
  const [data, setData] = useState(salvo?.data || '');
  const [resultado, setResultado] = useState<Resultado>(salvo?.resultado || 'De acordo');
  const [observacoes, setObservacoes] = useState(salvo?.observacoes || '');
  const [providenciaAplicada, setProvidenciaAplicada] = useState(salvo?.providenciaAplicada || '');


  const atualizarRegistro = (registroId: number, campo: keyof RegistroFalta, valor: string) =>
    setRegistros(atual => atual.map(r => (r.id === registroId ? { ...r, [campo]: valor } : r)));

  const adicionarRegistro = () => {
    const novoId = registros.length > 0 ? Math.max(...registros.map(r => r.id)) + 1 : 1;
    setRegistros(atual => [...atual, criarLinha(novoId)]);
  };

  const removerRegistro = (registroId: number) =>
    setRegistros(atual => atual.filter(r => r.id !== registroId));

  const salvar = (status: 'rascunho' | 'finalizado') => {
    if (!id) return;
    const dados: PT10Data = { registros, responsavel, data, resultado, observacoes, providenciaAplicada, status };
    salvarPapel(id, 10, dados);
    aviso.mostrar(status === 'rascunho' ? 'PT10 salvo como rascunho.' : 'PT10 finalizado.');
  };

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={10} descricao="Faltas de Produto" />

      <Secao
        numero={1}
        titulo="Análise das Faltas de Produto"
        descricao="Analise as 20 notas selecionadas com falta de produto e confira se o boletim foi emitido e se o e-mail foi enviado."
      >
        <Tabela>
          <thead>
            <tr>
              <Th className="min-w-[110px]">Número NF</Th>
              <Th className="min-w-[180px]">Produto</Th>
              <Th className="min-w-[150px]">Data Desc.</Th>
              <Th className="min-w-[110px]">Quant. Falta</Th>
              <Th className="min-w-[140px]">Boletim Emitido?</Th>
              <Th className="min-w-[150px]">Data Envio Bol.</Th>
              <Th className="min-w-[130px]">Dias Atraso P/ Envio</Th>
              <Th className="min-w-[160px]">Boletim Emitido Correto?</Th>
              <Th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {registros.map(item => (
              <tr key={item.id}>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Número NF"
                    className={CLASSE_CONTROLE}
                    value={item.numeroNF}
                    onChange={e => atualizarRegistro(item.id, 'numeroNF', e.target.value)}
                    placeholder="NF"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Produto"
                    className={CLASSE_CONTROLE}
                    value={item.produto}
                    onChange={e => atualizarRegistro(item.id, 'produto', e.target.value)}
                    placeholder="Produto"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Data Desc."
                    type="date"
                    className={CLASSE_CONTROLE}
                    value={item.dataDesc}
                    onChange={e => atualizarRegistro(item.id, 'dataDesc', e.target.value)}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Quant. Falta"
                    type="number"
                    className={CLASSE_CONTROLE}
                    value={item.quantidadeFalta}
                    onChange={e => atualizarRegistro(item.id, 'quantidadeFalta', e.target.value)}
                    placeholder="Qtd."
                  />
                </Td>
                <Td className="px-2 py-2">
                  <SelecaoSimNao
                    rotulo="Boletim Emitido?"
                    valor={item.boletimEmitido}
                    aoMudar={v => atualizarRegistro(item.id, 'boletimEmitido', v)}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Data Envio Bol."
                    type="date"
                    className={CLASSE_CONTROLE}
                    value={item.dataEnvioBoletim}
                    onChange={e => atualizarRegistro(item.id, 'dataEnvioBoletim', e.target.value)}
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Dias Atraso P/ Envio"
                    type="number"
                    className={CLASSE_CONTROLE}
                    value={item.diasAtraso}
                    onChange={e => atualizarRegistro(item.id, 'diasAtraso', e.target.value)}
                    placeholder="Dias"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <SelecaoSimNao
                    rotulo="Boletim Emitido Correto?"
                    valor={item.boletimCorreto}
                    aoMudar={v => atualizarRegistro(item.id, 'boletimCorreto', v)}
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

      <RodapePapel numero={10} aoSalvarRascunho={() => salvar('rascunho')} aoFinalizar={() => salvar('finalizado')} />
      {aviso.elemento}
    </>
  );
}
