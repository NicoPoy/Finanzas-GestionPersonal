import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";

// Mantiene el valor editable del sueldo separado del estado global hasta guardar.
export default function SalaryForm({ onSubmit, salary }) {
  const [salaryValue, setSalaryValue] = useState(salary || "");

  useEffect(() => {
    setSalaryValue(salary || "");
  }, [salary]);

  function handleSubmit(event) {
    event.preventDefault();
    const parsedSalary = Number(salaryValue);

    if (parsedSalary < 0) {
      return;
    }

    onSubmit(parsedSalary);
  }

  return (
    <form className="expense-form salary-form" onSubmit={handleSubmit}>
      <label>
        Sueldo mensual
        <MoneyInput
          min="0"
          value={salaryValue}
          onValueChange={setSalaryValue}
        />
      </label>

      <button type="submit">
        <Settings size={18} />
        Guardar
      </button>
    </form>
  );
}
