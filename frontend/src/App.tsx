import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutTeste } from './components/Layout/LayoutTeste';
import { LoginTeste } from './components/Layout/LoginTeste';
import { lerSessao } from './components/Layout/sessaoTeste';
import { AuditoriaFiliaisModulo } from './components/AuditoriaFiliais/AuditoriaFiliaisModulo';
import { BASE_AUDITORIA_FILIAIS } from './components/AuditoriaFiliais/rotas';

/** Na Intranet, o módulo entra como UMA rota dentro do LayoutPrincipal:
 *   <Route path="/controladoria/auditoria-filiais/*" element={<AuditoriaFiliaisModulo />} />
 * Aqui é igual, só que dentro da moldura de testes (com login de teste). */
function ExigeLogin({ children }: { children: ReactNode }) {
  return lerSessao() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginTeste />} />
      <Route element={<ExigeLogin><LayoutTeste /></ExigeLogin>}>
        <Route path={`${BASE_AUDITORIA_FILIAIS}/*`} element={<AuditoriaFiliaisModulo />} />
        <Route path="*" element={<Navigate to={BASE_AUDITORIA_FILIAIS} replace />} />
      </Route>
    </Routes>
  );
}
