// Formateador unico de moneda. Centralizarlo garantiza que toda la app muestre ARS igual.
export const currency = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
