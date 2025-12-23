import { useEffect, useState } from "react";
import { api, type Item } from "./api";

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadItems = async () => {
    try {
      const res = await api.get<Item[]>("/api/items");
      setItems(res.data);
    } catch {
      setError("Failed to load items");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/api/items", {
        name,
        category,
        status: "active",
      });
      setName("");
      setCategory("");
      loadItems();
    } catch {
      setError("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Inventory Tracker</h1>

      <form onSubmit={addItem}>
        <input
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <button disabled={loading}>
          {loading ? "Adding..." : "Add Item"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} — {item.category}
          </li>
        ))}
      </ul>
    </div>
  );
}



export default App;
