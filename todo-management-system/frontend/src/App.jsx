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

  const [backendStatus, setBackendStatus] = useState("checking");
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --------------------------------------------------
  // BACKEND HEALTH CHECK
  // --------------------------------------------------

  const checkBackend = async (retryCount = 0) => {
    setBackendStatus("checking");

    try {
      const response = await fetch(`${API_URL}/api/health`, {
        method: "GET",
      });

      if (response.ok) {
        setBackendStatus("connected");
        return true;
      }

      throw new Error("Backend unavailable");
    } catch (error) {
      if (retryCount < 2) {
        setBackendStatus("retrying");

        await new Promise((resolve) =>
          setTimeout(resolve, 2500)
        );

        return checkBackend(retryCount + 1);
      }

      setBackendStatus("offline");
      return false;
    }
  };

  // --------------------------------------------------
  // FETCH TASKS
  // --------------------------------------------------

  const fetchTasks = async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken) return;

    setIsLoadingTasks(true);

    try {
      const response = await fetch(`${API_URL}/api/todos`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        setMessage("");
      } else if (response.status === 401) {
        handleLogout();
      } else {
        setMessage("Unable to load tasks");
      }
    } catch (error) {
      setMessage("Unable to connect to backend");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // --------------------------------------------------
  // INITIAL BACKEND CHECK
  // --------------------------------------------------

  useEffect(() => {
    checkBackend();
  }, []);

  // --------------------------------------------------
  // FETCH TASKS AFTER LOGIN
  // --------------------------------------------------

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  // --------------------------------------------------
  // LOGIN / REGISTER
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const endpoint = isLogin
      ? "/api/auth/login"
      : "/api/auth/register";

    try {
      const backendReady = await checkBackend();

      if (!backendReady) {
        setMessage(
          "Backend is waking up. Please try again in a few seconds."
        );
        return;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message ||
            data.msg ||
            "Something went wrong"
        );
        return;
      }

      if (isLogin) {
        localStorage.setItem(
          "token",
          data.access_token
        );

        setToken(data.access_token);
        setMessage("");
      } else {
        setMessage(
          "Registration successful. Please login."
        );
        setIsLogin(true);
      }

      setPassword("");
    } catch (error) {
      setMessage("Unable to connect to backend");
      setBackendStatus("offline");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------
  // ADD TASK
  // --------------------------------------------------

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage("Task title is required");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/todos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to add task"
        );
        return;
      }

      setTasks((currentTasks) => [
        ...currentTasks,
        data.todo,
      ]);

      setTitle("");
      setDescription("");
      setMessage("");
    } catch (error) {
      setMessage("Unable to connect to backend");
      setBackendStatus("offline");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------
  // TOGGLE TASK
  // --------------------------------------------------

  const handleToggleTask = async (task) => {
    try {
      const response = await fetch(
        `${API_URL}/api/todos/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed: !task.completed,
          }),
        }
      );

      if (response.ok) {
        setTasks((currentTasks) =>
          currentTasks.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  completed: !item.completed,
                }
              : item
          )
        );
      } else if (response.status === 401) {
        handleLogout();
      } else {
        setMessage("Unable to update task");
      }
    } catch (error) {
      setMessage("Unable to update task");
      setBackendStatus("offline");
    }
  };

  // --------------------------------------------------
  // DELETE TASK
  // --------------------------------------------------

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/todos/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setTasks((currentTasks) =>
          currentTasks.filter(
            (task) => task.id !== taskId
          )
        );
      } else if (response.status === 401) {
        handleLogout();
      } else {
        setMessage("Unable to delete task");
      }
    } catch (error) {
      setMessage("Unable to delete task");
      setBackendStatus("offline");
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setTasks([]);
    setEmail("");
    setPassword("");
    setTitle("");
    setDescription("");
    setMessage("");
  };

  // --------------------------------------------------
  // TASK STATISTICS
  // --------------------------------------------------

  const totalTasks = tasks.length;

  const activeTasks = tasks.filter(
    (task) => !task.completed
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  // --------------------------------------------------
  // CONNECTION STATUS
  // --------------------------------------------------

  const getStatusText = () => {
    if (backendStatus === "connected") {
      return "Backend connected";
    }

    if (backendStatus === "checking") {
      return "Connecting...";
    }

    if (backendStatus === "retrying") {
      return "Waking backend...";
    }

    return "Backend unavailable";
  };

  // --------------------------------------------------
  // AUTH SCREEN
  // --------------------------------------------------

  if (!token) {
    return (
      <div className="app auth-page">
        <div className="auth-card">
          <div className="brand-section">
            <div className="brand-icon">✓</div>

            <h1>My Tasks</h1>

            <p className="subtitle">
              Personal Task Manager
            </p>
          </div>

          <div className="connection-status">
            <span
              className={`status-dot ${backendStatus}`}
            ></span>

            <span>{getStatusText()}</span>
          </div>

          <div className="auth-heading">
            <h2>
              {isLogin
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p>
              {isLogin
                ? "Login to manage your tasks."
                : "Create an account to get started."}
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="input-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={
                isSubmitting ||
                backendStatus === "checking" ||
                backendStatus === "retrying"
              }
            >
              {isSubmitting
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Create Account"}
            </button>
          </form>

          {message && (
            <p className="message">
              {message}
            </p>
          )}

          <button
            className="switch-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

  return (
    <div className="app dashboard-page">
      <div className="dashboard">

        {/* HEADER */}

        <header className="dashboard-header">
          <div>
            <div className="brand-small">
              <div className="brand-icon small">
                ✓
              </div>

              <span>My Tasks</span>
            </div>

            <h1>Dashboard</h1>

            <p>
              Stay organized and keep your work moving.
            </p>
          </div>

          <div className="header-actions">
            <div className="connection-status header-status">
              <span
                className={`status-dot ${backendStatus}`}
              ></span>

              <span>{getStatusText()}</span>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* STATISTICS */}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              ✓
            </div>

            <div>
              <span>Total Tasks</span>
              <strong>{totalTasks}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon active">
              ○
            </div>

            <div>
              <span>Active</span>
              <strong>{activeTasks}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon done">
              ✓
            </div>

            <div>
              <span>Completed</span>
              <strong>{completedTasks}</strong>
            </div>
          </div>
        </section>

        {/* ADD TASK */}

        <section className="task-form-card">
          <div className="section-heading">
            <div>
              <h2>Add a new task</h2>
              <p>
                Create a task and keep track of your progress.
              </p>
            </div>
          </div>

          <form
            className="task-form"
            onSubmit={handleAddTask}
          >
            <div className="input-group">
              <label htmlFor="task-title">
                Task title
              </label>

              <input
                id="task-title"
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
              />
            </div>

            <div className="input-group">
              <label htmlFor="task-description">
                Description
              </label>

              <textarea
                id="task-description"
                placeholder="Add some details..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />
            </div>

            <button
              className="primary-button add-button"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Adding..."
                : "Add Task"}
            </button>
          </form>

          {message && (
            <p className="message task-message">
              {message}
            </p>
          )}
        </section>

        {/* TASK LIST */}

        <section className="task-list">
          <div className="task-list-header">
            <div>
              <h2>Your Tasks</h2>
              <p>
                {totalTasks === 0
                  ? "No tasks created yet."
                  : `${totalTasks} ${
                      totalTasks === 1
                        ? "task"
                        : "tasks"
                    } in your list`}
              </p>
            </div>

            {totalTasks > 0 && (
              <div className="task-count">
                {completedTasks}/{totalTasks} done
              </div>
            )}
          </div>

          {isLoadingTasks ? (
            <div className="empty-state">
              <div className="loading-spinner"></div>

              <h3>Loading your tasks...</h3>

              <p>
                Connecting to your task database.
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                ✓
              </div>

              <h3>No tasks yet</h3>

              <p>
                Add your first task above and start
                getting organized.
              </p>
            </div>
          ) : (
            <div className="task-items">
              {tasks.map((task) => (
                <div
                  className={`task-card ${
                    task.completed
                      ? "task-completed"
                      : ""
                  }`}
                  key={task.id}
                >
                  <div className="task-check">
                    <button
                      className={`check-button ${
                        task.completed
                          ? "checked"
                          : ""
                      }`}
                      onClick={() =>
                        handleToggleTask(task)
                      }
                      aria-label={
                        task.completed
                          ? "Mark task active"
                          : "Mark task completed"
                      }
                    >
                      {task.completed ? "✓" : ""}
                    </button>
                  </div>

                  <div className="task-content">
                    <h3>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p>
                        {task.description}
                      </p>
                    )}

                    <span
                      className={`task-status ${
                        task.completed
                          ? "done"
                          : "active"
                      }`}
                    >
                      {task.completed
                        ? "Completed"
                        : "Active"}
                    </span>
                  </div>

                  <div className="task-actions">
                    <button
                      className="action-button complete"
                      onClick={() =>
                        handleToggleTask(task)
                      }
                    >
                      {task.completed
                        ? "Undo"
                        : "Complete"}
                    </button>

                    <button
                      className="action-button delete"
                      onClick={() =>
                        handleDeleteTask(task.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <p>
            My Tasks · Personal Task Manager
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
