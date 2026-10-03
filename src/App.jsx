import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL || ""}/api/todos`;

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const request = async (url, options) => {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error((await res.json()).message || "Request failed");
    return res.json();
  };

  useEffect(() => {
    request(API)
      .then(setTodos)
      .catch(() => setError("Can't reach the server. Check that it's running and MONGO_URI is set."))
      .finally(() => setLoading(false));
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const todo = await request(API, { method: "POST", body: JSON.stringify({ title }) });
      setTodos([todo, ...todos]);
      setTitle("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTodo = async (id, changes) => {
    try {
      const updated = await request(`${API}/${id}`, { method: "PATCH", body: JSON.stringify(changes) });
      setTodos(todos.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await request(`${API}/${id}`, { method: "DELETE" });
      setTodos(todos.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEdit = async (id) => {
    if (editText.trim()) await updateTodo(id, { title: editText });
    setEditing(null);
  };

  const remaining = todos.filter((t) => !t.done).length;
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );

  return (
    <main className="app">
      <header>
        <h1>Today</h1>
        <p className="count">
          {remaining === 0 ? "Nothing left to do" : `${remaining} task${remaining > 1 ? "s" : ""} left`}
        </p>
      </header>

      <form onSubmit={addTodo} className="add">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          aria-label="New task"
          maxLength={200}
        />
        <button type="submit">Add task</button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <nav className="filters" aria-label="Filter tasks">
        {["all", "active", "done"].map((f) => (
          <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="empty">Loading tasks…</p>
      ) : visible.length === 0 ? (
        <p className="empty">No tasks here. Add one above.</p>
      ) : (
        <ul>
          {visible.map((t) => (
            <li key={t._id} className={t.done ? "done" : ""}>
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => updateTodo(t._id, { done: !t.done })}
                aria-label={`Mark "${t.title}" as ${t.done ? "active" : "done"}`}
              />
              {editing === t._id ? (
                <input
                  className="edit"
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => saveEdit(t._id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(t._id);
                    if (e.key === "Escape") setEditing(null);
                  }}
                />
              ) : (
                <span onDoubleClick={() => { setEditing(t._id); setEditText(t.title); }}>
                  {t.title}
                </span>
              )}
              <button className="link" onClick={() => { setEditing(t._id); setEditText(t.title); }}>Edit</button>
              <button className="link danger" onClick={() => deleteTodo(t._id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
