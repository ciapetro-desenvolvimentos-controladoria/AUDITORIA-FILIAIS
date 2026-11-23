import type { ComponentType } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { rotasAuditoria } from '../rotas';
import PT01 from './PT01';
import PT02 from './PT02';
import PT03 from './PT03';
import PT04 from './PT04';
import PT05 from './PT05';
import PT06 from './PT06';
import PT07 from './PT07';
import PT08 from './PT08';
import PT09 from './PT09';
import PT10 from './PT10';
import PT11 from './PT11';
import PT12 from './PT12';

const PAPEIS: Record<number, ComponentType> = {
  1: PT01, 2: PT02, 3: PT03, 4: PT04, 5: PT05, 6: PT06,
  7: PT07, 8: PT08, 9: PT09, 10: PT10, 11: PT11, 12: PT12,
};

/** Rota auditorias/:id/pt/:numero -> componente do papel de trabalho. */
export function PaginaPapel() {
  const { id = '', numero = '' } = useParams();
  const Papel = PAPEIS[Number(numero)];
  if (!Papel) return <Navigate to={rotasAuditoria.detalhe(id)} replace />;
  // key: troca de PT remonta o componente (estado não vaza de um para outro).
  return (
    <div className="space-y-6 p-6 pb-0 font-sans">
      <Papel key={numero} />
    </div>
  );
}
