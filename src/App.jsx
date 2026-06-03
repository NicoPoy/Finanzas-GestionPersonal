import React, { useState } from "react";
import LoginScreen from "./components/auth/LoginScreen.jsx";
import FinanceApp from "./features/finance/FinanceApp.jsx";
import "./styles.css";

// App decide si mostrar el login visual o la aplicacion.
// Cuando exista autenticacion real, este estado local se reemplaza por una sesion del backend.
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return <FinanceApp />;
}
