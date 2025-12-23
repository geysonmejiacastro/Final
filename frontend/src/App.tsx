// frontend/src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { api, type Item } from "./api";

type Status = "idle" | "loading" | "saving";

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  // Create form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  // Search
  const [search, setSearch] = useState("");

  // Edit one item at a time
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  async function loadItems() {
    setError("");
    setStatus("loading");
    try {
      const res = await api.get<Item[]>("/api/items");
      setItems(res.data);
    } catch {
      setError("Unable to connect to server. Is the backend running?");
    } finally {
      setStatus("idle");
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();

    if (!trimmedName || !trimmedCategory) {
      setError("Name and category are required.");
      return;
    }

    setStatus("saving");
    try {
      await api.post("/api/items", { name: trimmedName, category: trimmedCategory });
      setName("");
      setCategory("");
      await loadItems();
    } catch {
      setError("Failed to add item. Check backend and database connection.");
    } finally {
      setStatus("idle");
    }
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditName(item.name);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setError("");
  }

  async function saveEdit(id: number) {
    setError("");
    const nextName = editName.trim();

    if (!nextName) {
      setError("Name cannot be empty.");
      return;
    }

    setStatus("saving");
    try {
      // Your backend currently updates name only
      await api.put(`/api/items/${id}`, { name: nextName });

      // Update local state
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: nextName } : i)));

      cancelEdit();
    } catch {
      setError("Update failed. Check backend.");
    } finally {
      setStatus("idle");
    }
  }

  async function deleteItem(id: number) {
    setError("");

    // Optimistic UI + rollback on failure
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      await api.delete(`/api/items/${id}`);
    } catch {
      setItems(snapshot);
      setError("Delete failed. Check backend.");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Inventory Tracker</h1>
          <p style={{ margin: "6px 0 0", opacity: 0.8 }}>
            React + Express + PostgreSQL (CRUD + Search)
          </p>
        </div>

        <button type="button" onClick={loadItems} disabled={status === "loading" || status === "saving"}>
          {status === "loading" ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <section style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Add item</h2>

        <form onSubmit={addItem} style={{ display: "grid", gap: 10 }}>
          <input
            placeholder="Item name (e.g., Lenovo L14)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Category (e.g., Laptop)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Add"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Items</h2>

          <input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
        </div>

        {/* Clean error box (no background image / no overlay) */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              backgroundColor: "#fee2e2",
              color: "#7f1d1d",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 12, opacity: 0.8 }}>
          {status === "loading" ? "Loading..." : `${filtered.length} shown / ${items.length} total`}
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "grid", gap: 10 }}>
          {filtered.map((item) => {
            const isEditing = editingId === item.id;

            return (
              <li
                key={item.id}
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    {!isEditing ? (
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                    ) : (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    )}

                    <div style={{ opacity: 0.8 }}>
                      {item.category} • {item.status}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {!isEditing ? (
                      <>
                        <button type="button" onClick={() => startEdit(item)} disabled={status === "saving"}>
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteItem(item.id)} disabled={status === "saving"}>
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => saveEdit(item.id)} disabled={status === "saving"}>
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={status === "saving"}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {status !== "loading" && filtered.length === 0 && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}>
            No items found.
          </div>
        )}
      </section>
    </div>
  );
}
