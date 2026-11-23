import { useParams } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { CabecalhoPapel } from '../componentes';

/** PT05 ainda não existe: o arquivo antigo (pages/PT05.tsx) era uma cópia do
 * PT07 (Conferência Posição OC), salvando na chave do PT07. Fica como "em
 * construção" até o conteúdo da Conferência Estoque Lacres ser definido. */
export default function PT05() {
  const { id } = useParams();
  return (
    <>
      <CabecalhoPapel idAuditoria={id} numero={5} />
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/30"><Construction size={28} className="text-amber-500" /></div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Papel de trabalho em construção</p>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">O conteúdo da Conferência Estoque Lacres ainda vai ser definido.</p>
      </div>
    </>
  );
}
