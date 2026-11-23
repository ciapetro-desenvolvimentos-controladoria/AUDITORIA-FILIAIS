import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutTeste } from './components/Layout/LayoutTeste';
import { AuditoriaFiliaisModulo } from './components/AuditoriaFiliais/AuditoriaFiliaisModulo';
import { BASE_AUDITORIA_FILIAIS } from './components/AuditoriaFiliais/rotas';

/** Na Intranet, o módulo entra como UMA rota dentro do LayoutPrincipal:
 *   <Route path="/controladoria/auditoria-filiais/*" element={<AuditoriaFiliaisModulo />} />
 * Aqui é igual, só que dentro da moldura de testes. */
export default function App() {
  return (
    <Routes>
      <Route element={<LayoutTeste />}>
        <Route path={`${BASE_AUDITORIA_FILIAIS}/*`} element={<AuditoriaFiliaisModulo />} />
        <Route path="*" element={<Navigate to={BASE_AUDITORIA_FILIAIS} replace />} />
      </Route>
    </Routes>
  );
}
