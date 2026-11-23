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
  email: string;
  usuario: string;
};

type PT12Data = {
  registros: Registro[];
  responsavel: string;
  data: string;
  resultado: Resultado;
  observacoes: string;
  providenciaAplicada: string;
  status: 'rascunho' | 'finalizado';
};

const criarLinha = (id: number): Registro => ({ id, email: '', usuario: '' });

export default function PT12() {
  const { id } = useParams();
  const aviso = useAviso();

  // Dados salvos lidos uma vez, na abertura (mesmas regras do carregamento anterior).
  const [salvo] = useState(() => (id ? obterPapel<PT12Data>(id, 12) : null));
  const [registros, setRegistros] = useState<Registro[]>(() => salvo?.registros || 
    Array.from({ length: 10 }, (_, index) => criarLinha(index + 1)),
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
    const dados: PT12Data = { registros, responsavel, data, resultado, observacoes, providenciaAplicada, status };
    salvarPapel(id, 12, dados);
    aviso.mostrar(status === 'rascunho' ? 'PT12 salvo como rascunho.' : 'PT12 finalizado.');
  };

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={12} descricao="Conferência E-mail Corporativo" />

      <Secao
        numero={1}
        titulo="Listagem de E-mails Corporativos"
        descricao="Confira os endereços de e-mail corporativos e o respectivo usuário."
      >
        <Tabela>
          <thead>
            <tr>
              <Th className="min-w-[240px]">E-mail</Th>
              <Th className="min-w-[200px]">Usuário</Th>
              <Th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {registros.map(item => (
              <tr key={item.id}>
                <Td className="px-2 py-2">
                  <input
                    aria-label="E-mail"
                    type="email"
                    className={CLASSE_CONTROLE}
                    value={item.email}
                    onChange={e => atualizarRegistro(item.id, 'email', e.target.value)}
                    placeholder="e-mail corporativo"
                  />
                </Td>
                <Td className="px-2 py-2">
                  <input
                    aria-label="Usuário"
                    className={CLASSE_CONTROLE}
                    value={item.usuario}
                    onChange={e => atualizarRegistro(item.id, 'usuario', e.target.value)}
                    placeholder="Usuário"
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

      <RodapePapel numero={12} aoSalvarRascunho={() => salvar('rascunho')} aoFinalizar={() => salvar('finalizado')} />
      {aviso.elemento}
    </>
  );
}
