import React, { useEffect, useState } from "react";
import { formatMoneyInput, parseMoneyInput } from "../../utils/formatters.js";

export default function MoneyInput({ min = 0, onValueChange, placeholder = "$0", value, ...props }) {
  const [displayValue, setDisplayValue] = useState(formatMoneyInput(value));

  useEffect(() => {
    setDisplayValue(formatMoneyInput(value));
  }, [value]);

  function handleChange(event) {
    const nextDisplayValue = formatEditableMoney(event.target.value);
    const parsedValue = parseMoneyInput(nextDisplayValue);
    const nextValue = parsedValue < min ? min : parsedValue;

    setDisplayValue(nextDisplayValue);
    onValueChange?.(nextValue ? String(nextValue) : "");
  }

  function handleBlur() {
    setDisplayValue(formatMoneyInput(value));
  }

  return (
    <input
      {...props}
      inputMode="decimal"
      placeholder={placeholder}
      type="text"
      value={displayValue}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  );
}

function formatEditableMoney(inputValue) {
  const cleanValue = String(inputValue ?? "").replace(/[^\d,]/g, "");

  if (!cleanValue) {
    return "";
  }

  const [integerPart, ...decimalParts] = cleanValue.split(",");
  const integerValue = Number(integerPart || 0);
  const formattedInteger = integerPart
    ? new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(integerValue)
    : "0";

  if (!cleanValue.includes(",")) {
    return `$${formattedInteger}`;
  }

  const decimalValue = decimalParts.join("").replace(/\D/g, "").slice(0, 2);

  return `$${formattedInteger},${decimalValue}`;
}
