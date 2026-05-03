// Kanban Board Logic
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let currentProject = null;
window.currentProjectId = null;
let currentTaskId = null;
let unsubscribeProject = null;

// Kanban column definitions
const columns = [
    { id: 'not-started', title: 'Not Started' },
    { id: 'leader-assigned', title: 'Leader Assigned' },
    { id: 'started-no-issue', title: 'Started No Issue' },
    { id: 'need-resources', title: 'Need Resources' },
    { id: 'underway', title: 'Underway' },
    { id: 'out-for-approval', title: 'Out for Approval' },
    { id: 'closing', title: 'Closing' },
    { id: 'done', title: 'Done' }
];

// Show alert
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Check authentication
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    
    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    
    if (!projectId) {
        showAlert('No project ID provided', 'error');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
        return;
    }
    
    window.currentProjectId = projectId;
    loadProject(projectId);
});

// Load project with real-time updates
function loadProject(projectId) {
    unsubscribeProject = db.collection('projects').doc(projectId).onSnapshot((doc) => {
        if (doc.exists) {
            currentProject = { id: doc.id, ...doc.data() };
            renderKanbanBoard();
            populateAssigneeFilter();
        } else {
            showAlert('Project not found', 'error');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
        }
    });
}

// Render Kanban board
function renderKanbanBoard() {
    // Update header
    document.getElementById('project-title').textContent = currentProject.title;
    document.getElementById('project-description').textContent = currentProject.description;
    
    const kanbanBoard = document.getElementById('kanban-board');
    
    // Group tasks by status
    const tasksByStatus = {};
    columns.forEach(col => tasksByStatus[col.id] = []);
    
    const todos = currentProject.todos || [];
    todos.forEach(todo => {
        const status = todo.status || 'not-started';
        if (tasksByStatus[status]) {
            tasksByStatus[status].push(todo);
        }
    });
    
    // Render columns
    kanbanBoard.innerHTML = columns.map(column => {
        const tasks = tasksByStatus[column.id];
        
        return `
            <div class="kanban-column" data-status="${column.id}" ondrop="drop(event)" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
                <div class="kanban-column-header ${column.id}">
                    <div>${column.title}</div>
                    <div style="font-size: 0.875rem; opacity: 0.7;">${tasks.length}</div>
                </div>
                <div class="kanban-column-content">
                    ${tasks.map(task => renderTaskCard(task)).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Render task card
function renderTaskCard(task) {
    const assignedTo = task.assignedTo || 'Unassigned';
    const priorityClass = task.priority > 50 ? 'high' : task.priority > 20 ? 'medium' : 'low';
    
    return `
        <div class="kanban-card" 
             draggable="true" 
             ondragstart="drag(event)" 
             data-task-id="${task.id}"
             onclick="openTaskDetails(${task.id})">
            <div class="kanban-card-title">${task.text}</div>
            ${task.description ? `<div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 5px;">${task.description}</div>` : ''}
            <div class="kanban-card-meta">
                <span>${assignedTo}</span>
                <span class="priority-badge">${task.priority || 0}</span>
            </div>
        </div>
    `;
}

// Drag and Drop Functions
window.allowDrop = function(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
};

window.dragLeave = function(event) {
    event.currentTarget.classList.remove('drag-over');
};

window.drag = function(event) {
    event.dataTransfer.setData('taskId', event.target.getAttribute('data-task-id'));
    event.target.classList.add('dragging');
};

window.drop = async function(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const taskId = parseInt(event.dataTransfer.getData('taskId'));
    const newStatus = event.currentTarget.getAttribute('data-status');
    
    // Update task status in Firebase
    await updateTaskStatus(taskId, newStatus);
    
    // Remove dragging class from all cards
    document.querySelectorAll('.kanban-card').forEach(card => {
        card.classList.remove('dragging');
    });
};

// Update task status
async function updateTaskStatus(taskId, newStatus) {
    try {
        const todos = currentProject.todos || [];
        const updatedTodos = todos.map(todo => {
            if (todo.id === taskId) {
                return { ...todo, status: newStatus };
            }
            return todo;
        });
        
        await db.collection('projects').doc(window.currentProjectId).update({
            todos: updatedTodos
        });
        
        showAlert('Task status updated!', 'success');
    } catch (error) {
        console.error('Error updating task:', error);
        showAlert('Error updating task status', 'error');
    }
}

// Open task details modal
window.openTaskDetails = function(taskId) {
    const task = currentProject.todos.find(t => t.id === taskId);
    if (!task) return;
    
    currentTaskId = taskId;
    
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('task-title').value = task.text || '';
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-status').value = task.status || 'not-started';
    document.getElementById('task-priority').value = task.priority || 0;
    
    // Populate assignee dropdown
    populateAssigneeDropdown();
    document.getElementById('task-assignee').value = task.assignedTo || '';
    
    document.getElementById('delete-task-btn').style.display = 'inline-block';
    document.getElementById('task-modal').style.display = 'flex';
};

// Show task modal for new task
window.showTaskModal = function() {
    currentTaskId = null;
    
    document.getElementById('modal-title').textContent = 'Add New Task';
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-status').value = 'not-started';
    document.getElementById('task-priority').value = '0';
    document.getElementById('task-assignee').value = '';
    
    populateAssigneeDropdown();
    
    document.getElementById('delete-task-btn').style.display = 'none';
    document.getElementById('task-modal').style.display = 'flex';
};

// Close task modal
window.closeTaskModal = function() {
    document.getElementById('task-modal').style.display = 'none';
    currentTaskId = null;
};

// Populate assignee dropdown
function populateAssigneeDropdown() {
    const members = currentProject.members || {};
    const assigneeSelect = document.getElementById('task-assignee');
    
    assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
    
    Object.values(members).forEach(member => {
        const option = document.createElement('option');
        option.value = member.username;
        option.textContent = member.username;
        assigneeSelect.appendChild(option);
    });
}

// Populate assignee filter
function populateAssigneeFilter() {
    const members = currentProject.members || {};
    const filterSelect = document.getElementById('assignee-filter');
    
    // Keep current selection
    const currentValue = filterSelect.value;
    
    filterSelect.innerHTML = '<option value="all">All Tasks</option>';
    
    Object.values(members).forEach(member => {
        const option = document.createElement('option');
        option.value = member.username;
        option.textContent = member.username;
        filterSelect.appendChild(option);
    });
    
    // Restore selection
    filterSelect.value = currentValue;
}

// Filter tasks
window.filterTasks = function() {
    const filterValue = document.getElementById('assignee-filter').value;
    
    // This is a simple implementation - you could enhance this
    // For now, we'll just re-render the board
    // In a more advanced version, you'd filter the todos before rendering
    showAlert('Filtering by: ' + (filterValue === 'all' ? 'All Tasks' : filterValue), 'info');
};

// Save task
window.saveTask = async function() {
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const status = document.getElementById('task-status').value;
    const assignedTo = document.getElementById('task-assignee').value;
    
    if (!title) {
        showAlert('Please enter a task title', 'error');
        return;
    }
    
    try {
        const todos = currentProject.todos || [];
        
        if (currentTaskId) {
            // Update existing task
            const updatedTodos = todos.map(todo => {
                if (todo.id === currentTaskId) {
                    return {
                        ...todo,
                        text: title,
                        description: description,
                        status: status,
                        assignedTo: assignedTo || null
                    };
                }
                return todo;
            });
            
            await db.collection('projects').doc(window.currentProjectId).update({
                todos: updatedTodos
            });
            
            showAlert('Task updated successfully!', 'success');
        } else {
            // Add new task
            const newTask = {
                id: Date.now(),
                text: title,
                description: description,
                status: status,
                assignedTo: assignedTo || null,
                priority: 0,
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            };
            
            await db.collection('projects').doc(window.currentProjectId).update({
                todos: firebase.firestore.FieldValue.arrayUnion(newTask)
            });
            
            showAlert('Task added successfully!', 'success');
        }
        
        closeTaskModal();
        
    } catch (error) {
        console.error('Error saving task:', error);
        showAlert('Error saving task', 'error');
    }
};

// Delete task
window.deleteTask = async function() {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const todos = currentProject.todos || [];
        const updatedTodos = todos.filter(todo => todo.id !== currentTaskId);
        
        await db.collection('projects').doc(window.currentProjectId).update({
            todos: updatedTodos
        });
        
        showAlert('Task deleted successfully!', 'success');
        closeTaskModal();
        
    } catch (error) {
        console.error('Error deleting task:', error);
        showAlert('Error deleting task', 'error');
    }
};

// Logout
window.logout = async function() {
    await auth.signOut();
    window.location.href = 'index.html';
};

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('task-modal');
    if (event.target === modal) {
        closeTaskModal();
    }
};
