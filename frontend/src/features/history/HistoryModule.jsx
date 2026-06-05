import React from "react";
import { History, ReceiptText } from "lucide-react";
import { currency } from "../../utils/formatters.js";

export default function HistoryModule({ history }) {
  return (
    <section className="workspace single-column">
      <section className="detail-panel">
        <div className="section-heading">
          <div>
            <p>Trazabilidad</p>
            <h2>Historial</h2>
          </div>
          <History size={34} strokeWidth={1.7} />
        </div>

        {history.length ? (
          <div className="history-list">
            {history.map((item) => (
              <article className="history-item large" key={item.id}>
                <span>
                  <strong>{item.serviceName}</strong>
                  <small>
                    {item.period} · {item.category} · {new Date(item.paidAt).toLocaleDateString("es-AR")}
                  </small>
                  {item.notes ? <small>{item.notes}</small> : null}
                </span>
                <b>{currency.format(item.paidAmount)}</b>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <ReceiptText size={28} />
            <p>Todavia no hay pagos registrados.</p>
          </div>
        )}
      </section>
    </section>
  );
}
