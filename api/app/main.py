from datetime import date

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from api.app.routers import auth, database, profile, system


# Instancia ASGI que usa Vercel para ejecutar FastAPI.
# Los paths de docs empiezan con /api para convivir con el frontend en el mismo dominio.
app = FastAPI(
    title="Finanzas API",
    description="API para el administrador mensual de finanzas personales.",
    version="0.2.0",
    docs_url=None,
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
    allow_origins=[
        "capacitor://localhost",
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "https://localhost",
        "https://finanzas-gestion.vercel.app",
    ],
)

app.include_router(system.router)
app.include_router(auth.router)
app.include_router(database.router)
app.include_router(profile.router)


@app.get("/api/docs", include_in_schema=False)
def custom_swagger_ui():
    """Swagger UI institucional con accesos y filtros para desarrollo."""

    updated_at = date.today().strftime("%d/%m/%Y")

    return HTMLResponse(
        f"""
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Finanzas API - Swagger</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
      :root {{
        --ink: #17243a;
        --muted: #50627f;
        --line: #c8d3e3;
        --surface: #f7f9fc;
        --surface-soft: #edf3f8;
        --brand: #0ea5b7;
        --brand-dark: #0f6f80;
        --accent: #dd2777;
        --ok: #15a56a;
        --warn: #e6a21a;
        --danger: #d94a4a;
        --shadow: 0 16px 38px rgba(31, 47, 72, 0.12);
      }}

      * {{ box-sizing: border-box; }}

      body {{
        margin: 0;
        background:
          radial-gradient(circle at 18% 0%, rgba(221, 39, 119, 0.16), transparent 32rem),
          linear-gradient(180deg, #d9e4ee 0%, #edf3f8 36%, #e3ebf3 100%);
        color: var(--ink);
        font-family: Inter, Segoe UI, Roboto, Arial, sans-serif;
      }}

      .swagger-shell {{
        min-height: 100vh;
      }}

      .topbar-brand {{
        height: 72px;
        display: grid;
        place-items: center;
        background: linear-gradient(90deg, #d9227d 0%, #1aa9ba 100%);
        color: white;
        box-shadow: 0 8px 24px rgba(18, 40, 70, 0.18);
        font-weight: 900;
        letter-spacing: 0;
      }}

      .topbar-brand span {{
        padding: 0.55rem 0.8rem;
        border: 3px solid rgba(255, 255, 255, 0.32);
        border-radius: 999px;
      }}

      .docs-wrap {{
        width: min(1460px, calc(100% - 40px));
        margin: 0 auto;
        padding: 46px 0 72px;
      }}

      .hero-row {{
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 18px;
      }}

      .title-stack h1 {{
        margin: 0;
        color: var(--ink);
        font-size: clamp(2rem, 4vw, 3rem);
        line-height: 1;
      }}

      .title-stack p {{
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 0.98rem;
      }}

      .updated-card {{
        flex: 0 0 auto;
        padding: 12px 18px;
        border: 1px solid rgba(14, 165, 183, 0.28);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.72);
        box-shadow: var(--shadow);
        color: var(--ink);
        font-size: 0.92rem;
        font-weight: 800;
      }}

      .quick-panel {{
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 18px;
        margin: 24px 0;
        padding: 20px 22px;
        border: 1px solid rgba(14, 165, 183, 0.2);
        border-left: 6px solid var(--accent);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: var(--shadow);
      }}

      .quick-panel h2 {{
        margin: 0 0 6px;
        font-size: 1.25rem;
      }}

      .quick-panel p {{
        margin: 0;
        color: var(--muted);
      }}

      .quick-actions {{
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 10px;
      }}

      .quick-actions a,
      .quick-actions button,
      .filter-bar button {{
        min-height: 42px;
        border: 0;
        border-radius: 8px;
        padding: 0 16px;
        cursor: pointer;
        background: var(--brand);
        color: white;
        font: 900 0.8rem/1 Inter, Segoe UI, Arial, sans-serif;
        text-decoration: none;
        text-transform: uppercase;
        box-shadow: 0 8px 18px rgba(14, 165, 183, 0.22);
      }}

      .quick-actions .dark {{
        background: #1d2a42;
        box-shadow: 0 8px 18px rgba(29, 42, 66, 0.18);
      }}

      .quick-actions .copied {{
        background: var(--ok);
      }}

      .filter-bar {{
        display: grid;
        grid-template-columns: minmax(220px, 1fr) minmax(180px, 260px) auto;
        gap: 12px;
        margin: 0 0 20px;
      }}

      .filter-bar input,
      .filter-bar select {{
        width: 100%;
        min-height: 44px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.86);
        color: var(--ink);
        padding: 0 14px;
        font: 700 0.95rem Inter, Segoe UI, Arial, sans-serif;
      }}

      .filter-bar input:focus,
      .filter-bar select:focus {{
        outline: 3px solid rgba(14, 165, 183, 0.18);
        border-color: var(--brand);
      }}

      .swagger-ui {{
        color: var(--ink);
      }}

      .swagger-ui .info,
      .swagger-ui .topbar {{
        display: none;
      }}

      .swagger-ui .scheme-container {{
        margin: 0 0 20px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.78);
        box-shadow: var(--shadow);
      }}

      .swagger-ui .opblock-tag-section {{
        margin: 18px 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.7);
        box-shadow: 0 10px 28px rgba(31, 47, 72, 0.08);
      }}

      .swagger-ui .opblock-tag {{
        padding: 18px 22px;
        border-bottom: 1px solid var(--line);
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(224, 241, 245, 0.85));
        color: var(--ink);
        font-size: 1.32rem;
      }}

      .swagger-ui .opblock-tag:hover {{
        background: linear-gradient(90deg, #ffffff, #d8eef3);
      }}

      .swagger-ui .opblock {{
        border-radius: 8px;
        box-shadow: none;
      }}

      .swagger-ui .opblock.opblock-get {{
        border-color: var(--brand);
        background: rgba(14, 165, 183, 0.08);
      }}

      .swagger-ui .opblock.opblock-post {{
        border-color: var(--accent);
        background: rgba(221, 39, 119, 0.08);
      }}

      .swagger-ui .opblock.opblock-put,
      .swagger-ui .opblock.opblock-patch {{
        border-color: var(--warn);
        background: rgba(230, 162, 26, 0.1);
      }}

      .swagger-ui .opblock.opblock-delete {{
        border-color: var(--danger);
        background: rgba(217, 74, 74, 0.1);
      }}

      .swagger-ui .opblock .opblock-summary-method {{
        border-radius: 6px;
        min-width: 72px;
      }}

      .swagger-ui .opblock.opblock-get .opblock-summary-method {{ background: var(--brand-dark); }}
      .swagger-ui .opblock.opblock-post .opblock-summary-method {{ background: var(--accent); }}
      .swagger-ui .opblock.opblock-put .opblock-summary-method,
      .swagger-ui .opblock.opblock-patch .opblock-summary-method {{ background: var(--warn); }}
      .swagger-ui .opblock.opblock-delete .opblock-summary-method {{ background: var(--danger); }}

      .swagger-ui .opblock-summary-path,
      .swagger-ui .opblock-summary-description,
      .swagger-ui table thead tr td,
      .swagger-ui table thead tr th,
      .swagger-ui .parameter__name,
      .swagger-ui .parameter__type,
      .swagger-ui .response-col_status,
      .swagger-ui .response-col_description {{
        color: var(--ink);
      }}

      .swagger-ui .wrapper {{
        padding: 0;
      }}

      @media (max-width: 820px) {{
        .docs-wrap {{
          width: min(100% - 24px, 1460px);
          padding-top: 28px;
        }}

        .hero-row,
        .quick-panel {{
          grid-template-columns: 1fr;
          display: grid;
        }}

        .quick-actions {{
          justify-content: stretch;
        }}

        .quick-actions a,
        .quick-actions button {{
          flex: 1 1 160px;
        }}

        .filter-bar {{
          grid-template-columns: 1fr;
        }}
      }}
    </style>
  </head>
  <body>
    <main class="swagger-shell">
      <header class="topbar-brand" aria-label="Identidad institucional">
        <span>Finanzas API</span>
      </header>
      <section class="docs-wrap">
        <div class="hero-row">
          <div class="title-stack">
            <h1>Finanzas API</h1>
            <p>Documentacion tecnica para usuarios, perfiles, sistema y datos financieros.</p>
          </div>
          <div class="updated-card">actualizado: {updated_at}</div>
        </div>

        <section class="quick-panel" aria-label="Accesos rapidos">
          <div>
            <h2>Accesos rapidos para desarrolladores</h2>
            <p>OpenAPI, estado operativo y URL base para pruebas locales.</p>
          </div>
          <div class="quick-actions">
            <button type="button" id="copy-base-url">Copiar Base URL</button>
            <a href="/api/openapi.json">Swagger JSON</a>
            <a class="dark" href="/api/health">Health Check</a>
          </div>
        </section>

        <section class="filter-bar" aria-label="Filtros de endpoints">
          <input id="endpoint-search" type="search" placeholder="Buscar endpoint, metodo o descripcion">
          <select id="module-filter">
            <option value="">Todos los modulos</option>
          </select>
          <button type="button" id="clear-filters">Limpiar</button>
        </section>

        <div id="swagger-ui"></div>
      </section>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      const baseUrl = window.location.origin + "/api";
      const copyButton = document.getElementById("copy-base-url");
      const searchInput = document.getElementById("endpoint-search");
      const moduleFilter = document.getElementById("module-filter");
      const clearButton = document.getElementById("clear-filters");

      function normalize(value) {{
        return (value || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
      }}

      function getSections() {{
        return Array.from(document.querySelectorAll(".opblock-tag-section"));
      }}

      function refreshModuleOptions() {{
        const selected = moduleFilter.value;
        const tags = getSections()
          .map((section) => section.querySelector(".opblock-tag")?.textContent?.trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        moduleFilter.innerHTML = '<option value="">Todos los modulos</option>';
        for (const tag of tags) {{
          const option = document.createElement("option");
          option.value = tag;
          option.textContent = tag;
          moduleFilter.appendChild(option);
        }}
        moduleFilter.value = tags.includes(selected) ? selected : "";
      }}

      function applyFilters() {{
        const query = normalize(searchInput.value);
        const moduleName = normalize(moduleFilter.value);

        for (const section of getSections()) {{
          const tag = normalize(section.querySelector(".opblock-tag")?.textContent);
          const operations = Array.from(section.querySelectorAll(".opblock"));
          let visibleCount = 0;

          for (const operation of operations) {{
            const matchesQuery = !query || normalize(operation.textContent).includes(query);
            operation.style.display = matchesQuery ? "" : "none";
            if (matchesQuery) visibleCount += 1;
          }}

          const matchesModule = !moduleName || tag.includes(moduleName);
          section.style.display = matchesModule && visibleCount > 0 ? "" : "none";
        }}
      }}

      async function copyText(value) {{
        if (navigator.clipboard) {{
          await navigator.clipboard.writeText(value);
          return;
        }}

        const input = document.createElement("textarea");
        input.value = value;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }}

      copyButton.addEventListener("click", async () => {{
        await copyText(baseUrl);
        copyButton.textContent = "Base URL copiada";
        copyButton.classList.add("copied");
        window.setTimeout(() => {{
          copyButton.textContent = "Copiar Base URL";
          copyButton.classList.remove("copied");
        }}, 1800);
      }});

      searchInput.addEventListener("input", applyFilters);
      moduleFilter.addEventListener("change", applyFilters);
      clearButton.addEventListener("click", () => {{
        searchInput.value = "";
        moduleFilter.value = "";
        applyFilters();
      }});

      window.ui = SwaggerUIBundle({{
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        filter: true,
        layout: "StandaloneLayout",
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        onComplete: () => {{
          refreshModuleOptions();
          applyFilters();
        }}
      }});

      const observer = new MutationObserver(() => {{
        refreshModuleOptions();
        applyFilters();
      }});
      observer.observe(document.getElementById("swagger-ui"), {{ childList: true, subtree: true }});
    </script>
  </body>
</html>
        """
    )
