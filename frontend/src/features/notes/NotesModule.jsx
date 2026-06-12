import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  ClipboardList,
  Loader2,
  NotebookPen,
  PackagePlus,
  Pencil,
  Plus,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { apiUrl } from "../../services/platform.js";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";

const UNIT_OPTIONS = ["unidad", "kg", "g", "lt", "ml", "pack"];
const INITIAL_NOTES_DATA = {
  productStores: [],
};

export default function NotesModule({ accessToken, onBackToHome, onToggleTheme, theme }) {
  const [data, setData] = useState(INITIAL_NOTES_DATA);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(apiUrl("/api/notes"), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar tus notas.");
        }

        const profile = normalizeNotesData(await response.json());
        setData(profile);
        setSelectedStoreId(profile.productStores[0]?.id ?? "");
        setHasLoadedProfile(true);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar tus notas.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [accessToken]);

  useEffect(() => {
    if (!hasLoadedProfile) {
      return;
    }

    async function saveProfile() {
      try {
        await fetch(apiUrl("/api/notes"), {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } catch {
        setError("No se pudieron guardar tus notas.");
      }
    }

    saveProfile();
  }, [accessToken, data, hasLoadedProfile]);

  const selectedStore = useMemo(
    () => data.productStores.find((store) => store.id === selectedStoreId) ?? data.productStores[0],
    [data.productStores, selectedStoreId],
  );
  const productCount = data.productStores.reduce((total, store) => total + store.products.length, 0);

  function updateStores(updater) {
    setData((currentData) => ({
      ...currentData,
      productStores: updater(currentData.productStores),
    }));
  }

  function handleAddStore(name) {
    const store = {
      id: crypto.randomUUID(),
      name,
      products: [],
    };

    updateStores((stores) => [...stores, store]);
    setSelectedStoreId(store.id);
  }

  function handleRemoveStore(storeId) {
    updateStores((stores) => {
      const nextStores = stores.filter((store) => store.id !== storeId);

      if (selectedStoreId === storeId) {
        setSelectedStoreId(nextStores[0]?.id ?? "");
      }

      return nextStores;
    });
  }

  function handleRenameStore(storeId, name) {
    updateStores((stores) => stores.map((store) => (store.id === storeId ? { ...store, name } : store)));
  }

  function handleAddProduct(storeId, product) {
    updateStores((stores) =>
      stores.map((store) =>
        store.id === storeId
          ? {
              ...store,
              products: [
                ...store.products,
                {
                  ...product,
                  id: crypto.randomUUID(),
                },
              ],
            }
          : store,
      ),
    );
  }

  function handleUpdateProduct(storeId, productId, updates) {
    updateStores((stores) =>
      stores.map((store) =>
        store.id === storeId
          ? {
              ...store,
              products: store.products.map((product) =>
                product.id === productId ? { ...product, ...updates } : product,
              ),
            }
          : store,
      ),
    );
  }

  function handleRemoveProduct(storeId, productId) {
    updateStores((stores) =>
      stores.map((store) =>
        store.id === storeId
          ? {
              ...store,
              products: store.products.filter((product) => product.id !== productId),
            }
          : store,
      ),
    );
  }

  return (
    <main className="app-shell">
      <section className="notes-shell">
        <header className="notes-header">
          <div className="notes-header-actions">
            <button
              aria-label="Volver al inicio"
              className="header-action-button"
              onClick={onBackToHome}
              title="Volver al inicio"
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
          <div className="notes-title">
            <NotebookPen size={22} />
            <h1>Notas</h1>
          </div>
        </header>

        <section className="notes-products-hero" aria-label="Productos">
          <div>
            <p>Productos</p>
            <h2>Locales y productos frecuentes</h2>
          </div>
          <div className="notes-product-stats" aria-label="Resumen de productos">
            <span>
              <strong>{data.productStores.length}</strong>
              locales
            </span>
            <span>
              <strong>{productCount}</strong>
              productos
            </span>
          </div>
        </section>

        {error ? <p className="notes-alert">{error}</p> : null}

        {isLoading ? (
          <div className="notes-empty">
            <Loader2 className="spin-icon" size={34} strokeWidth={1.8} />
            <p>Cargando notas...</p>
          </div>
        ) : (
          <section className="notes-products-layout">
            <aside className="notes-store-panel" aria-label="Locales">
              <div className="notes-panel-heading">
                <div>
                  <p>Locales</p>
                  <h3>Productos</h3>
                </div>
                <Store size={24} />
              </div>

              <StoreForm onSubmit={handleAddStore} />

              {data.productStores.length ? (
                <div className="notes-store-list">
                  {data.productStores.map((store) => (
                    <button
                      className={`notes-store-tab${store.id === selectedStore?.id ? " active" : ""}`}
                      key={store.id}
                      onClick={() => setSelectedStoreId(store.id)}
                      type="button"
                    >
                      <Building2 size={18} />
                      <span>
                        <strong>{store.name}</strong>
                        <small>
                          {store.products.length} {store.products.length === 1 ? "producto" : "productos"}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="notes-mini-empty">
                  <Store size={24} />
                  <p>Agrega tu primer local.</p>
                </div>
              )}
            </aside>

            <section className="notes-products-panel" aria-label="Productos del local">
              {selectedStore ? (
                <>
                  <StoreHeader
                    onRemove={() => handleRemoveStore(selectedStore.id)}
                    onRename={(name) => handleRenameStore(selectedStore.id, name)}
                    store={selectedStore}
                  />

                  <ProductForm onSubmit={(product) => handleAddProduct(selectedStore.id, product)} />

                  <ProductList
                    onRemove={(productId) => handleRemoveProduct(selectedStore.id, productId)}
                    onUpdate={(productId, updates) => handleUpdateProduct(selectedStore.id, productId, updates)}
                    products={selectedStore.products}
                  />
                </>
              ) : (
                <div className="notes-empty">
                  <ClipboardList size={40} strokeWidth={1.5} />
                  <p>No hay locales cargados.</p>
                  <span>Crea un local para empezar a guardar sus productos.</span>
                </div>
              )}
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

function normalizeNotesData(data) {
  return {
    ...INITIAL_NOTES_DATA,
    ...data,
    productStores: (Array.isArray(data?.productStores) ? data.productStores : []).map((store) => ({
      ...store,
      id: String(store.id ?? crypto.randomUUID()),
      name: String(store.name ?? "").trim(),
      products: (Array.isArray(store.products) ? store.products : []).map((product) => ({
        ...product,
        id: String(product.id ?? crypto.randomUUID()),
        name: String(product.name ?? "").trim(),
        note: String(product.note ?? "").trim(),
        quantity: String(product.quantity ?? "").trim(),
        unit: String(product.unit ?? "unidad").trim() || "unidad",
      })),
    })),
  };
}

function StoreForm({ onSubmit }) {
  const [name, setName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    onSubmit(name.trim());
    setName("");
  }

  return (
    <form className="notes-store-form" onSubmit={handleSubmit}>
      <label>
        Local
        <input
          autoComplete="off"
          placeholder="Ej: supermercado"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <button type="submit" title="Agregar local">
        <Plus size={18} />
      </button>
    </form>
  );
}

function StoreHeader({ onRemove, onRename, store }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(store.name);

  useEffect(() => {
    setDraftName(store.name);
    setIsEditing(false);
  }, [store.id, store.name]);

  function saveName() {
    if (!draftName.trim()) {
      return;
    }

    onRename(draftName.trim());
    setIsEditing(false);
  }

  return (
    <div className="notes-selected-store">
      {isEditing ? (
        <label>
          Nombre del local
          <input
            autoComplete="off"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
        </label>
      ) : (
        <div>
          <p>Local seleccionado</p>
          <h2>{store.name}</h2>
        </div>
      )}

      <div className="notes-row-actions">
        {isEditing ? (
          <>
            <button onClick={saveName} title="Guardar local" type="button">
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setDraftName(store.name);
                setIsEditing(false);
              }}
              title="Cancelar edicion"
              type="button"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} title="Editar local" type="button">
            <Pencil size={16} />
          </button>
        )}
        <button className="danger" onClick={onRemove} title="Eliminar local" type="button">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function ProductForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("unidad");
  const [note, setNote] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      note: note.trim(),
      quantity: quantity.trim(),
      unit,
    });
    setName("");
    setQuantity("");
    setUnit("unidad");
    setNote("");
  }

  return (
    <form className="notes-product-form" onSubmit={handleSubmit}>
      <label>
        Producto
        <input
          autoComplete="off"
          placeholder="Ej: arroz"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Cantidad
        <input
          autoComplete="off"
          inputMode="decimal"
          placeholder="Ej: 1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </label>
      <label>
        Unidad o peso
        <select value={unit} onChange={(event) => setUnit(event.target.value)}>
          {UNIT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="notes-product-note-field">
        Nota
        <input
          autoComplete="off"
          placeholder="Opcional"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button type="submit">
        <PackagePlus size={18} />
        Agregar
      </button>
    </form>
  );
}

function ProductList({ onRemove, onUpdate, products }) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({ name: "", note: "", quantity: "", unit: "unidad" });

  if (!products.length) {
    return (
      <div className="notes-empty notes-products-empty">
        <ClipboardList size={34} strokeWidth={1.6} />
        <p>Todavia no cargaste productos en este local.</p>
        <span>Agrega productos con unidad o peso para tenerlos a mano.</span>
      </div>
    );
  }

  return (
    <div className="notes-products-list">
      {products.map((product) => {
        const isEditing = editingId === product.id;

        return (
          <div className="notes-product-row" key={product.id}>
            {isEditing ? (
              <div className="notes-product-edit-grid">
                <input
                  aria-label="Producto"
                  autoComplete="off"
                  value={draft.name}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
                />
                <input
                  aria-label="Cantidad"
                  autoComplete="off"
                  inputMode="decimal"
                  value={draft.quantity}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({ ...currentDraft, quantity: event.target.value }))
                  }
                />
                <select
                  aria-label="Unidad o peso"
                  value={draft.unit}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, unit: event.target.value }))}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Nota"
                  autoComplete="off"
                  value={draft.note}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, note: event.target.value }))}
                />
              </div>
            ) : (
              <div className="notes-product-copy">
                <strong>{product.name}</strong>
                <span>
                  {product.quantity ? `${product.quantity} ${product.unit}` : product.unit}
                  {product.note ? <small>{product.note}</small> : null}
                </span>
              </div>
            )}

            <div className="notes-row-actions">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      if (!draft.name.trim()) {
                        return;
                      }

                      onUpdate(product.id, {
                        name: draft.name.trim(),
                        note: draft.note.trim(),
                        quantity: draft.quantity.trim(),
                        unit: draft.unit,
                      });
                      setEditingId("");
                    }}
                    title="Guardar producto"
                    type="button"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId("");
                      setDraft({ name: "", note: "", quantity: "", unit: "unidad" });
                    }}
                    title="Cancelar edicion"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(product.id);
                    setDraft({
                      name: product.name,
                      note: product.note ?? "",
                      quantity: product.quantity ?? "",
                      unit: product.unit ?? "unidad",
                    });
                  }}
                  title="Editar producto"
                  type="button"
                >
                  <Pencil size={16} />
                </button>
              )}
              <button className="danger" onClick={() => onRemove(product.id)} title="Eliminar producto" type="button">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
