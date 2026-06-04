import React from "react";

// Tarjeta chica del resumen superior. Recibe icono y valores ya calculados.
export default function Metric({ icon, label, tone, value }) {
  return (
    <div className={`metric ${tone ? `metric-${tone}` : ""}`}>
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
