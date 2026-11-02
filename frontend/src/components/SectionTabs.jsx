import React from "react";
import "./sectionTabs.css";

export default function SectionTabs({ activeId, ariaLabel, onSelect, tabs, variant = "" }) {
  return (
    <div aria-label={ariaLabel} className={`section-tabs ${variant ? `section-tabs-${variant}` : ""}`} role="group">
      {tabs.map((tab) => (
        <button
          aria-pressed={activeId === tab.id}
          className={activeId === tab.id ? "active" : ""}
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          type="button"
        >
          <span className="section-tab-label">
            {tab.label}
            {tab.count != null ? <small className="section-tab-count">{tab.count}</small> : null}
          </span>
          {tab.summary ? <small className="section-tab-summary">{tab.summary}</small> : null}
        </button>
      ))}
    </div>
  );
}
