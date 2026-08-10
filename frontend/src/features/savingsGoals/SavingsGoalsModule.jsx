import React, { useState } from "react";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import MoneyInput from "../../components/forms/MoneyInput.jsx";
import { currency } from "../../utils/formatters.js";
import "./savingsGoals.css";

export default function SavingsGoalsModule({ goals = [], onAdd, onRemove, onUpdate }) {
  const totals = goals.reduce(
    (summary, goal) => ({
      current: summary.current + (Number(goal.currentAmount) || 0),
      monthly: summary.monthly + (Number(goal.monthlyContribution) || 0),
      target: summary.target + (Number(goal.targetAmount) || 0),
    }),
    { current: 0, monthly: 0, target: 0 },
  );
  const globalProgress = getProgress(totals.current, totals.target);

  return (
    <section className="workspace single-column savings-goals-workspace">
      <section className="detail-panel savings-goals-panel">
        <div className="section-heading">
          <div>
            <p>Ahorro planificado</p>
            <h2>Metas de Ahorro</h2>
          </div>
          <PiggyBank size={34} strokeWidth={1.7} />
        </div>

        <SavingsGoalForm onSubmit={onAdd} />

        <div className="savings-goals-summary">
          <SummaryItem label="Ahorrado" value={currency.format(totals.current)} />
          <SummaryItem label="Objetivo" value={currency.format(totals.target)} />
          <SummaryItem label="Aporte mensual" value={currency.format(totals.monthly)} />
          <SummaryItem label="Avance" value={`${globalProgress}%`} />
        </div>

        {goals.length ? (
          <div className="savings-goal-list">
            {goals.map((goal) => (
              <SavingsGoalCard goal={goal} key={goal.id} onRemove={onRemove} onUpdate={onUpdate} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PiggyBank size={28} />
            <p>Todavía no cargaste metas de ahorro.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function SavingsGoalForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const canSubmit = name.trim() && Number(targetAmount) > 0;

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      currentAmount: Number(currentAmount) || 0,
      monthlyContribution: Number(monthlyContribution) || 0,
      name: name.trim(),
      targetAmount: Number(targetAmount) || 0,
    });
    setName("");
    setTargetAmount("");
    setCurrentAmount("");
    setMonthlyContribution("");
  }

  return (
    <form className="expense-form savings-goal-form" onSubmit={handleSubmit}>
      <label>
        Meta
        <input autoComplete="off" onChange={(event) => setName(event.target.value)} placeholder="Ej: vacaciones" value={name} />
      </label>
      <label>
        Objetivo
        <MoneyInput onValueChange={setTargetAmount} value={targetAmount} />
      </label>
      <label>
        Ahorrado
        <MoneyInput onValueChange={setCurrentAmount} value={currentAmount} />
      </label>
      <label>
        Aporte mensual
        <MoneyInput onValueChange={setMonthlyContribution} value={monthlyContribution} />
      </label>
      <button disabled={!canSubmit} type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}

function SavingsGoalCard({ goal, onRemove, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({
    currentAmount: String(goal.currentAmount || ""),
    monthlyContribution: String(goal.monthlyContribution || ""),
    name: goal.name,
    targetAmount: String(goal.targetAmount || ""),
  }));
  const current = Number(goal.currentAmount) || 0;
  const target = Number(goal.targetAmount) || 0;
  const monthly = Number(goal.monthlyContribution) || 0;
  const remaining = Math.max(target - current, 0);
  const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : null;
  const progress = getProgress(current, target);

  function saveEdit(event) {
    event.preventDefault();

    if (!draft.name.trim() || Number(draft.targetAmount) <= 0) {
      return;
    }

    onUpdate(goal.id, {
      currentAmount: Number(draft.currentAmount) || 0,
      monthlyContribution: Number(draft.monthlyContribution) || 0,
      name: draft.name.trim(),
      targetAmount: Number(draft.targetAmount) || 0,
    });
    setIsEditing(false);
  }

  return (
    <article className="savings-goal-card">
      {isEditing ? (
        <form className="savings-goal-edit" onSubmit={saveEdit}>
          <label>
            Meta
            <input value={draft.name} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))} />
          </label>
          <label>
            Objetivo
            <MoneyInput value={draft.targetAmount} onValueChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, targetAmount: value }))} />
          </label>
          <label>
            Ahorrado
            <MoneyInput value={draft.currentAmount} onValueChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, currentAmount: value }))} />
          </label>
          <label>
            Aporte mensual
            <MoneyInput value={draft.monthlyContribution} onValueChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, monthlyContribution: value }))} />
          </label>
          <div className="savings-goal-edit-actions">
            <button className="confirm-button confirm-button-secondary" onClick={() => setIsEditing(false)} type="button">Cancelar</button>
            <button className="confirm-button confirm-button-primary" type="submit">Guardar</button>
          </div>
        </form>
      ) : (
        <>
          <div className="savings-goal-header">
            <div>
              <strong>{goal.name}</strong>
              <small>{monthsLeft == null ? "Sin aporte mensual definido" : monthsLeft ? `${monthsLeft} meses estimados` : "Meta alcanzada"}</small>
            </div>
            <div className="savings-goal-actions">
              <button className="icon-button btn-edit-expense" onClick={() => setIsEditing(true)} title="Editar meta" type="button">
                <Pencil size={15} />
              </button>
              <button className="icon-button btn-delete-expense" onClick={() => onRemove(goal.id)} title="Eliminar meta" type="button">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
          <div className="savings-goal-progress" aria-label={`Avance ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="savings-goal-stats">
            <span><small>Ahorrado</small><strong>{currency.format(current)}</strong></span>
            <span><small>Falta</small><strong>{currency.format(remaining)}</strong></span>
            <span><small>Objetivo</small><strong>{currency.format(target)}</strong></span>
          </div>
        </>
      )}
    </article>
  );
}

function SummaryItem({ label, value }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function getProgress(current, target) {
  if (!target) {
    return 0;
  }

  return Math.min(Math.round(((Number(current) || 0) / target) * 100), 100);
}