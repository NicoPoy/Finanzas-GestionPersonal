const currencyNumberFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const currencyDecimalFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Formateador unico de moneda. Evita el espacio de Intl entre "$" y numero para que no corte lineas raras.
export const currency = {
  format(value) {
    const numericValue = Number(value) || 0;
    const formatter = Math.abs(numericValue % 1) > 0 ? currencyDecimalFormatter : currencyNumberFormatter;

    return `$${formatter.format(numericValue)}`;
  },
};

const moneyInputFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const moneyInputDecimalFormatter = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseMoneyInput(value) {
  const normalizedValue = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function formatMoneyInput(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "";
  }

  const formatter = numericValue % 1 === 0 ? moneyInputFormatter : moneyInputDecimalFormatter;

  return `$${formatter.format(numericValue)}`;
}
