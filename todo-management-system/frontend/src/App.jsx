import { useEffect, useState } from "react";

const API_URL = "";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchTasks = async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) return;

    try {
      const response = await fetch(`${API_URL}/api/todos`, {
        headers: {
          Authorization: `Bearer ${currentToken}`, 
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      setMessage("Unable to load tasks");
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const endpoint = isLogin
      ? "/api/auth/login"
      : "/api/auth/register";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || data.msg || "Something went wrong");
        return;
      }

      if (isLogin) {
        localStorage.setItem("token", data.access_token);
        setToken(data.access_token);
        setMessage("");
      } else {
        setMessage("Registration successful. Please login.");
        setIsLogin(true);
      }

      setPassword("");
    } catch (error) {
      setMessage("Unable to connect to backend");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage("Task title is required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to add task");
        return;
      }

      setTasks([...tasks, data.todo]);
      setTitle("");
      setDescription("");
      setMessage("");
    } catch (error) {
      setMessage("Unable to connect to backend");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const response = await fetch(`${API_URL}/api/todos/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      if (response.ok) {
        setTasks(
          tasks.map((item) =>
            item.id === task.id
              ? { ...item, completed: !item.completed }
              : item
          )
        );
      }
    } catch (error) {
      setMessage("Unable to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`${API_URL}/api/todos/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== taskId));
      }
    } catch (error) {
      setMessage("Unable to delete task");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTasks([]);
    setEmail("");
    setPassword("");
  };

  if (token) {
    return (
      <div className="app">
        <div className="dashboard">
          <div className="dashboard-header">
            <div>
              <h1>My Tasks</h1>
              <p>Personal Task Manager</p>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <form className="task-form" onSubmit={handleAddTask}>
            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button type="submit">Add Task</button>
          </form>

          {message && <p className="message">{message}</p>}

          <div className="task-list">
            <h2>Your Tasks</h2>

            {tasks.length === 0 ? (
              <p className="empty-message">No tasks yet. Add your first task.</p>
            ) : (
              tasks.map((task) => (
                <div className="task-card" key={task.id}>
                  <div className="task-content">
                    <h3 className={task.completed ? "completed" : ""}>
                      {task.title}
                    </h3>
                    {task.description && <p>{task.description}</p>}
                  </div>
                  <div className="task-actions">
                    <button onClick={() => handleToggleTask(task)}>
                      {task.completed ? "Undo" : "Complete"}
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="auth-card">
        <h1>My Tasks</h1>
        <p className="subtitle">Personal Task Manager</p>

        <h2>{isLogin ? "Login" : "Register"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <button
          className="switch-button"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage("");
          }}
        >
          {isLogin
            ? "Create a new account"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

export default App;
