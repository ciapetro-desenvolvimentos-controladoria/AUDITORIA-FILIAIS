import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CLASSE_AREA_TEXTO, CLASSE_CONTROLE, CabecalhoPapel, Entrada, Grade, RodapePapel, Secao, useAviso } from '../componentes';
import { salvarPapel } from '../armazenamento';
import { Tabela, Td, Th } from '../tabela';

type Celular = {
  usuario: string;
  imei: string;
  modelo: string;
};

const criarCelulares = (): Celular[] => Array.from({ length: 10 }, () => ({ usuario: '', imei: '', modelo: '' }));

export default function PT04() {
  const { id } = useParams();
  const aviso = useAviso();

  const [celulares, setCelulares] = useState<Celular[]>(criarCelulares);
  const [responsavel, setResponsavel] = useState('');
  const [data, setData] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const atualizarCelular = (index: number, campo: keyof Celular, valor: string) =>
    setCelulares(atual => atual.map((c, i) => (i === index ? { ...c, [campo]: valor } : c)));

  const gravar = (status: 'rascunho' | 'finalizado') => {
    if (!id) return false;
    salvarPapel(id, 4, { celulares, responsavel, data, observacoes, status });
    return true;
  };

  const salvarRascunho = () => {
    if (gravar('rascunho')) aviso.mostrar('PT04 salvo como rascunho.');
  };

  // Como no original: finaliza e avisa, sem sair da tela.
  const finalizar = () => {
    if (gravar('finalizado')) aviso.mostrar('PT04 finalizado.');
  };

  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={4} descricao="Conferência Celulares" />

      <Secao titulo="Numeração de linhas Corporativas" descricao="Informe os dados dos aparelhos e usuários vinculados às linhas corporativas.">
        <Tabela className="shadow-none">
          <thead>
            <tr>
              <Th className="w-28">Linha</Th>
              <Th>Usuário</Th>
              <Th>IMEI</Th>
              <Th>Modelo Aparelho</Th>
            </tr>
          </thead>
          <tbody>
            {celulares.map((celular, index) => (
              <tr key={index}>
                <Td className="whitespace-nowrap py-2 font-medium">Linha {String(index + 1).padStart(2, '0')}:</Td>
                <Td className="min-w-[160px] py-2">
                  <input value={celular.usuario} onChange={e => atualizarCelular(index, 'usuario', e.target.value)} placeholder="Usuário" className={CLASSE_CONTROLE} />
                </Td>
                <Td className="min-w-[160px] py-2">
                  <input value={celular.imei} onChange={e => atualizarCelular(index, 'imei', e.target.value)} placeholder="IMEI" className={CLASSE_CONTROLE} />
                </Td>
                <Td className="min-w-[160px] py-2">
                  <input value={celular.modelo} onChange={e => atualizarCelular(index, 'modelo', e.target.value)} placeholder="Modelo do aparelho" className={CLASSE_CONTROLE} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </Secao>

      <Secao titulo="Levantamento">
        <Grade colunas={3}>
          <Entrada rotulo="Levantamento realizado por" valor={responsavel} aoMudar={setResponsavel} classeCampo="sm:col-span-2" />
          <Entrada rotulo="Data" type="date" valor={data} aoMudar={setData} />
        </Grade>
      </Secao>

      <Secao titulo="Observações">
        {/* Sem rótulo no original: textarea direto, com placeholder. */}
        <textarea
          rows={5}
          value={observacoes}
          onChange={e => setObservacoes(e.target.value)}
          placeholder="Informe observações relevantes da conferência..."
          aria-label="Observações"
          className={CLASSE_AREA_TEXTO}
        />
      </Secao>

      <RodapePapel numero={4} aoSalvarRascunho={salvarRascunho} aoFinalizar={finalizar} />
      {aviso.elemento}
    </>
  );
}
