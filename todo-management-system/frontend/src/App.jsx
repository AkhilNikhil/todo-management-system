
import { useEffect, useState } from "react";

const API_URL = "https://todo-backend-3-0-1.onrender.com";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [adminTasks, setAdminTasks] = useState([]);
  const [isLoadingAdminTasks, setIsLoadingAdminTasks] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [assignPriority, setAssignPriority] = useState("Medium");
  const [isAssigningTask, setIsAssigningTask] = useState(false);
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
  // FETCH ADMIN USERS
  // --------------------------------------------------

  const fetchAdminUsers = async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken || role !== "admin") return;

    setIsLoadingAdminUsers(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAdminUsers(data.users || []);
        setMessage("");
      } else if (response.status === 401) {
        handleLogout();
      } else if (response.status === 403) {
        setMessage("Admin access required");
      } else {
        setMessage(data.message || "Unable to load users");
      }
    } catch (error) {
      setMessage("Unable to load users");
    } finally {
      setIsLoadingAdminUsers(false);
    }
  };

  // --------------------------------------------------
  // FETCH ALL ADMIN TASKS
  // --------------------------------------------------

  const fetchAdminTasks = async () => {
    const currentToken = localStorage.getItem("token");

    if (!currentToken || role !== "admin") return;

    setIsLoadingAdminTasks(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/tasks`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAdminTasks(data.tasks || []);
        setMessage("");
      } else if (response.status === 401) {
        handleLogout();
      } else if (response.status === 403) {
        setMessage("Admin access required");
      } else {
        setMessage(data.message || "Unable to load all tasks");
      }
    } catch (error) {
      setMessage("Unable to load all tasks");
    } finally {
      setIsLoadingAdminTasks(false);
    }
  };

  // --------------------------------------------------
  // ASSIGN TASK TO USER
  // --------------------------------------------------

  const handleAssignTask = async (e) => {
    e.preventDefault();

    if (!assignUserId) {
      setMessage("Please select a user");
      return;
    }

    if (!assignTitle.trim()) {
      setMessage("Task title is required");
      return;
    }

    setIsAssigningTask(true);
    setMessage("");

    try {
      const currentToken = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/admin/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          user_id: Number(assignUserId),
          title: assignTitle,
          description: assignDescription,
          priority: assignPriority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }

        setMessage(data.message || "Unable to assign task");
        return;
      }

      const assignedUser = adminUsers.find(
        (user) => user.id === Number(assignUserId)
      );

      setMessage(
        `Task assigned successfully to ${assignedUser?.email || "user"}`
      );

      setAssignUserId("");
      setAssignTitle("");
      setAssignDescription("");
      setAssignPriority("Medium");
      setShowAssignTask(false);
    } catch (error) {
      setMessage("Unable to connect to backend");
      setBackendStatus("offline");
    } finally {
      setIsAssigningTask(false);
    }
  };

  // --------------------------------------------------
  // INITIAL BACKEND CHECK
  // --------------------------------------------------

  // --------------------------------------------------
  // FETCH USERS WHEN ADMIN DASHBOARD OPENS
  // --------------------------------------------------

  useEffect(() => {
    if (showAdmin && role === "admin") {
      fetchAdminUsers();
      fetchAdminTasks();
    }
  }, [showAdmin, role]);

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

        localStorage.setItem("email", email);
        localStorage.setItem("role", data.role);
        setRole(data.role);

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
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setToken(null);
    setRole(null);
    setShowAdmin(false);
    setShowUsers(false);
    setShowAllTasks(false);
    setAdminTasks([]);
    setTasks([]);
    setEmail("");
    setPassword("");
    setTitle("");
    setDescription("");
    setAssignUserId("");
    setAssignTitle("");
    setAssignDescription("");
    setAssignPriority("Medium");
    setShowAssignTask(false);
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
  // USER MANAGEMENT
  // --------------------------------------------------

  if (showUsers && role === "admin") {
    return (
      <div className="app dashboard-page">
        <div className="dashboard">
          <header className="dashboard-header">
            <div>
              <div className="brand-small">
                <div className="brand-icon small">✓</div>
                <span>My Tasks</span>
              </div>

              <h1>User Management</h1>

              <p>
                View registered users and their account roles.
              </p>

              <p className="logged-in-email">
                Logged in as: <strong>{email}</strong>
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

          <section className="task-list">
            <div className="task-list-header">
              <div>
                <h2>Registered Users</h2>
                <p>
                  {isLoadingAdminUsers
                    ? "Loading users..."
                    : `${adminUsers.length} users registered`}
                </p>
              </div>

              <div className="task-count">
                {adminUsers.length} total
              </div>
            </div>

            {isLoadingAdminUsers ? (
              <div className="empty-state">
                <div className="loading-spinner"></div>
                <h3>Loading users...</h3>
                <p>Fetching user information from the database.</p>
              </div>
            ) : adminUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No users found</h3>
                <p>No registered users are available.</p>
              </div>
            ) : (
              <div className="task-items">
                {adminUsers.map((user) => (
                  <div className="task-card" key={user.id}>
                    <div className="task-check">
                      <div className="check-button checked">👤</div>
                    </div>

                    <div className="task-content">
                      <h3>{user.email}</h3>
                      <p>User ID: {user.id}</p>

                      <span
                        className={`task-status ${
                          user.role === "admin" ? "done" : "active"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>

                    <div className="task-actions">
                      <span>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {message && (
            <p className="message task-message">
              {message}
            </p>
          )}

          <div style={{ marginTop: "24px" }}>
            <button
              className="switch-button"
              type="button"
              onClick={() => {
                setMessage("");
                setShowUsers(false);
              }}
            >
              ← Back to Admin Dashboard
            </button>
          </div>

          <footer className="dashboard-footer">
            <p>
              My Tasks · User Management
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ALL TASKS
  // --------------------------------------------------

  if (showAllTasks && role === "admin") {
    return (
      <div className="app dashboard-page">
        <div className="dashboard">
          <header className="dashboard-header">
            <div>
              <div className="brand-small">
                <div className="brand-icon small">✓</div>
                <span>My Tasks</span>
              </div>

              <h1>All Tasks</h1>

              <p>
                View every task across all registered users.
              </p>

              <p className="logged-in-email">
                Logged in as: <strong>{email}</strong>
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

          <section className="task-list">
            <div className="task-list-header">
              <div>
                <h2>All Tasks</h2>
                <p>
                  {isLoadingAdminTasks
                    ? "Loading tasks..."
                    : `${adminTasks.length} tasks across all users`}
                </p>
              </div>

              <div className="task-count">
                {adminTasks.length} total
              </div>
            </div>

            {isLoadingAdminTasks ? (
              <div className="empty-state">
                <div className="loading-spinner"></div>
                <h3>Loading all tasks...</h3>
                <p>Fetching task information from the database.</p>
              </div>
            ) : adminTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h3>No tasks found</h3>
                <p>No tasks have been created yet.</p>
              </div>
            ) : (
              <div className="task-items">
                {adminTasks.map((task) => (
                  <div
                    className={`task-card ${
                      task.completed ? "task-completed" : ""
                    }`}
                    key={task.id}
                  >
                    <div className="task-check">
                      <div
                        className={`check-button ${
                          task.completed ? "checked" : ""
                        }`}
                      >
                        {task.completed ? "✓" : ""}
                      </div>
                    </div>

                    <div className="task-content">
                      <h3>{task.title}</h3>

                      {task.description && (
                        <p>{task.description}</p>
                      )}

                      <span className="task-status active">
                        Belongs to: {task.user_email || "Unknown user"}
                      </span>

                      <span
                        className={`task-status ${
                          task.completed ? "done" : "active"
                        }`}
                      >
                        {task.completed ? "Completed" : "Active"}
                      </span>

                      <span className="task-status active">
                        Priority: {task.priority || "Medium"}
                      </span>

                      <span className="task-status active">
                        {task.assigned_by_email
                          ? `Assigned by: ${task.assigned_by_email}`
                          : "Created by: Self"}
                      </span>
                    </div>

                    <div className="task-actions">
                      <span>
                        {task.created_at
                          ? new Date(task.created_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {message && (
            <p className="message task-message">
              {message}
            </p>
          )}

          <div style={{ marginTop: "24px" }}>
            <button
              className="switch-button"
              type="button"
              onClick={() => {
                setMessage("");
                setShowAllTasks(false);
              }}
            >
              ← Back to Admin Dashboard
            </button>
          </div>

          <footer className="dashboard-footer">
            <p>
              My Tasks · All Tasks
            </p>
          </footer>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ADMIN DASHBOARD
  // --------------------------------------------------

  if (showAdmin && role === "admin") {
    return (
      <div className="app dashboard-page">
        <div className="dashboard">
          <header className="dashboard-header">
            <div>
              <div className="brand-small">
                <div className="brand-icon small">✓</div>
                <span>My Tasks</span>
              </div>

              <h1>Admin Dashboard</h1>

              <p>
                Manage users, tasks, and administration from one place.
              </p>

              <p className="logged-in-email">
                Logged in as: <strong>{email}</strong>
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

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">👥</div>
              <div>
                <span>Total Users</span>
                <strong>
                  {isLoadingAdminUsers ? "..." : adminUsers.length}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon active">✓</div>
              <div>
                <span>Total Tasks</span>
                <strong>
                  {isLoadingAdminTasks ? "..." : adminTasks.length}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon done">⚙</div>
              <div>
                <span>Admin Role</span>
                <strong>Active</strong>
              </div>
            </div>
          </section>

          <section className="task-form-card">
            <div className="section-heading">
              <div>
                <h2>Administration</h2>
                <p>
                  Manage users and assign tasks with priority.
                </p>
              </div>
            </div>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "20px"
            }}>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setMessage("");
                  setShowUsers(true);
                }}
              >
                Manage Users
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setMessage("");
                  setShowAssignTask(!showAssignTask);
                }}
              >
                {showAssignTask ? "Close Assignment" : "Assign Task"}
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setMessage("");
                  setShowAllTasks(true);
                }}
              >
                All Tasks
              </button>
            </div>

            {showAssignTask && (
              <form
                className="task-form"
                onSubmit={handleAssignTask}
                style={{ marginTop: "24px" }}
              >
                <div className="input-group">
                  <label htmlFor="assign-user">
                    Assign to user
                  </label>
                  <select
                    id="assign-user"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    required
                  >
                    <option value="">Select a user</option>
                    {adminUsers
                      .filter((user) => user.role !== "admin")
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email} (ID: {user.id})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="assign-title">
                    Task title
                  </label>
                  <input
                    id="assign-title"
                    type="text"
                    placeholder="Enter task title"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="assign-description">
                    Description
                  </label>
                  <textarea
                    id="assign-description"
                    placeholder="Add task details..."
                    value={assignDescription}
                    onChange={(e) => setAssignDescription(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="assign-priority">
                    Priority
                  </label>
                  <select
                    id="assign-priority"
                    value={assignPriority}
                    onChange={(e) => setAssignPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <button
                  className="primary-button add-button"
                  type="submit"
                  disabled={isAssigningTask}
                >
                  {isAssigningTask ? "Assigning..." : "Assign Task"}
                </button>
              </form>
            )}

            {message && (
              <p className="message task-message">
                {message}
              </p>
            )}
          </section>

          <section className="task-list">
            <div className="task-list-header">
              <div>
                <h2>Admin Controls</h2>
                <p>
                  More administrative features will be added step-by-step.
                </p>
              </div>
            </div>

            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <h3>Admin access confirmed</h3>
              <p>
                Your account has administrator permissions.
              </p>
            </div>
          </section>

          <div style={{ marginTop: "24px" }}>
            <button
              className="switch-button"
              type="button"
              onClick={() => {
                setMessage("");
                setShowAdmin(false);
              }}
            >
              ← Back to My Tasks
            </button>
          </div>

          <footer className="dashboard-footer">
            <p>
              My Tasks · Admin Dashboard
            </p>
          </footer>
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

            <p className="logged-in-email">
              Logged in as: <strong>{email}</strong>
            </p>
          </div>

          <div className="header-actions">
            {role === "admin" && (
              <button
                type="button"
                className="admin-button"
                onClick={() => {
                  setMessage("");
                  setShowAdmin(true);
                }}
              >
                Admin
              </button>
            )}

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

                    {task.priority && (
                      <span className="task-status active">
                        Priority: {task.priority}
                      </span>
                    )}

                    {task.assigned_by_email && (
                      <span className="task-status active">
                        Assigned by: {task.assigned_by_email}
                      </span>
                    )}
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

