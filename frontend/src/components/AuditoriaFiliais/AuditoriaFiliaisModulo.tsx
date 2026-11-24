import { Navigate, Route, Routes } from 'react-router-dom';
import { PainelAuditorias } from './PainelAuditorias';
import { ListaAuditorias } from './ListaAuditorias';
import { EditarAuditoria, NovaAuditoria } from './NovaAuditoria';
import { DetalheAuditoria } from './DetalheAuditoria';
import { PaginaPapel } from './papeis';

/** Entrada única do módulo: todas as telas são sub-rotas daqui. */
export function AuditoriaFiliaisModulo() {
  return (
    <Routes>
      <Route index element={<PainelAuditorias />} />
      <Route path="auditorias" element={<ListaAuditorias />} />
      <Route path="auditorias/nova" element={<NovaAuditoria />} />
      <Route path="auditorias/:id" element={<DetalheAuditoria />} />
      <Route path="auditorias/:id/editar" element={<EditarAuditoria />} />
      <Route path="auditorias/:id/pt/:numero" element={<PaginaPapel />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
