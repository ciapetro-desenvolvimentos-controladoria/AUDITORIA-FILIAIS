import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardPlus } from 'lucide-react';
import { CabecalhoPagina } from '@/components/ui/LayoutPagina';
import { USUARIO_TESTE } from '@/components/Layout/sessaoTeste';
import { salvarAuditoria } from './armazenamento';
import { CLASSE_BOTAO_PRIMARIO, CLASSE_BOTAO_SECUNDARIO, Entrada, Grade, Secao, Selecao } from './componentes';
import { rotasAuditoria } from './rotas';
import type { AuditoriaFilial, TipoAuditoria } from './tipos';

const dataIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function NovaAuditoria() {
  const navigate = useNavigate();
  const [filial, setFilial] = useState('');
  const [mesReferencia, setMesReferencia] = useState('');
  const [dataAuditoria, setDataAuditoria] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [auditor, setAuditor] = useState(USUARIO_TESTE.nome);
  const [tipo, setTipo] = useState<TipoAuditoria>('presencial');

  // Ao escolher a data da auditoria: período = 6 meses antes até a data, e o
  // mês de referência é o da data (mesma regra da versão anterior).
  const aoMudarData = (valor: string) => {
    setDataAuditoria(valor);
    if (!valor) return;
    const [ano, mes, dia] = valor.split('-').map(Number);
    setPeriodoInicio(dataIso(new Date(ano, mes - 1 - 6, dia)));
    setPeriodoFim(valor);
    setMesReferencia(`${ano}-${String(mes).padStart(2, '0')}`);
  };

  const podeCriar = filial.trim() !== '' && dataAuditoria !== '';

  const criar = () => {
    const nova: AuditoriaFilial = {
      id: crypto.randomUUID(),
      filial: filial.trim(),
      mesReferencia,
      dataAuditoria,
      periodoInicio,
      periodoFim,
      auditor,
      tipo,
      status: 'Em andamento',
      criadaEm: new Date().toISOString(),
    };
    salvarAuditoria(nova);
    navigate(rotasAuditoria.detalhe(nova.id));
  };

  return (
    <div className="space-y-6 p-6 font-sans">
      <CabecalhoPagina
        icone={<ClipboardPlus size={20} />}
        titulo="Nova auditoria"
        subtitulo="Informe os dados iniciais da auditoria."
        setor="controladoria"
      />

      <div className="max-w-3xl space-y-6">
        <Secao numero={1} titulo="Filial e data">
          <Grade colunas={2}>
            <Entrada rotulo="Filial" placeholder="Ex.: Cianorte" valor={filial} aoMudar={setFilial} />
            <Selecao
              rotulo="Tipo de auditoria"
              valor={tipo}
              aoMudar={v => setTipo(v as TipoAuditoria)}
              placeholder=""
              opcoes={[{ valor: 'presencial', rotulo: 'Presencial' }, { valor: 'remota', rotulo: 'Remota' }]}
            />
            <Entrada rotulo="Data da auditoria" type="date" valor={dataAuditoria} aoMudar={aoMudarData} />
            <Entrada rotulo="Mês de referência" type="month" valor={mesReferencia} aoMudar={setMesReferencia} />
          </Grade>
        </Secao>

        <Secao numero={2} titulo="Período auditado" descricao="Preenchido sozinho com os 6 meses anteriores à data da auditoria; ajuste se precisar.">
          <Grade colunas={2}>
            <Entrada rotulo="Data inicial" type="date" valor={periodoInicio} aoMudar={setPeriodoInicio} />
            <Entrada rotulo="Data final" type="date" valor={periodoFim} aoMudar={setPeriodoFim} />
          </Grade>
        </Secao>

        <Secao numero={3} titulo="Responsável">
          <Entrada rotulo="Auditor" valor={auditor} aoMudar={setAuditor} />
        </Secao>

        <div className="flex justify-end gap-2">
          <Link to={rotasAuditoria.lista()} className={CLASSE_BOTAO_SECUNDARIO}>Cancelar</Link>
          <button type="button" onClick={criar} disabled={!podeCriar} className={CLASSE_BOTAO_PRIMARIO} title={podeCriar ? undefined : 'Informe a filial e a data da auditoria'}>
            Criar auditoria
          </button>
        </div>
      </div>
    </div>
  );
}
