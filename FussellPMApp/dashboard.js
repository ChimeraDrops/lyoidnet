// Dashboard Logic
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
try {
    if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (e) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
const functions = firebase.functions();

let currentUser = null;
let currentProject = null;
let currentProjectId = null;
let userVotes = {};
let pointsRemaining = 20;
let unsubscribeProject = null;

// Show alert
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    alertContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
}

// Logout
window.logout = async function() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
};

// Check authentication and load user data
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;

    try {
        // Get user data by email
        const userQuery = await db.collection('users')
            .where('email', '==', user.email)
            .limit(1)
            .get();

        if (!userQuery.empty) {
            const userData = userQuery.docs[0].data();
            document.getElementById('username-display').textContent = `Welcome, ${userData.username || user.email}!`;
        } else {
            document.getElementById('username-display').textContent = `Welcome, ${user.email}!`;
        }

        // Check URL for projectId
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('projectId');

        if (projectId) {
            loadProject(projectId);
        } else {
            loadUserProjects();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        document.getElementById('username-display').textContent = `Welcome, ${user.email}!`;
        loadUserProjects();
    }
});

// Load user's projects
async function loadUserProjects() {
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        // Query projects where user is creator
        const creatorSnapshot = await db.collection('projects')
            .where('creatorId', '==', currentUser.uid)
            .get();

        // Query projects where user is a team member
        const memberSnapshot = await db.collection('projects')
            .where('teamMembers', 'array-contains', currentUser.email)
            .get();

        // Combine and deduplicate
        const projectsMap = new Map();
        creatorSnapshot.forEach(doc => projectsMap.set(doc.id, { id: doc.id, ...doc.data() }));
        memberSnapshot.forEach(doc => {
            if (!projectsMap.has(doc.id)) {
                projectsMap.set(doc.id, { id: doc.id, ...doc.data() });
            }
        });

        const projects = Array.from(projectsMap.values());

        if (projects.length === 0) {
            projectsList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No projects found. <a href="create-project.html">Create a new project</a> to get started!</p>';
            return;
        }

        projectsList.innerHTML = projects.map(project => `
            <div class="card" style="margin-bottom: 10px; cursor: pointer; border: 1px solid var(--border-color);" onclick="loadProject('${project.id}')">
                <h3>${project.title}</h3>
                <p style="color: var(--text-secondary);">${project.description}</p>
                <p><strong>Status:</strong> ${project.status} &nbsp;|&nbsp; <strong>Code:</strong> ${project.code}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading projects:', error);
        showAlert('Error loading projects: ' + error.message, 'error');
        projectsList.innerHTML = '<p style="color: red; text-align: center;">Error loading projects. Check console for details.</p>';
    }
}

// Load specific project
window.loadProject = async function(projectId) {
    currentProjectId = projectId;

    // Show project dashboard, hide selector
    document.getElementById('project-selector').classList.add('hidden');
    document.getElementById('project-dashboard').classList.remove('hidden');

    // Set up real-time listener
    if (unsubscribeProject) {
        unsubscribeProject();
    }

    unsubscribeProject = db.collection('projects').doc(projectId).onSnapshot((doc) => {
        if (doc.exists) {
            currentProject = { id: doc.id, ...doc.data() };
            renderProject();
        }
    });
};

// Render project data
function renderProject() {
    const project = currentProject;

    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-description').textContent = project.description;
    document.getElementById('project-code').textContent = project.code;
    document.getElementById('project-status-badge').textContent = project.status;

    // Show Kanban button if project is active
    if (project.status === 'active') {
        document.getElementById('view-kanban-btn').style.display = 'inline-block';
    }

    // Show creator controls if user is creator
    if (project.creatorId === currentUser.uid) {
        document.getElementById('creator-controls').style.display = 'block';

        if (project.status === 'setup') {
            document.getElementById('launch-btn').style.display = 'inline-block';
            document.getElementById('finalize-voting-btn').style.display = 'none';
        } else if (project.status === 'voting') {
            document.getElementById('launch-btn').style.display = 'none';
            document.getElementById('finalize-voting-btn').style.display = 'inline-block';
        }
    }

    // Show voting section if project is in voting stage
    if (project.status === 'voting') {
        document.getElementById('voting-section').style.display = 'block';
        renderVotingTodos();
    }

    // Render todos
    renderTodos();

    // Render team members
    renderTeamMembers();
}

// Render todos list
function renderTodos() {
    const container = document.getElementById('todos-container');
    const todos = currentProject.todos || [];

    if (todos.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No tasks yet. Add some above!</p>';
        return;
    }

    container.innerHTML = todos.map((todo, index) => `
        <div class="todo-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--border-color);">
            <div>
                <span>${todo.text}</span>
                ${todo.priorityScore ? `<span style="margin-left: 10px; font-size: 0.85rem; color: var(--primary-color);">Priority Score: ${todo.priorityScore}</span>` : ''}
            </div>
            <button class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem;" onclick="removeTodo(${index})">Remove</button>
        </div>
    `).join('');
}

// Render voting todos
function renderVotingTodos() {
    const container = document.getElementById('voting-todos');
    const todos = currentProject.todos || [];

    document.getElementById('points-remaining').textContent = pointsRemaining;

    container.innerHTML = todos.map((todo, index) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid var(--border-color);">
            <span>${todo.text}</span>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button class="btn btn-secondary" style="padding: 5px 10px;" onclick="adjustVote(${index}, -1)">-</button>
                <span style="min-width: 30px; text-align: center; font-weight: bold;">${userVotes[index] || 0}</span>
                <button class="btn btn-primary" style="padding: 5px 10px;" onclick="adjustVote(${index}, 1)">+</button>
            </div>
        </div>
    `).join('');
}

// Render team members
function renderTeamMembers() {
    const container = document.getElementById('team-members-list');
    const members = currentProject.teamMembers || [];

    if (members.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No team members yet.</p>';
        return;
    }

    container.innerHTML = members.map(email => `
        <span style="display: inline-block; background: var(--primary-light, #e8f0fe); color: var(--primary-color); padding: 4px 12px; border-radius: 20px; margin: 4px; font-size: 0.9rem;">${email}</span>
    `).join('');
}

// Add todo
window.addTodo = async function() {
    const input = document.getElementById('new-todo-input');
    const text = input.value.trim();
    if (!text) return;

    try {
        const todos = currentProject.todos || [];
        todos.push({ id: Date.now(), text: text, createdBy: currentUser.email });
        await db.collection('projects').doc(currentProjectId).update({ todos: todos });
        input.value = '';
    } catch (error) {
        showAlert('Error adding task: ' + error.message, 'error');
    }
};

// Remove todo
window.removeTodo = async function(index) {
    try {
        const todos = currentProject.todos || [];
        todos.splice(index, 1);
        await db.collection('projects').doc(currentProjectId).update({ todos: todos });
    } catch (error) {
        showAlert('Error removing task: ' + error.message, 'error');
    }
};

// Adjust vote
window.adjustVote = function(index, delta) {
    const current = userVotes[index] || 0;
    const newVal = current + delta;
    const totalVoted = Object.values(userVotes).reduce((a, b) => a + b, 0);
    const newTotal = totalVoted - current + newVal;

    if (newVal < 0 || newTotal > 20) return;

    userVotes[index] = newVal;
    pointsRemaining = 20 - newTotal;
    renderVotingTodos();
};

// Submit votes
window.submitVotes = async function() {
    try {
        const votesRef = db.collection('projects').doc(currentProjectId)
            .collection('votes').doc(currentUser.uid);

        await votesRef.set({
            votes: userVotes,
            votedBy: currentUser.email,
            votedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showAlert('Votes submitted successfully!', 'success');
    } catch (error) {
        showAlert('Error submitting votes: ' + error.message, 'error');
    }
};

// Launch project for voting
window.launchProject = async function() {
    try {
        await db.collection('projects').doc(currentProjectId).update({ status: 'voting' });
        showAlert('Project launched for voting!', 'success');
    } catch (error) {
        showAlert('Error launching project: ' + error.message, 'error');
    }
};

// Finalize voting and start project
window.finalizeVoting = async function() {
    try {
        // Get all votes
        const votesSnapshot = await db.collection('projects').doc(currentProjectId)
            .collection('votes').get();

        const todos = currentProject.todos || [];
        const scoreMap = {};

        votesSnapshot.forEach(doc => {
            const votes = doc.data().votes || {};
            Object.entries(votes).forEach(([index, points]) => {
                scoreMap[index] = (scoreMap[index] || 0) + points;
            });
        });

        // Apply scores to todos
        const scoredTodos = todos.map((todo, index) => ({
            ...todo,
            priorityScore: scoreMap[index] || 0
        }));

        // Sort by priority score descending
        scoredTodos.sort((a, b) => b.priorityScore - a.priorityScore);

        await db.collection('projects').doc(currentProjectId).update({
            todos: scoredTodos,
            status: 'active',
            votingComplete: true
        });

        showAlert('Voting finalized! Project is now active.', 'success');
    } catch (error) {
        showAlert('Error finalizing voting: ' + error.message, 'error');
    }
};

// View Kanban board
window.viewKanban = function() {
    window.location.href = `kanban.html?projectId=${currentProjectId}`;
};

// Back to all projects list
window.backToProjects = function() {
    if (unsubscribeProject) unsubscribeProject();
    currentProject = null;
    currentProjectId = null;
    userVotes = {};
    pointsRemaining = 20;

    // Clear projectId from URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('projectId');
    window.history.replaceState({}, '', url);

    document.getElementById('project-dashboard').classList.add('hidden');
    document.getElementById('project-selector').classList.remove('hidden');
    loadUserProjects();
};

// Delete project - show confirmation modal
window.deleteProject = function() {
    const modal = document.getElementById('delete-modal');
    document.getElementById('delete-project-name').textContent = currentProject.title;
    modal.style.display = 'flex';
};

// Close modal without deleting
window.closeDeleteModal = function() {
    document.getElementById('delete-modal').style.display = 'none';
};

// Close modal if user clicks the backdrop
document.getElementById('delete-modal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
});

// Confirmed delete - remove project and all subcollections
window.confirmDeleteProject = async function() {
    closeDeleteModal();
    try {
        // Delete votes subcollection docs
        const votesSnapshot = await db.collection('projects').doc(currentProjectId)
            .collection('votes').get();
        const deleteVotes = votesSnapshot.docs.map(d => d.ref.delete());
        await Promise.all(deleteVotes);

        // Delete the project document
        await db.collection('projects').doc(currentProjectId).delete();

        showAlert('Project deleted.', 'success');

        // Return to project list
        if (unsubscribeProject) unsubscribeProject();
        currentProject = null;
        currentProjectId = null;
        document.getElementById('project-dashboard').classList.add('hidden');
        document.getElementById('project-selector').classList.remove('hidden');
        loadUserProjects();
    } catch (error) {
        showAlert('Error deleting project: ' + error.message, 'error');
    }
};

console.log('Dashboard.js loaded');
