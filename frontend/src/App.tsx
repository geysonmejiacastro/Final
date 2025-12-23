import { useEffect, useMemo, useState } from "react";
import { api, type Item } from "./api";

type Status = "idle" | "loading" | "saving";

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  // Create form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  // Search (server-side, debounced)
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // UI info
  const isLoading = status === "loading";
  const isSaving = status === "saving";

  // Debounce: wait 350ms after typing stops
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

  // Initial load
  useEffect(() => {
    fetchItems("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when debounced search changes
  useEffect(() => {
    fetchItems(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Count label (purely UI)
  const countLabel = useMemo(() => {
    if (isLoading) return "Loading...";
    return `${items.length} item(s)`;
  }, [items.length, isLoading]);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();

    // keep validation for later commit (we’ll improve it in commit 4)
    if (!trimmedName || !trimmedCategory) {
      setError("Name and category are required.");
      return;
    }

    setStatus("saving");
    try {
      await api.post("/api/items", { name: trimmedName, category: trimmedCategory });
      setName("");
      setCategory("");
      await fetchItems(debouncedSearch);
    } catch {
      setError("Failed to add item.");
    } finally {
      setStatus("idle");
    }
  };

  const deleteItem = async (id: number) => {
    setError("");

    // optimistic UI + rollback
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      await api.delete(`/api/items/${id}`);
    } catch {
      setItems(snapshot);
      setError("Failed to delete item.");
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1 className="title">Inventory Tracker</h1>
          <p className="subtitle">Server-side search (debounced) + CRUD</p>
        </div>
        <div className="badge">{countLabel}</div>
      </header>

      <section className="card">
        <h2 className="sectionTitle">Add item</h2>
        <form onSubmit={addItem} className="form">
          <input
            className="input"
            placeholder="Item name (e.g., Lenovo L14)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSaving}
          />
          <input
            className="input"
            placeholder="Category (e.g., Laptop)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSaving}
          />
          <button className="button" disabled={isSaving}>
            {isSaving ? "Saving..." : "Add"}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="row">
          <h2 className="sectionTitle">Items</h2>

          <input
            className="input"
            placeholder="Search by name (server-side)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isSaving}
          />
        </div>

        {error && <div className="errorBox">{error}</div>}

        {isLoading && <div className="muted">Loading...</div>}

        {!isLoading && items.length === 0 && (
          <div className="muted">No items found.</div>
        )}

        <ul className="list">
          {items.map((item) => (
            <li key={item.id} className="listItem">
              <div>
                <div className="itemName">{item.name}</div>
                <div className="muted">
                  {item.category} • {item.status}
                </div>
              </div>

              <button className="button danger" onClick={() => deleteItem(item.id)} disabled={isSaving}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

