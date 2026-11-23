import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SeloStatus } from '@/components/ui/LayoutPagina';
import {
  AreaTexto, Bloco, BotaoAdicionar, BotaoAnexo, BotaoRemover, CabecalhoPapel, Divisor, Entrada, Grade,
  RodapePapel, Secao, SeletorResultado, Subtitulo, ValorDiferenca,
} from '../componentes';
import type { Resultado } from '../tipos';

type Cartao = {
  id: number;
  nome: string;
  saldoSistema: string;
  saldoFisico: string;
  resultado: Resultado;
  observacao: string;
};

type Fechamento = { mesReferencia: string; prazoEnvio: string; dataEnviada: string };

const novoCartao = (id: number): Cartao => ({ id, nome: '', saldoSistema: '', saldoFisico: '', resultado: '', observacao: '' });

function calcularDiferenca(sistema: string, fisico: string) {
  if (!sistema || !fisico) return '';
  const s = Number(sistema.replace(',', '.'));
  const f = Number(fisico.replace(',', '.'));
  if (Number.isNaN(s) || Number.isNaN(f)) return '';
  return (f - s).toFixed(2);
}

function calcularDiasAtraso(prazo: string, enviado: string) {
  if (!prazo || !enviado) return '';
  const dias = Math.ceil((new Date(`${enviado}T00:00:00`).getTime() - new Date(`${prazo}T00:00:00`).getTime()) / 86_400_000);
  return String(Math.max(0, dias));
}

export default function PT01() {
  const { id } = useParams();

  const [saldoDinheiroSistema, setSaldoDinheiroSistema] = useState('');
  const [saldoDinheiroFisico, setSaldoDinheiroFisico] = useState('');
  const [resultadoDinheiro, setResultadoDinheiro] = useState<Resultado>('');
  const [observacaoDinheiro, setObservacaoDinheiro] = useState('');

  const [cartoes, setCartoes] = useState<Cartao[]>([novoCartao(1)]);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultadoExtrato, setResultadoExtrato] = useState<Resultado>('');
  const [observacaoExtrato, setObservacaoExtrato] = useState('');

  const [fechamentos, setFechamentos] = useState<Fechamento[]>(
    Array.from({ length: 6 }, () => ({ mesReferencia: '', prazoEnvio: '', dataEnviada: '' })),
  );

  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [providencia, setProvidencia] = useState('');

  const adicionarCartao = () => {
    if (cartoes.length >= 4) return;
    setCartoes([...cartoes, novoCartao(Math.max(...cartoes.map(c => c.id), 0) + 1)]);
  };
  const removerCartao = (cartaoId: number) => {
    if (cartoes.length === 1) return;
    setCartoes(cartoes.filter(c => c.id !== cartaoId));
  };
  const atualizarCartao = (cartaoId: number, campo: keyof Cartao, valor: string) =>
    setCartoes(cartoes.map(c => (c.id === cartaoId ? { ...c, [campo]: valor } : c)));

  const atualizarFechamento = (index: number, campo: keyof Fechamento, valor: string) =>
    setFechamentos(atuais => atuais.map((f, i) => (i === index ? { ...f, [campo]: valor } : f)));

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={1} descricao="Conferência dos saldos de caixa, lançamentos e fechamento mensal." />

      {/* 1. Saldos */}
      <Secao numero={1} titulo="Conferência dos saldos" descricao="Compare os saldos apresentados no sistema com a conferência física.">
        <Subtitulo>Caixa em dinheiro</Subtitulo>
        <Grade colunas={3}>
          <Entrada rotulo="Saldo do sistema" type="number" step="0.01" valor={saldoDinheiroSistema} aoMudar={setSaldoDinheiroSistema} />
          <Entrada rotulo="Saldo físico" type="number" step="0.01" valor={saldoDinheiroFisico} aoMudar={setSaldoDinheiroFisico} />
          <ValorDiferenca valor={calcularDiferenca(saldoDinheiroSistema, saldoDinheiroFisico)} />
        </Grade>
        <SeletorResultado valor={resultadoDinheiro} aoMudar={setResultadoDinheiro} />
        <AreaTexto rotulo="Observação" linhas={2} valor={observacaoDinheiro} aoMudar={setObservacaoDinheiro} />

        <Divisor />

        <div className="flex items-center justify-between gap-2">
          <Subtitulo descricao="Adicione somente os cartões existentes na filial.">Caixa cartão</Subtitulo>
          {cartoes.length < 4 && <BotaoAdicionar onClick={adicionarCartao}>Adicionar cartão</BotaoAdicionar>}
        </div>

        {cartoes.map((cartao, index) => (
          <Bloco
            key={cartao.id}
            titulo={`Cartão ${index + 1}`}
            acoes={cartoes.length > 1 && <BotaoRemover rotulo="Remover cartão" onClick={() => removerCartao(cartao.id)} />}
          >
            <Entrada rotulo="Nome do cartão" placeholder="Ex.: Comercial" valor={cartao.nome} aoMudar={v => atualizarCartao(cartao.id, 'nome', v)} />
            <Grade colunas={3}>
              <Entrada rotulo="Saldo do sistema" type="number" step="0.01" valor={cartao.saldoSistema} aoMudar={v => atualizarCartao(cartao.id, 'saldoSistema', v)} />
              <Entrada rotulo="Saldo físico" type="number" step="0.01" valor={cartao.saldoFisico} aoMudar={v => atualizarCartao(cartao.id, 'saldoFisico', v)} />
              <ValorDiferenca valor={calcularDiferenca(cartao.saldoSistema, cartao.saldoFisico)} />
            </Grade>
            <SeletorResultado valor={cartao.resultado} aoMudar={v => atualizarCartao(cartao.id, 'resultado', v)} />
            <AreaTexto rotulo="Observação" linhas={2} valor={cartao.observacao} aoMudar={v => atualizarCartao(cartao.id, 'observacao', v)} />
          </Bloco>
        ))}
      </Secao>

      {/* 2. Extrato */}
      <Secao numero={2} titulo="Conferência dos lançamentos" descricao="Anexe o extrato utilizado na conferência dos lançamentos.">
        <BotaoAnexo rotulo="Anexar extrato Excel" accept=".xlsx,.xls" nomeArquivo={arquivo?.name} aoEscolher={setArquivo} />
        <SeletorResultado valor={resultadoExtrato} aoMudar={setResultadoExtrato} />
        <AreaTexto rotulo="Observação" valor={observacaoExtrato} aoMudar={setObservacaoExtrato} />
      </Secao>

      {/* 3. Fechamentos */}
      <Secao numero={3} titulo="Fechamento dos últimos 6 meses" descricao="Registre o prazo e a data de envio dos fechamentos mensais.">
        {fechamentos.map((f, index) => {
          const atraso = calcularDiasAtraso(f.prazoEnvio, f.dataEnviada);
          return (
            <Bloco
              key={index}
              titulo={`Fechamento ${index + 1}`}
              acoes={atraso !== '' && (Number(atraso) > 0
                ? <SeloStatus tom="erro">Em atraso</SeloStatus>
                : <SeloStatus tom="ok">No prazo</SeloStatus>)}
            >
              <Grade colunas={4}>
                <Entrada rotulo="Mês de referência" type="month" valor={f.mesReferencia} aoMudar={v => atualizarFechamento(index, 'mesReferencia', v)} />
                <Entrada rotulo="Prazo para envio" type="date" valor={f.prazoEnvio} aoMudar={v => atualizarFechamento(index, 'prazoEnvio', v)} />
                <Entrada rotulo="Data enviada" type="date" valor={f.dataEnviada} aoMudar={v => atualizarFechamento(index, 'dataEnviada', v)} />
                <Entrada rotulo="Dias de atraso" valor={atraso} />
              </Grade>
            </Bloco>
          );
        })}
      </Secao>

      {/* 4 e 5 */}
      <Secao numero={4} titulo="Observações gerais">
        <AreaTexto rotulo="Observações da conferência" linhas={4} valor={observacoesGerais} aoMudar={setObservacoesGerais} />
      </Secao>
      <Secao numero={5} titulo="Providência aplicada">
        <AreaTexto rotulo="Providência aplicada" linhas={4} valor={providencia} aoMudar={setProvidencia} />
      </Secao>

      {/* Como na versão anterior, o PT01 ainda não grava (os botões não têm ação). */}
      <RodapePapel numero={1} />
    </>
  );
}
