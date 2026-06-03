import React, { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onLogin({ email, password });
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-label="Inicio de sesion">
        <div className="login-copy">
          <p>Finanzas personales</p>
          <h1>Ingresar</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              placeholder="tu@email.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Contrasena
            <input
              autoComplete="current-password"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button type="submit">Entrar</button>
        </form>

        <p className="login-note">Login visual preparado. La autenticacion real se conecta cuando definamos usuarios y registro.</p>
      </section>
    </main>
  );
}
