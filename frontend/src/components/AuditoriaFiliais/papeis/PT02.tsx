import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SeloStatus } from '@/components/ui/LayoutPagina';
import {
  AreaTexto, Bloco, BotaoAdicionar, BotaoAnexo, BotaoRemover, CabecalhoPapel, Divisor, Entrada, Grade,
  RodapePapel, Secao, SeletorResultado, Subtitulo,
} from '../componentes';
import type { Resultado } from '../tipos';

type BlocoFormulario = {
  id: number;
  nome: string;
  filialInicial: string;
  filialFinal: string;
  controleInicial: string;
  controleFinal: string;
  resultado: Resultado;
  observacao: string;
  arquivo: File | null;
};

const novoBloco = (id: number): BlocoFormulario => ({
  id,
  nome: '',
  filialInicial: '',
  filialFinal: '',
  controleInicial: '',
  controleFinal: '',
  resultado: '',
  observacao: '',
  arquivo: null,
});

function calcularQuantidade(inicial: string, final: string) {
  if (!inicial || !final) return '';
  const numeroInicial = Number(inicial);
  const numeroFinal = Number(final);
  if (Number.isNaN(numeroInicial) || Number.isNaN(numeroFinal)) return '';
  if (numeroFinal < numeroInicial) return '';
  return String(numeroFinal - numeroInicial + 1);
}

/** true = numeração confere, false = divergência, null = dados incompletos. */
function verificarNumeracao(bloco: BlocoFormulario) {
  if (!bloco.filialInicial || !bloco.filialFinal || !bloco.controleInicial || !bloco.controleFinal) return null;
  const filialInicial = Number(bloco.filialInicial);
  const filialFinal = Number(bloco.filialFinal);
  const controleInicial = Number(bloco.controleInicial);
  const controleFinal = Number(bloco.controleFinal);
  if ([filialInicial, filialFinal, controleInicial, controleFinal].some(Number.isNaN)) return null;
  return filialInicial === controleInicial && filialFinal === controleFinal;
}

export default function PT02() {
  const { id } = useParams();

  const [blocos, setBlocos] = useState<BlocoFormulario[]>([novoBloco(1)]);
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [providencia, setProvidencia] = useState('');

  const adicionarBloco = () => {
    if (blocos.length >= 5) return;
    setBlocos([...blocos, novoBloco(Math.max(...blocos.map(b => b.id), 0) + 1)]);
  };
  const removerBloco = (blocoId: number) => {
    if (blocos.length === 1) return;
    setBlocos(blocos.filter(b => b.id !== blocoId));
  };
  const atualizarBloco = (blocoId: number, campo: keyof BlocoFormulario, valor: string | File | null) =>
    setBlocos(blocos.map(b => (b.id === blocoId ? { ...b, [campo]: valor } : b)));

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={2} descricao="Conferência da sequência dos formulários de segurança com o controle interno." />

      <Secao
        titulo="Sequências de formulários"
        descricao="Cadastre os blocos existentes na filial e compare com o controle interno."
        acoes={blocos.length < 5 && <BotaoAdicionar onClick={adicionarBloco}>Adicionar bloco</BotaoAdicionar>}
      >
        {blocos.map((bloco, index) => {
          const numeracao = verificarNumeracao(bloco);
          return (
            <Bloco
              key={bloco.id}
              titulo={`Bloco ${String(index + 1).padStart(2, '0')}`}
              acoes={blocos.length > 1 && <BotaoRemover rotulo="Remover bloco" onClick={() => removerBloco(bloco.id)} />}
            >
              <Entrada
                rotulo="Nome / identificação do bloco"
                placeholder="Ex.: Formulários 001 a 050"
                valor={bloco.nome}
                aoMudar={v => atualizarBloco(bloco.id, 'nome', v)}
              />

              <Subtitulo>Controle da filial</Subtitulo>
              <Grade colunas={3}>
                <Entrada rotulo="Nº inicial" type="number" valor={bloco.filialInicial} aoMudar={v => atualizarBloco(bloco.id, 'filialInicial', v)} />
                <Entrada rotulo="Nº final" type="number" valor={bloco.filialFinal} aoMudar={v => atualizarBloco(bloco.id, 'filialFinal', v)} />
                <Entrada rotulo="Quantidade" valor={calcularQuantidade(bloco.filialInicial, bloco.filialFinal)} />
              </Grade>

              <Divisor />

              <Subtitulo>Controle interno</Subtitulo>
              <Grade colunas={3}>
                <Entrada rotulo="Nº inicial" type="number" valor={bloco.controleInicial} aoMudar={v => atualizarBloco(bloco.id, 'controleInicial', v)} />
                <Entrada rotulo="Nº final" type="number" valor={bloco.controleFinal} aoMudar={v => atualizarBloco(bloco.id, 'controleFinal', v)} />
                <Entrada rotulo="Quantidade" valor={calcularQuantidade(bloco.controleInicial, bloco.controleFinal)} />
              </Grade>

              {/* Resultado automático da comparação */}
              {numeracao !== null && (
                <div>
                  {numeracao
                    ? <SeloStatus tom="ok">Numeração de acordo</SeloStatus>
                    : <SeloStatus tom="atencao">Divergência na numeração</SeloStatus>}
                </div>
              )}

              <SeletorResultado valor={bloco.resultado} aoMudar={v => atualizarBloco(bloco.id, 'resultado', v)} />
              <AreaTexto rotulo="Observação" valor={bloco.observacao} aoMudar={v => atualizarBloco(bloco.id, 'observacao', v)} />

              <div className="space-y-1.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">Evidência (opcional)</p>
                <BotaoAnexo
                  rotulo="Anexar arquivo"
                  nomeArquivo={bloco.arquivo?.name}
                  aoEscolher={arquivo => atualizarBloco(bloco.id, 'arquivo', arquivo)}
                />
              </div>
            </Bloco>
          );
        })}
      </Secao>

      <Secao titulo="Observações gerais">
        <AreaTexto rotulo="Observações da conferência" linhas={4} valor={observacoesGerais} aoMudar={setObservacoesGerais} />
      </Secao>

      <Secao titulo="Providência aplicada">
        <AreaTexto rotulo="Providência aplicada" linhas={4} valor={providencia} aoMudar={setProvidencia} />
      </Secao>

      {/* Como na versão anterior, o PT02 ainda não grava (os botões não têm ação). */}
      <RodapePapel numero={2} />
    </>
  );
}
