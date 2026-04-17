const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';
const API_URL = `${API_BASE_URL}/tasks`;
const CACHE_KEY = 'todo_tasks';
let currentFilter = 'all';
let allTasks = [];

function loadTasksFromCache() {
  const cached = localStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : [];
}

function saveTasksToCache(tasks) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(tasks));
}

function showMessage(text, type = 'success') {
  const msgEl = document.getElementById('message');
  msgEl.textContent = text;
  msgEl.className = `message ${type}`;
  msgEl.style.display = 'block';
  setTimeout(() => msgEl.style.display = 'none', 3000);
}

function setLoading(loading) {
  document.getElementById('loading').style.display = loading ? 'block' : 'none';
  document.getElementById('addBtn').disabled = loading;
  document.getElementById('taskInput').disabled = loading;
}

function setActiveFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
}

async function fetchTasks() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return await response.json();
}

async function addTask(title) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to add task');
  }
  const newTask = await response.json();
  allTasks.push(newTask);
  saveTasksToCache(allTasks);
  return newTask;
}

async function updateTask(id, data) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to update task');
  }
  allTasks = allTasks.map(t => t.id === id ? { ...t, ...data } : t);
  saveTasksToCache(allTasks);
  return await response.json();
}

async function deleteTask(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to delete task');
  }
  allTasks = allTasks.filter(t => t.id !== id);
  saveTasksToCache(allTasks);
  return await response.json();
}

async function renderTasks() {
  const cachedTasks = loadTasksFromCache();
  if (cachedTasks.length > 0) {
    allTasks = cachedTasks;
    renderFilteredTasks();
  }

  setLoading(true);
  try {
    const freshTasks = await fetchTasks();
    allTasks = freshTasks;
    saveTasksToCache(freshTasks);
    renderFilteredTasks();
  } catch (err) {
    if (cachedTasks.length === 0) {
      showMessage(err.message, 'error');
    }
  } finally {
    setLoading(false);
  }
}

function renderFilteredTasks() {
  const filtered = currentFilter === 'all' 
    ? allTasks 
    : allTasks.filter(t => currentFilter === 'completed' ? t.completed : !t.completed);
  
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    const msg = currentFilter === 'completed' ? 'No completed tasks' 
      : currentFilter === 'pending' ? 'No pending tasks' 
      : 'No tasks yet. Add one above!';
    taskList.innerHTML = `<li class="empty-message">${msg}</li>`;
    return;
  }

  filtered.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'task-item added';
    li.style.animationDelay = `${index * 0.05}s`;
    li.innerHTML = `
      <span class="task-title ${task.completed ? 'completed' : ''}" 
            ondblclick="makeEditable(this, ${task.id})">${task.title}</span>
      <div class="task-actions">
        <button class="complete-btn" onclick="toggleComplete(${task.id}, ${task.completed ? 0 : 1})">
          ${task.completed ? 'Undo' : 'Complete'}
        </button>
        <button class="delete-btn" onclick="removeTask(${task.id})">Delete</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

async function makeEditable(span, id) {
  const currentTitle = span.textContent;
  span.innerHTML = `<input type="text" class="edit-input" value="${currentTitle}" onblur="saveTitle(this, ${id})" onkeydown="handleEditKey(event, this, ${id})">`;
  span.querySelector('input').focus();
}

async function saveTitle(input, id) {
  const newTitle = input.value.trim();
  if (newTitle) {
    try {
      await updateTask(id, { title: newTitle });
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }
  await renderTasks();
}

function handleEditKey(event, input, id) {
  if (event.key === 'Enter') {
    saveTitle(input, id);
  } else if (event.key === 'Escape') {
    renderTasks();
  }
}

async function toggleComplete(id, completed) {
  try {
    await updateTask(id, { completed });
    await renderTasks();
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function removeTask(id) {
  const li = document.querySelector(`[onclick="removeTask(${id})"]`).closest('.task-item');
  li.classList.add('removing');
  
  try {
    await deleteTask(id);
    await new Promise(resolve => setTimeout(resolve, 300));
    await renderTasks();
  } catch (err) {
    li.classList.remove('removing');
    showMessage(err.message, 'error');
  }
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('taskInput');
  const addBtn = document.getElementById('addBtn');
  const title = input.value.trim();
  
  if (!title) {
    showMessage('Please enter a task title', 'error');
    return;
  }
  
  setLoading(true);
  try {
    await addTask(title);
    input.value = '';
    showMessage('Task added successfully');
    await renderTasks();
  } catch (err) {
    showMessage(err.message, 'error');
  } finally {
    setLoading(false);
  }
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setActiveFilter(btn.dataset.filter);
    renderTasks();
  });
});

renderTasks();