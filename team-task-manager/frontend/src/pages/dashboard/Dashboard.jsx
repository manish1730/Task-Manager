import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  addMember,
  createProject,
  createTask,
  deleteProject,
  deleteTask,
  getAllUsers,
  getProjects,
  getTasks,
  removeMember,
  updateProject,
  updateTask,
} from '../../services/api';

const STATUS_OPTIONS = ['All', 'Todo', 'In Progress', 'Done'];

const emptyProjectForm = { name: '' };
const emptyTaskForm = { title: '', project: '', assignedTo: '', status: 'Todo', dueDate: '' };

function formatDate(dateValue) {
  if (!dateValue) return 'No due date';
  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function normalizeDate(dateValue) {
  return dateValue ? new Date(dateValue).toISOString().slice(0, 10) : '';
}

function isTaskOverdue(task) {
  return Boolean(task.dueDate) && new Date(task.dueDate) < new Date() && task.status !== 'Done';
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <p className="eyebrow">Workspace action</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = useCallback(async () => {
    const response = await getProjects();
    setProjects(response.data);
    return response.data;
  }, []);

  const loadTasks = useCallback(async () => {
    const taskParams = {};
    if (statusFilter !== 'All') taskParams.status = statusFilter;
    if (projectFilter !== 'All') taskParams.projectId = projectFilter;

    const response = await getTasks(taskParams);
    setTasks(response.data);
    return response.data;
  }, [projectFilter, statusFilter]);

  const loadWorkspace = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else if (loading) {
      setLoading(true);
    }

    setError('');

    try {
      await Promise.all([loadTasks(), loadProjects()]);

      if (isAdmin) {
        try {
          const usersResponse = await getAllUsers();
          setAllUsers(usersResponse.data);
        } catch (usersError) {
          setAllUsers([]);
          console.error('Failed to load users for admin controls:', usersError.response?.data || usersError.message);
        }
      } else {
        setAllUsers([]);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to load dashboard data.';
      setError(message);

      if (err.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, loadProjects, loadTasks, loading, logout, navigate]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadWorkspace();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadWorkspace]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('Loaded projects:', projects);
    }
  }, [projects]);

  const visibleTasks = useMemo(
    () => tasks.filter((task) => (projectFilter === 'All' ? true : task.project?._id === projectFilter)),
    [projectFilter, tasks],
  );

  const stats = useMemo(() => {
    const overdueTasks = visibleTasks.filter(isTaskOverdue);
    return [
      { label: 'Total Tasks', value: visibleTasks.length, tone: 'primary' },
      { label: 'Todo', value: visibleTasks.filter((task) => task.status === 'Todo').length, tone: 'neutral' },
      { label: 'In Progress', value: visibleTasks.filter((task) => task.status === 'In Progress').length, tone: 'info' },
      { label: 'Done', value: visibleTasks.filter((task) => task.status === 'Done').length, tone: 'success' },
      { label: 'Overdue', value: overdueTasks.length, tone: 'danger' },
    ];
  }, [visibleTasks]);

  const closeModal = () => {
    setModal(null);
    setActiveProject(null);
    setActiveTask(null);
    setProjectForm(emptyProjectForm);
    setTaskForm(emptyTaskForm);
    setSubmitting(false);
    setError('');
    setSuccess('');
  };

  const openProjectModal = (project = null) => {
    setError('');
    setSuccess('');
    setActiveProject(project);
    setProjectForm({ name: project?.name || '' });
    setModal(project ? 'editProject' : 'project');
  };

  const openTaskModal = (task = null) => {
    setError('');
    setSuccess('');

    if (!task && projects.length === 0) {
      setError('No projects available. Create a project first or verify GET /api/projects is returning data.');
      return;
    }

    setActiveTask(task);
    setTaskForm({
      title: task?.title || '',
      project: task?.project?._id || projects[0]?._id || '',
      assignedTo: task?.assignedTo?._id || '',
      status: task?.status || 'Todo',
      dueDate: normalizeDate(task?.dueDate),
    });
    setModal(task ? 'editTask' : 'task');
  };

  const openMembersModal = (project) => {
    setError('');
    setSuccess('');
    setActiveProject(project);
    setModal('members');
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (modal === 'editProject') {
        await updateProject(activeProject._id, { name: projectForm.name.trim() });
        setSuccess('Project updated successfully.');
      } else {
        await createProject({ name: projectForm.name.trim() });
        setSuccess('Project created successfully.');
      }

      await loadWorkspace({ silent: true });
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectDelete = async (projectId) => {
    if (!window.confirm('Delete this project? Existing tasks linked to it may no longer be usable.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteProject(projectId);
      setSuccess('Project deleted successfully.');
      await loadWorkspace({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete project.');
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const payload = {
      title: taskForm.title.trim(),
      project: taskForm.project,
      assignedTo: taskForm.assignedTo || null,
      status: taskForm.status,
      dueDate: taskForm.dueDate || null,
    };

    try {
      if (modal === 'editTask') {
        await updateTask(activeTask._id, payload);
        setSuccess('Task updated successfully.');
      } else {
        await createTask(payload);
        setSuccess('Task created successfully.');
      }

      await loadWorkspace({ silent: true });
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteTask(taskId);
      setSuccess('Task deleted successfully.');
      await loadWorkspace({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete task.');
    }
  };

  const handleQuickStatusChange = async (taskId, nextStatus) => {
    setError('');

    try {
      await updateTask(taskId, { status: nextStatus });
      await loadWorkspace({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update task status.');
    }
  };

  const handleAddMember = async (memberId) => {
    setError('');

    try {
      const { data } = await addMember(activeProject._id, memberId);
      setActiveProject(data);
      setProjects((current) => current.map((project) => (project._id === data._id ? data : project)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add member.');
    }
  };

  const handleRemoveMember = async (memberId) => {
    setError('');

    try {
      const { data } = await removeMember(activeProject._id, memberId);
      setActiveProject(data);
      setProjects((current) => current.map((project) => (project._id === data._id ? data : project)));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove member.');
    }
  };

  const availableMembers = allUsers.filter(
    (member) => !activeProject?.members?.some((existingMember) => existingMember._id === member._id),
  );
  const taskProjectOptions = projects.map((project) => ({
    id: project._id,
    name: project.name,
  }));

  if (loading) {
    return (
      <main className="dashboard-shell">
        <div className="loading-state">
          <div className="loading-state__spinner" />
          <p>Loading your workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-topbar">
        <div>
          <p className="eyebrow">Team Task Manager</p>
          <h1>Delivery dashboard</h1>
          <p className="dashboard-topbar__subtitle">
            Track tasks, manage projects, and keep overdue work visible for the whole team.
          </p>
        </div>

        <div className="dashboard-topbar__actions">
          <div className={`role-pill role-pill--${isAdmin ? 'admin' : 'member'}`}>
            {isAdmin ? 'Admin access' : 'Member access'}
          </div>
          <div className="user-chip">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button className="button button--ghost" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </section>

      {error ? <div className="alert alert--error">{error}</div> : null}
      {success ? <div className="alert alert--success">{success}</div> : null}

      <section className="hero-panel">
        <div className="hero-panel__copy">
          <p className="eyebrow">Workspace summary</p>
          <h2>Plan work clearly, assign ownership fast, and surface delivery risk early.</h2>
          <p>
            Projects are role-aware, tasks can be filtered by status, and overdue items are highlighted directly in the dashboard.
          </p>
        </div>
        <div className="hero-panel__meta">
          <div>
            <span>{projects.length}</span>
            <small>Active projects</small>
          </div>
          <div>
            <span>{visibleTasks.filter((task) => task.assignedTo).length}</span>
            <small>Assigned tasks</small>
          </div>
          <div>
            <span>{refreshing ? '...' : visibleTasks.length}</span>
            <small>Visible tasks</small>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map((item) => (
          <article key={item.label} className={`stat-card stat-card--${item.tone}`}>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Projects</p>
              <h3>Project management</h3>
            </div>
            {isAdmin ? (
              <button className="button button--primary" type="button" onClick={() => openProjectModal()}>
                New project
              </button>
            ) : null}
          </div>

          <div className="project-list">
            {projects.length === 0 ? (
              <div className="empty-state">
                <h4>No projects yet</h4>
                <p>{isAdmin ? 'Create your first project to start assigning tasks.' : 'You will see projects here once an admin adds you.'}</p>
              </div>
            ) : (
              projects.map((project) => (
                <article key={project._id} className="project-card">
                  <div className="project-card__body">
                    <div>
                      <h4>{project.name}</h4>
                      <p>Created by {project.createdBy?.name || 'Unknown'}</p>
                    </div>
                    <span className="project-card__count">
                      {project.members?.length || 0} member{project.members?.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="member-stack">
                    {project.members?.length ? (
                      project.members.map((member) => (
                        <span key={member._id} className="member-badge">
                          {member.name}
                        </span>
                      ))
                    ) : (
                      <span className="member-badge member-badge--muted">No members added</span>
                    )}
                  </div>

                  {isAdmin ? (
                    <div className="card-actions">
                      <button className="button button--ghost" type="button" onClick={() => openMembersModal(project)}>
                        Manage members
                      </button>
                      <button className="button button--ghost" type="button" onClick={() => openProjectModal(project)}>
                        Edit
                      </button>
                      <button className="button button--danger" type="button" onClick={() => handleProjectDelete(project._id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </article>

        <article className="panel panel--wide">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Tasks</p>
              <h3>Task dashboard</h3>
            </div>
            <button
              className="button button--primary"
              type="button"
              onClick={() => openTaskModal()}
              disabled={!projects.length}
            >
              New task
            </button>
          </div>

          <div className="filters">
            <label className="field">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Project</span>
              <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                <option value="All">All projects</option>
                {taskProjectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!projects.length ? (
            <div className="empty-state">
              <h4>No task workspace yet</h4>
              <p>Create a project first so tasks can be linked to it.</p>
            </div>
          ) : null}

          {projects.length && visibleTasks.length === 0 ? (
            <div className="empty-state">
              <h4>No matching tasks</h4>
              <p>Adjust the filters or create a new task to populate the dashboard.</p>
            </div>
          ) : null}

          <div className="task-grid">
            {visibleTasks.map((task) => {
              const overdue = isTaskOverdue(task);
              const availableAssignees = projects.find((project) => project._id === task.project?._id)?.members || [];

              return (
                <article key={task._id} className={`task-card ${overdue ? 'task-card--overdue' : ''}`}>
                  <div className="task-card__header">
                    <div>
                      <div className="task-card__eyebrow">
                        <span className={`status-badge status-badge--${task.status.replace(/\s+/g, '-').toLowerCase()}`}>
                          {task.status}
                        </span>
                        {overdue ? <span className="overdue-badge">Overdue</span> : null}
                      </div>
                      <h4>{task.title}</h4>
                    </div>
                    <button className="icon-button" type="button" onClick={() => openTaskModal(task)} aria-label="Edit task">
                      ⋯
                    </button>
                  </div>

                  <dl className="task-meta">
                    <div>
                      <dt>Project</dt>
                      <dd>{task.project?.name || 'Unknown project'}</dd>
                    </div>
                    <div>
                      <dt>Assigned to</dt>
                      <dd>{task.assignedTo?.name || 'Unassigned'}</dd>
                    </div>
                    <div>
                      <dt>Due date</dt>
                      <dd>{formatDate(task.dueDate)}</dd>
                    </div>
                  </dl>

                  <div className="task-card__footer">
                    <select
                      className="compact-select"
                      value={task.status}
                      onChange={(event) => handleQuickStatusChange(task._id, event.target.value)}
                    >
                      {STATUS_OPTIONS.filter((status) => status !== 'All').map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <div className="card-actions">
                      <button className="button button--ghost" type="button" onClick={() => openTaskModal(task)}>
                        Edit
                      </button>
                      <button className="button button--danger" type="button" onClick={() => handleTaskDelete(task._id)}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {availableAssignees.length ? (
                    <div className="task-members">
                      {availableAssignees.map((member) => (
                        <span key={member._id} className="member-badge member-badge--subtle">
                          {member.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </article>
      </section>

      {modal === 'project' || modal === 'editProject' ? (
        <Modal title={modal === 'editProject' ? 'Edit project' : 'Create project'} onClose={closeModal}>
          <form className="modal-form" onSubmit={handleProjectSubmit}>
            <label className="field">
              <span>Project name</span>
              <input
                type="text"
                value={projectForm.name}
                onChange={(event) => setProjectForm({ name: event.target.value })}
                placeholder="Website Redesign"
                required
              />
            </label>

            {error ? <div className="alert alert--error">{error}</div> : null}

            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={closeModal}>
                Cancel
              </button>
              <button className="button button--primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save project'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modal === 'task' || modal === 'editTask' ? (
        <Modal title={modal === 'editTask' ? 'Edit task' : 'Create task'} onClose={closeModal}>
          <form className="modal-form" onSubmit={handleTaskSubmit}>
            <label className="field">
              <span>Task title</span>
              <input
                type="text"
                value={taskForm.title}
                onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Prepare sprint review"
                required
              />
            </label>

            <label className="field">
              <span>Project</span>
              <select
                value={taskForm.project}
                onChange={(event) => setTaskForm((current) => ({ ...current, project: event.target.value, assignedTo: '' }))}
                required
                disabled={!taskProjectOptions.length}
              >
                <option value="" disabled>{taskProjectOptions.length ? 'Select a project' : 'No projects available'}</option>
                {taskProjectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label className="field">
                <span>Status</span>
                <select
                  value={taskForm.status}
                  onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value }))}
                >
                  {STATUS_OPTIONS.filter((status) => status !== 'All').map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Due date</span>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </label>
            </div>

            <label className="field">
              <span>Assign to</span>
              <select
                value={taskForm.assignedTo}
                onChange={(event) => setTaskForm((current) => ({ ...current, assignedTo: event.target.value }))}
              >
                <option value="">Unassigned</option>
                {(projects.find((project) => project._id === taskForm.project)?.members || []).map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </label>

            {error ? <div className="alert alert--error">{error}</div> : null}

            <div className="modal-actions">
              <button className="button button--ghost" type="button" onClick={closeModal}>
                Cancel
              </button>
              <button className="button button--primary" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save task'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modal === 'members' && activeProject ? (
        <Modal title={`Manage members for ${activeProject.name}`} onClose={closeModal}>
          <div className="members-layout">
            <section>
              <p className="members-heading">Current members</p>
              {activeProject.members?.length ? (
                activeProject.members.map((member) => (
                  <div key={member._id} className="member-row">
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.email} • {member.role}</span>
                    </div>
                    <button className="button button--danger" type="button" onClick={() => handleRemoveMember(member._id)}>
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted-copy">No members added to this project yet.</p>
              )}
            </section>

            <section>
              <p className="members-heading">Available users</p>
              {availableMembers.length ? (
                availableMembers.map((member) => (
                  <div key={member._id} className="member-row">
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.email} • {member.role}</span>
                    </div>
                    <button className="button button--primary" type="button" onClick={() => handleAddMember(member._id)}>
                      Add
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted-copy">All available users are already on this project.</p>
              )}
            </section>
          </div>

          {error ? <div className="alert alert--error">{error}</div> : null}
        </Modal>
      ) : null}
    </main>
  );
}
