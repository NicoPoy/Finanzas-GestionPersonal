import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  Circle,
  ClipboardList,
  CopyPlus,
  Home,
  Loader2,
  NotebookPen,
  PackagePlus,
  Pencil,
  Plus,
  Store,
  Trash2,
} from "lucide-react";
import { apiUrl } from "../../services/platform.js";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";

const UNIT_OPTIONS = ["unidad", "kg", "g", "lt", "ml", "pack"];
const CATEGORY_OPTIONS = ["general", "comida", "limpieza", "higiene", "mascota", "farmacia"];
const DEPARTMENT_CATEGORY_OPTIONS = ["general", "cocina", "baño", "habitacion", "limpieza", "decoracion", "arreglo"];
const PRIORITY_OPTIONS = ["baja", "media", "alta"];
const INITIAL_NOTES_DATA = {
  departmentNeeds: [],
  productStores: [],
};

const DEMO_NOTES_DATA = {
  departmentNeeds: [
    {
      id: "demo-need-curtains",
      name: "Comprar cortinas blackout",
      category: "decoracion",
      note: "Medir ventana del dormitorio antes de comprar.",
      priority: "media",
      done: false,
    },
    {
      id: "demo-need-kitchen",
      name: "Revisar perdida de la canilla",
      category: "cocina",
      note: "Pedir presupuesto si sigue goteando.",
      priority: "alta",
      done: false,
    },
  ],
  productStores: [
    {
      id: "demo-store-market",
      name: "Supermercado",
      products: [
        {
          id: "demo-product-rice",
          name: "Arroz",
          quantity: "1",
          unit: "kg",
          category: "comida",
          note: "Comprar si esta en oferta.",
          needed: true,
          checked: false,
        },
        {
          id: "demo-product-detergent",
          name: "Detergente",
          quantity: "1",
          unit: "unidad",
          category: "limpieza",
          note: "",
          needed: true,
          checked: false,
        },
        {
          id: "demo-product-shampoo",
          name: "Shampoo",
          quantity: "1",
          unit: "unidad",
          category: "higiene",
          note: "",
          needed: false,
          checked: false,
        },
      ],
    },
    {
      id: "demo-store-pharmacy",
      name: "Farmacia",
      products: [
        {
          id: "demo-product-toothpaste",
          name: "Pasta dental",
          quantity: "1",
          unit: "unidad",
          category: "higiene",
          note: "",
          needed: true,
          checked: false,
        },
      ],
    },
  ],
};

export default function NotesModule({ accessToken, isDemoMode = false, onBackToHome, onToggleTheme, theme }) {
  const [data, setData] = useState(INITIAL_NOTES_DATA);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [isLoading, setIsLoading] = useState(!isDemoMode);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isDemoMode) {
      const demoNotes = normalizeNotesData(DEMO_NOTES_DATA);
      setData(demoNotes);
      setSelectedStoreId(demoNotes.productStores[0]?.id ?? "");
      setHasLoadedProfile(true);
      setIsLoading(false);
      setError("");
      return;
    }

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
  }, [accessToken, isDemoMode]);

  useEffect(() => {
    if (!hasLoadedProfile || isDemoMode) {
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
  }, [accessToken, data, hasLoadedProfile, isDemoMode]);

  const selectedStore = useMemo(
    () => data.productStores.find((store) => store.id === selectedStoreId) ?? data.productStores[0],
    [data.productStores, selectedStoreId],
  );
  const productCount = data.productStores.reduce((total, store) => total + store.products.length, 0);
  const shoppingItems = data.productStores.flatMap((store) =>
    store.products
      .filter((product) => product.needed && !product.checked)
      .map((product) => ({ ...product, storeId: store.id, storeName: store.name })),
  );
  const pendingDepartmentNeeds = data.departmentNeeds.filter((item) => !item.done).length;

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
                  category: product.category || "general",
                  checked: false,
                  id: crypto.randomUUID(),
                  needed: Boolean(product.needed),
                },
              ],
            }
          : store,
      ),
    );
  }

  function handleDuplicateProduct(sourceStoreId, productId, targetStoreId) {
    if (!targetStoreId || sourceStoreId === targetStoreId) {
      return;
    }

    const sourceStore = data.productStores.find((store) => store.id === sourceStoreId);
    const product = sourceStore?.products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    updateStores((stores) =>
      stores.map((store) =>
        store.id === targetStoreId
          ? {
              ...store,
              products: [
                ...store.products,
                {
                  ...product,
                  checked: false,
                  id: crypto.randomUUID(),
                },
              ],
            }
          : store,
      ),
    );
  }

  function updateDepartmentNeeds(updater) {
    setData((currentData) => ({
      ...currentData,
      departmentNeeds: updater(currentData.departmentNeeds),
    }));
  }

  function handleAddDepartmentNeed(item) {
    updateDepartmentNeeds((items) => [
      ...items,
      {
        ...item,
        done: false,
        id: crypto.randomUUID(),
      },
    ]);
  }

  function handleUpdateDepartmentNeed(itemId, updates) {
    updateDepartmentNeeds((items) => items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  }

  function handleRemoveDepartmentNeed(itemId) {
    updateDepartmentNeeds((items) => items.filter((item) => item.id !== itemId));
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
            <span>
              <strong>{shoppingItems.length}</strong>
              compras
            </span>
            <span>
              <strong>{pendingDepartmentNeeds}</strong>
              casa
            </span>
          </div>
        </section>

        {isDemoMode ? (
          <p className="demo-banner">Modo demo: podes probar notas sin guardar datos en la base.</p>
        ) : null}

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
              <ShoppingMode
                items={shoppingItems}
                onToggle={(storeId, productId, checked) => handleUpdateProduct(storeId, productId, { checked })}
              />

              {selectedStore ? (
                <>
                  <StoreHeader
                    onRemove={() => handleRemoveStore(selectedStore.id)}
                    onRename={(name) => handleRenameStore(selectedStore.id, name)}
                    store={selectedStore}
                  />

                  <ProductForm onSubmit={(product) => handleAddProduct(selectedStore.id, product)} />

                  <ProductList
                    stores={data.productStores}
                    onRemove={(productId) => handleRemoveProduct(selectedStore.id, productId)}
                    onDuplicate={(productId, targetStoreId) =>
                      handleDuplicateProduct(selectedStore.id, productId, targetStoreId)
                    }
                    onUpdate={(productId, updates) => handleUpdateProduct(selectedStore.id, productId, updates)}
                    products={selectedStore.products}
                    selectedStoreId={selectedStore.id}
                  />
                </>
              ) : (
                <div className="notes-empty">
                  <ClipboardList size={40} strokeWidth={1.5} />
                  <p>No hay locales cargados.</p>
                  <span>Crea un local para empezar a guardar sus productos.</span>
                </div>
              )}

              <DepartmentNeedsSection
                items={data.departmentNeeds}
                onAdd={handleAddDepartmentNeed}
                onRemove={handleRemoveDepartmentNeed}
                onUpdate={handleUpdateDepartmentNeed}
              />
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
    departmentNeeds: (Array.isArray(data?.departmentNeeds) ? data.departmentNeeds : []).map((item) => ({
      ...item,
      category: String(item.category ?? "general").trim() || "general",
      done: Boolean(item.done),
      id: String(item.id ?? crypto.randomUUID()),
      name: String(item.name ?? "").trim(),
      note: String(item.note ?? "").trim(),
      priority: String(item.priority ?? "media").trim() || "media",
    })),
    productStores: (Array.isArray(data?.productStores) ? data.productStores : []).map((store) => ({
      ...store,
      id: String(store.id ?? crypto.randomUUID()),
      name: String(store.name ?? "").trim(),
      products: (Array.isArray(store.products) ? store.products : []).map((product) => ({
        ...product,
        category: String(product.category ?? "general").trim() || "general",
        checked: Boolean(product.checked),
        id: String(product.id ?? crypto.randomUUID()),
        needed: Boolean(product.needed),
        name: String(product.name ?? "").trim(),
        note: String(product.note ?? "").trim(),
        quantity: String(product.quantity ?? "").trim(),
        unit: String(product.unit ?? "unidad").trim() || "unidad",
      })),
    })),
  };
}

function ShoppingMode({ items, onToggle }) {
  const groupedItems = CATEGORY_OPTIONS.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length);

  return (
    <section className="notes-shopping-panel" aria-label="Modo compra">
      <div className="notes-section-heading">
        <div>
          <p>Modo compra</p>
          <h3>Pendientes para comprar</h3>
        </div>
        <ClipboardList size={22} />
      </div>

      {items.length ? (
        <div className="notes-shopping-groups">
          {groupedItems.map((group) => (
            <div className="notes-shopping-group" key={group.category}>
              <h4>{formatLabel(group.category)}</h4>
              {group.items.map((item) => (
                <button
                  className="notes-shopping-item"
                  key={`${item.storeId}-${item.id}`}
                  onClick={() => onToggle(item.storeId, item.id, true)}
                  type="button"
                >
                  <Circle size={16} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.storeName}
                      {item.quantity ? ` · ${item.quantity} ${item.unit}` : ""}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="notes-mini-empty notes-shopping-empty">
          <Check size={22} />
          <p>No tenes compras pendientes.</p>
        </div>
      )}
    </section>
  );
}

function DepartmentNeedsSection({ items, onAdd, onRemove, onUpdate }) {
  return (
    <section className="notes-department-panel" aria-label="Pendientes del departamento">
      <div className="notes-section-heading">
        <div>
          <p>Departamento</p>
          <h3>Mejoras pendientes para casa</h3>
        </div>
        <Home size={22} />
      </div>
      <DepartmentNeedForm onSubmit={onAdd} />
      <DepartmentNeedList items={items} onRemove={onRemove} onUpdate={onUpdate} />
    </section>
  );
}

function DepartmentNeedForm({ onSubmit }) {
  const [category, setCategory] = useState("general");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState("media");

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    onSubmit({
      category,
      name: name.trim(),
      note: note.trim(),
      priority,
    });
    setCategory("general");
    setName("");
    setNote("");
    setPriority("media");
  }

  return (
    <form className="notes-department-form" onSubmit={handleSubmit}>
      <label>
        Necesito
        <input
          autoComplete="off"
          placeholder="Ej: cortinas blackout"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        Categoria
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {DEPARTMENT_CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatLabel(option)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prioridad
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatLabel(option)}
            </option>
          ))}
        </select>
      </label>
      <label className="notes-department-note-field">
        Nota
        <input
          autoComplete="off"
          placeholder="Opcional"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <button type="submit">
        <Plus size={18} />
        Agregar
      </button>
    </form>
  );
}

function DepartmentNeedList({ items, onRemove, onUpdate }) {
  if (!items.length) {
    return (
      <div className="notes-mini-empty">
        <Home size={24} />
        <p>No cargaste pendientes para el departamento.</p>
      </div>
    );
  }

  return (
    <div className="notes-department-list">
      {items.map((item) => (
        <div className={`notes-department-item ${item.done ? "done" : ""}`} key={item.id}>
          <button
            className={`notes-product-check ${item.done ? "checked" : ""}`}
            onClick={() => onUpdate(item.id, { done: !item.done })}
            type="button"
          >
            {item.done ? <Check size={14} /> : <Circle size={14} />}
          </button>
          <div>
            <strong>{item.name}</strong>
            <span>
              {formatLabel(item.category)} · prioridad {formatLabel(item.priority)}
            </span>
            {item.note ? <small>{item.note}</small> : null}
          </div>
          <button className="danger notes-department-delete" onClick={() => onRemove(item.id)} type="button">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
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
      <div>
        <p>Local seleccionado</p>
        <h2>{store.name}</h2>
      </div>

      <div className="notes-row-actions">
        <button onClick={() => setIsEditing(true)} title="Editar local" type="button">
          <Pencil size={16} />
        </button>
        <button className="danger" onClick={onRemove} title="Eliminar local" type="button">
          <Trash2 size={16} />
        </button>
      </div>

      {isEditing ? (
        <div className="confirm-backdrop" role="presentation">
          <section
            aria-labelledby="store-edit-title"
            aria-modal="true"
            className="confirm-modal record-edit-modal"
            role="dialog"
          >
            <h2 id="store-edit-title">Editar local</h2>
            <form
              className="record-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveName();
              }}
            >
              <label>
                Nombre del local
                <input
                  autoComplete="off"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </label>
              <div className="confirm-actions">
                <button
                  className="confirm-button confirm-button-secondary"
                  onClick={() => {
                    setDraftName(store.name);
                    setIsEditing(false);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button className="confirm-button confirm-button-primary" disabled={!draftName.trim()} type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ProductForm({ onSubmit }) {
  const [category, setCategory] = useState("general");
  const [needed, setNeeded] = useState(false);
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
      category,
      name: name.trim(),
      needed,
      note: note.trim(),
      quantity: quantity.trim(),
      unit,
    });
    setCategory("general");
    setName("");
    setNeeded(false);
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
      <label>
        Categoria
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatLabel(option)}
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
      <label className={`notes-check-field ${needed ? "active" : ""}`}>
        <input checked={needed} type="checkbox" onChange={(event) => setNeeded(event.target.checked)} />
        Agregar a compra
      </label>
      <button type="submit">
        <PackagePlus size={18} />
        Agregar
      </button>
    </form>
  );
}

function ProductList({ onDuplicate, onRemove, onUpdate, products, selectedStoreId, stores }) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState({
    category: "general",
    name: "",
    needed: false,
    note: "",
    quantity: "",
    unit: "unidad",
  });
  const [copyTargetByProduct, setCopyTargetByProduct] = useState({});
  const editingProduct = products.find((product) => product.id === editingId);

  function closeEditModal() {
    setEditingId("");
    setDraft({ category: "general", name: "", needed: false, note: "", quantity: "", unit: "unidad" });
  }

  function startEdit(product) {
    setEditingId(product.id);
    setDraft({
      category: product.category ?? "general",
      name: product.name,
      needed: Boolean(product.needed),
      note: product.note ?? "",
      quantity: product.quantity ?? "",
      unit: product.unit ?? "unidad",
    });
  }

  function saveEdit() {
    if (!editingProduct || !draft.name.trim()) {
      return;
    }

    onUpdate(editingProduct.id, {
      category: draft.category,
      name: draft.name.trim(),
      needed: draft.needed,
      note: draft.note.trim(),
      quantity: draft.quantity.trim(),
      unit: draft.unit,
    });
    closeEditModal();
  }

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
      {products.map((product) => (
          <div className="notes-product-row" key={product.id}>
            <div className="notes-product-copy">
                <div className="notes-product-title-line">
                  <button
                    aria-label={product.checked ? `Desmarcar ${product.name}` : `Marcar ${product.name} comprado`}
                    className={`notes-product-check ${product.checked ? "checked" : ""}`}
                    onClick={() => onUpdate(product.id, { checked: !product.checked })}
                    type="button"
                  >
                    {product.checked ? <Check size={14} /> : <Circle size={14} />}
                  </button>
                  <strong>{product.name}</strong>
                </div>
                <span>
                  {product.quantity ? `${product.quantity} ${product.unit}` : product.unit}
                  {product.note ? <small>{product.note}</small> : null}
                </span>
                <div className="notes-product-tags">
                  <small>{formatLabel(product.category)}</small>
                  {product.needed ? <small className="shopping">En compra</small> : null}
                  {product.checked ? <small className="done">Comprado</small> : null}
                </div>
                {stores.length > 1 ? (
                  <div className="notes-copy-control">
                    <select
                      aria-label={`Copiar ${product.name} a otro local`}
                      value={copyTargetByProduct[product.id] ?? ""}
                      onChange={(event) =>
                        setCopyTargetByProduct((current) => ({ ...current, [product.id]: event.target.value }))
                      }
                    >
                      <option value="">Copiar a...</option>
                      {stores
                        .filter((store) => store.id !== selectedStoreId)
                        .map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                    </select>
                    <button
                      disabled={!copyTargetByProduct[product.id]}
                      onClick={() => {
                        onDuplicate(product.id, copyTargetByProduct[product.id]);
                        setCopyTargetByProduct((current) => ({ ...current, [product.id]: "" }));
                      }}
                      title="Duplicar producto"
                      type="button"
                    >
                      <CopyPlus size={15} />
                    </button>
                  </div>
                ) : null}
              </div>

            <div className="notes-row-actions">
              <button onClick={() => startEdit(product)} title="Editar producto" type="button">
                <Pencil size={16} />
              </button>
              <button className="danger" onClick={() => onRemove(product.id)} title="Eliminar producto" type="button">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

      {editingProduct ? (
        <div className="confirm-backdrop" role="presentation">
          <section
            aria-labelledby="product-edit-title"
            aria-modal="true"
            className="confirm-modal record-edit-modal"
            role="dialog"
          >
            <h2 id="product-edit-title">Editar producto</h2>
            <form
              className="record-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveEdit();
              }}
            >
              <label>
                Producto
                <input
                  autoComplete="off"
                  value={draft.name}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
                />
              </label>
              <label>
                Cantidad
                <input
                  autoComplete="off"
                  inputMode="decimal"
                  value={draft.quantity}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({ ...currentDraft, quantity: event.target.value }))
                  }
                />
              </label>
              <label>
                Unidad o peso
                <select
                  value={draft.unit}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, unit: event.target.value }))}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Categoria
                <select
                  value={draft.category}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, category: event.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nota
                <input
                  autoComplete="off"
                  value={draft.note}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, note: event.target.value }))}
                />
              </label>
              <label className={`notes-check-field ${draft.needed ? "active" : ""}`}>
                <input
                  checked={draft.needed}
                  type="checkbox"
                  onChange={(event) =>
                    setDraft((currentDraft) => ({ ...currentDraft, needed: event.target.checked }))
                  }
                />
                En compra
              </label>
              <div className="confirm-actions">
                <button className="confirm-button confirm-button-secondary" onClick={closeEditModal} type="button">
                  Cancelar
                </button>
                <button className="confirm-button confirm-button-primary" disabled={!draft.name.trim()} type="submit">
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function formatLabel(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
