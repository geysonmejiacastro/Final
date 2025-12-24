import { useEffect, useMemo, useState } from "react";
import { api, Item } from "./api";

type Status = "idle" | "loading" | "saving";

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  // Create form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  // Search (server-side, debounced)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const isLoading = status === "loading";
  const isSaving = status === "saving";

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = async (query: string) => {
    setError("");
    setStatus("loading");
    try {
      const res = await api.get<Item[]>("/api/items", {
        params: query ? { search: query } : {},
      });
      setItems(res.data);
    } catch {
      setError("Unable to connect to server. Is the backend running?");
    } finally {
      setStatus("idle");
    }
  };

  useEffect(() => {
    fetchItems("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchItems(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const countLabel = useMemo(() => {
    if (isLoading) return "Loading…";
    return `${items.length} item(s)`;
  }, [items.length, isLoading]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2 || category.trim().length < 2) {
      setError("Name and category must be at least 2 characters.");
      return;
    }

    setStatus("saving");
    try {
      await api.post("/api/items", {
        name: name.trim(),
        category: category.trim(),
      });
      setName("");
      setCategory("");
      await fetchItems(debouncedSearch);
    } catch {
      setError("Failed to add item.");
    } finally {
      setStatus("idle");
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: number) => {
    setError("");

    if (editName.trim().length < 2) {
      setError("Item name must be at least 2 characters.");
      return;
    }

    setStatus("saving");
    try {
      await api.put(`/api/items/${id}`, { name: editName.trim() });
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, name: editName.trim() } : i
        )
      );
      cancelEdit();
    } catch {
      setError("Failed to update item.");
    } finally {
      setStatus("idle");
    }
  };

  // ✅ Delete confirmation (Commit 1, still present)
  const deleteItem = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmed) return;

    setError("");
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      await api.delete(`/api/items/${id}`);
    } catch {
      setItems(snapshot);
      setError("Delete failed.");
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="cardShell">
          <header className="header">
            <div>
              <h1 className="title">Inventory Tracker</h1>
              <p className="subtitle">
                Responsive UI • CRUD • Server-side search
              </p>
            </div>

            <div className="headerRight">
              <div className="pill">{countLabel}</div>
              <button
                className="button secondary"
                onClick={() => fetchItems(debouncedSearch)}
                disabled={isLoading || isSaving}
                type="button"
              >
                Refresh
              </button>
            </div>
          </header>

          <main className="main">
            {error && <div className="errorBox">{error}</div>}

            <div className="grid2">
              <section className="section">
                <h2 className="sectionTitle">Add item</h2>

                <form onSubmit={addItem} className="form">
                  <div className="formRow">
                    <input
                      className="input"
                      placeholder="Item name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSaving}
                    />
                    <input
                      className="input"
                      placeholder="Category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>

                  <button className="button" disabled={isSaving} type="submit">
                    {isSaving ? "Saving…" : "Add"}
                  </button>
                </form>
              </section>

              <section className="section">
                <h2 className="sectionTitle">Search</h2>
                <input
                  className="input"
                  placeholder="Search items (server-side)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={isSaving || isLoading}
                />
              </section>
            </div>

            <section className="section">
              <h2 className="sectionTitle">Items</h2>

              {/* ✅ COMMIT 3: Improved loading + empty states */}
              {isLoading && (
                <div className="muted">
                  Loading items from server…
                </div>
              )}

              {!isLoading && items.length === 0 && (
                <div className="muted">
                  No items found. Try adding one above or adjusting your search.
                </div>
              )}

              <ul className="list">
                {items.map((item) => (
                  <li key={item.id} className="item">
                    <div className="itemLeft">
                      {editingId === item.id ? (
                        <input
                          className="input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={isSaving}
                        />
                      ) : (
                        <div className="itemName">{item.name}</div>
                      )}

                      <div className="itemMeta">
                        {item.category} • {item.status}
                      </div>
                    </div>

                    <div className="buttonRow">
                      {editingId === item.id ? (
                        <>
                          <button
                            className="button"
                            onClick={() => saveEdit(item.id)}
                            disabled={isSaving}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="button secondary"
                            onClick={cancelEdit}
                            disabled={isSaving}
                            type="button"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="button secondary"
                            onClick={() => startEdit(item)}
                            disabled={isSaving}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="button danger"
                            onClick={() => deleteItem(item.id)}
                            disabled={isSaving}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
