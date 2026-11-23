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

type RegistroUsuario = {
  id: number;
  acesso: string;
  perfilVinculo: string;
  atividade: string;
  conforme: string;
  observacao: string;
};

type PT09Data = {
  registros: RegistroUsuario[];
  responsavel: string;
  data: string;
  resultado: Resultado;
  observacoes: string;
  providenciaAplicada: string;
  status: 'rascunho' | 'finalizado';
};

const criarLinha = (id: number): RegistroUsuario => ({
  id,
  acesso: '',
  perfilVinculo: '',
  atividade: '',
  conforme: '',
  observacao: '',
});

export default function PT09() {
  const { id } = useParams();
  const aviso = useAviso();

  // Dados salvos lidos uma vez, na abertura (mesmas regras do carregamento anterior).
  const [salvo] = useState(() => (id ? obterPapel<PT09Data>(id, 9) : null));
  const [registros, setRegistros] = useState<RegistroUsuario[]>(() => salvo?.registros || [criarLinha(1), criarLinha(2), criarLinha(3)]);
  const [responsavel, setResponsavel] = useState(salvo?.responsavel || '');
  const [data, setData] = useState(salvo?.data || '');
  const [resultado, setResultado] = useState<Resultado>(salvo?.resultado || 'De acordo');
  const [observacoes, setObservacoes] = useState(salvo?.observacoes || '');
  const [providenciaAplicada, setProvidenciaAplicada] = useState(salvo?.providenciaAplicada || '');


  const atualizarRegistro = (registroId: number, campo: keyof RegistroUsuario, valor: string) =>
    setRegistros(atual => atual.map(r => (r.id === registroId ? { ...r, [campo]: valor } : r)));

  const adicionarRegistro = () => {
    const novoId = registros.length > 0 ? Math.max(...registros.map(r => r.id)) + 1 : 1;
    setRegistros(atual => [...atual, criarLinha(novoId)]);
  };

  const removerRegistro = (registroId: number) =>
    setRegistros(atual => atual.filter(r => r.id !== registroId));

  const salvar = (status: 'rascunho' | 'finalizado') => {
    if (!id) return;
    const dados: PT09Data = { registros, responsavel, data, resultado, observacoes, providenciaAplicada, status };
    salvarPapel(id, 9, dados);
    aviso.mostrar(status === 'rascunho' ? 'PT09 salvo como rascunho.' : 'PT09 finalizado.');
  };

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={9} descricao="Verificação Usuário" />

      <Secao
        numero={1}
        titulo="Verificação dos Usuários"
        descricao="Confira no sistema a configuração do usuário e compare com a configuração padrão correspondente ao seu cargo."
      >
        <Tabela>
          <thead>
            <tr>
              <Th className="min-w-[170px]">Acesso</Th>
              <Th className="min-w-[180px]">Perfil Vínculo</Th>
              <Th className="min-w-[220px]">Atividade</Th>
              <Th className="min-w-[150px]">Conforme?</Th>
              <Th className="min-w-[240px]">Observação</Th>
              <Th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {registros.map(item => (
              <tr key={item.id}>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Acesso"
                    className={CLASSE_CONTROLE}
                    value={item.acesso}
                    onChange={e => atualizarRegistro(item.id, 'acesso', e.target.value)}
                    placeholder="Acesso"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Perfil vínculo"
                    className={CLASSE_CONTROLE}
                    value={item.perfilVinculo}
                    onChange={e => atualizarRegistro(item.id, 'perfilVinculo', e.target.value)}
                    placeholder="Perfil / vínculo"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Atividade"
                    className={CLASSE_CONTROLE}
                    value={item.atividade}
                    onChange={e => atualizarRegistro(item.id, 'atividade', e.target.value)}
                    placeholder="Atividade"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <select
                    aria-label="Conforme?"
                    className={CLASSE_CONTROLE}
                    value={item.conforme}
                    onChange={e => atualizarRegistro(item.id, 'conforme', e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Observação"
                    className={CLASSE_CONTROLE}
                    value={item.observacao}
                    onChange={e => atualizarRegistro(item.id, 'observacao', e.target.value)}
                    placeholder="Observação"
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

      <RodapePapel numero={9} aoSalvarRascunho={() => salvar('rascunho')} aoFinalizar={() => salvar('finalizado')} />
      {aviso.elemento}
    </>
  );
}
