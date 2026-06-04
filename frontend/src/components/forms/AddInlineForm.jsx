import React, { useState } from "react";
import { Plus } from "lucide-react";

// Formulario compacto usado para agregar bancos y tarjetas desde el panel lateral.
export default function AddInlineForm({ buttonLabel, inputLabel, onSubmit, placeholder }) {
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!value.trim()) {
      return;
    }

    onSubmit(value.trim());
    setValue("");
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <label>
        {inputLabel}
        <input
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>

      <button type="submit">
        <Plus size={17} />
        {buttonLabel}
      </button>
    </form>
  );
}
