// Dashboard Logic
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
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
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// Check authentication and load user data
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    
    // Get user data
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    document.getElementById('username-display').textContent = `Welcome, ${userData.username}!`;
    
    // Check URL for projectId
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    
    if (projectId) {
        loadProject(projectId);
    } else {
        // Load user's projects
        loadUserProjects(userData.projects || []);
    }
});

// Load user's projects
async function loadUserProjects(projectIds) {
    if (projectIds.length === 0) {
        document.getElementById('projects-list').innerHTML = '<p>You are not part of any projects yet.</p>';
        return;
    }
    
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const projects = [];
        for (const projectId of projectIds) {
            const projectDoc = await db.collection('projects').doc(projectId).get();
            if (projectDoc.exists) {
                projects.push({ id: projectDoc.id, ...projectDoc.data() });
            }
        }
        
        projectsList.innerHTML = projects.map(project => `
            <div class="card" style="margin-bottom: 10px; cursor: pointer;" onclick="loadProject('${project.id}')">
                <h3>${project.title}</h3>
                <p style="color: var(--text-secondary);">${project.description}</p>
                <p><strong>Status:</strong> ${project.status}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading projects:', error);
        showAlert('Error loading projects', 'error');
    }
}

// Load specific project
window.loadProject = async function(projectId) {
    currentProjectId = projectId;
    
    // Hide project selector
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
    
    // Update project header
    document.getElementById('project-title').textContent = project.title;
    document.getElementById('project-description').textContent = project.description;
    document.getElementById('project-code').textContent = project.code;
    
    // Update status badge
    const statusBadge = document.getElementById('project-status-badge');
    const statusMap = {
        'setup': '⚙️ Setup',
        'voting': '🗳️ Voting',
        'active': '✅ Active'
    };
    statusBadge.textContent = statusMap[project.status] || project.status;
    
    // Check if user is creator
    const isCreator = project.creatorId === currentUser.uid || 
                      (project.members && project.members[currentUser.uid]?.role === 'creator');
    
    if (isCreator) {
        document.getElementById('creator-controls').style.display = 'block';
        
        // Show appropriate buttons based on status
        if (project.status === 'setup') {
            document.getElementById('launch-btn').style.display = 'inline-block';
            document.getElementById('finalize-voting-btn').style.display = 'none';
        } else if (project.status === 'voting') {
            document.getElementById('launch-btn').style.display = 'none';
            document.getElementById('finalize-voting-btn').style.display = 'inline-block';
            updateVotingStatus();
        } else {
            document.getElementById('creator-controls').style.display = 'none';
        }
    }
    
    // Show voting section if project is in voting status
    if (project.status === 'voting') {
        const userVoted = project.votes && project.votes[currentUser.uid];
        if (!userVoted) {
            document.getElementById('voting-section').style.display = 'block';
            renderVotingTodos();
        } else {
            document.getElementById('voting-section').innerHTML = `
                <div class="alert alert-success">
                    ✅ You have already submitted your priority votes!
                </div>
            `;
            document.getElementById('voting-section').style.display = 'block';
        }
    } else {
        document.getElementById('voting-section').style.display = 'none';
    }
    
    // Show kanban button if project is active
    if (project.status === 'active') {
        document.getElementById('view-kanban-btn').style.display = 'inline-block';
    }
    
    // Render todos
    renderTodos();
    
    // Render team members
    renderTeamMembers();
}

// Render todos
function renderTodos() {
    const todos = currentProject.todos || [];
    const todosContainer = document.getElementById('todos-container');
    
    if (todos.length === 0) {
        todosContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No tasks yet. Add one above!</p>';
        return;
    }
    
    todosContainer.innerHTML = `
        <ul class="todo-list">
            ${todos.map((todo, index) => `
                <li class="todo-item">
                    <div class="todo-content">
                        <strong>${todo.text}</strong>
                        <br>
                        <small style="color: var(--text-secondary);">
                            Added by: ${todo.createdBy || 'Unknown'}
                            ${todo.priority ? ` | Priority: ${todo.priority}` : ''}
                        </small>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}

// Add new todo
window.addTodo = async function() {
    const input = document.getElementById('new-todo-input');
    const todoText = input.value.trim();
    
    if (!todoText) {
        showAlert('Please enter a task', 'error');
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        
        await db.collection('projects').doc(currentProjectId).update({
            todos: firebase.firestore.FieldValue.arrayUnion({
                id: Date.now(),
                text: todoText,
                createdBy: userData.username,
                createdAt: new Date().toISOString()
            })
        });
        
        input.value = '';
        showAlert('Task added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding todo:', error);
        showAlert('Error adding task', 'error');
    }
};

// Render voting todos
function renderVotingTodos() {
    const todos = currentProject.todos || [];
    const votingTodos = document.getElementById('voting-todos');
    
    votingTodos.innerHTML = todos.map((todo, index) => `
        <div class="todo-item" style="flex-direction: column; align-items: stretch;">
            <div class="todo-content">${todo.text}</div>
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                <label style="flex: 0 0 auto;">Points:</label>
                <input 
                    type="number" 
                    min="0" 
                    max="20" 
                    value="${userVotes[index] || 0}" 
                    onchange="updateVotePoints(${index}, this.value)"
                    style="width: 80px; padding: 6px;">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                    Current: ${userVotes[index] || 0} points
                </span>
            </div>
        </div>
    `).join('');
}

// Update vote points
window.updateVotePoints = function(todoIndex, points) {
    points = parseInt(points) || 0;
    
    // Calculate current total
    const currentTotal = Object.values(userVotes).reduce((sum, p) => sum + p, 0) - (userVotes[todoIndex] || 0);
    
    // Check if new total exceeds 20
    if (currentTotal + points > 20) {
        showAlert('You cannot assign more than 20 total points', 'error');
        renderVotingTodos(); // Reset display
        return;
    }
    
    userVotes[todoIndex] = points;
    pointsRemaining = 20 - (currentTotal + points);
    
    document.getElementById('points-remaining').textContent = pointsRemaining;
};

// Submit votes
window.submitVotes = async function() {
    const totalPoints = Object.values(userVotes).reduce((sum, p) => sum + p, 0);
    
    if (totalPoints !== 20) {
        showAlert('You must assign exactly 20 points before submitting', 'error');
        return;
    }
    
    try {
        // Save votes
        await db.collection('projects').doc(currentProjectId).update({
            [`votes.${currentUser.uid}`]: userVotes
        });
        
        showAlert('Votes submitted successfully!', 'success');
        
        // Reload project to update UI
        renderProject();
        
    } catch (error) {
        console.error('Error submitting votes:', error);
        showAlert('Error submitting votes', 'error');
    }
};

// Launch project (creator only)
window.launchProject = async function() {
    if (!confirm('Are you ready to launch this project for priority voting?')) {
        return;
    }
    
    try {
        await db.collection('projects').doc(currentProjectId).update({
            status: 'voting',
            launchedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Send email notifications to team members
        const sendVotingNotification = functions.httpsCallable('sendVotingNotification');
        await sendVotingNotification({
            projectId: currentProjectId,
            projectTitle: currentProject.title
        });
        
        showAlert('Project launched! Team members have been notified to vote.', 'success');
        
    } catch (error) {
        console.error('Error launching project:', error);
        showAlert('Error launching project', 'error');
    }
};

// Update voting status (for creator)
function updateVotingStatus() {
    const votes = currentProject.votes || {};
    const members = currentProject.members || {};
    const totalMembers = Object.keys(members).length;
    const votesReceived = Object.keys(votes).length;
    
    document.getElementById('voting-status').innerHTML = `
        <div class="alert alert-info">
            <strong>Voting Progress:</strong> ${votesReceived} of ${totalMembers} members have voted
        </div>
    `;
}

// Finalize voting and create Kanban board
window.finalizeVoting = async function() {
    const votes = currentProject.votes || {};
    const members = currentProject.members || {};
    
    if (Object.keys(votes).length < Object.keys(members).length) {
        if (!confirm('Not all team members have voted. Do you want to finalize anyway?')) {
            return;
        }
    }
    
    try {
        // Calculate priority scores
        const todos = currentProject.todos || [];
        const priorityScores = todos.map((todo, index) => {
            const score = Object.values(votes).reduce((sum, userVote) => {
                return sum + (userVote[index] || 0);
            }, 0);
            return { ...todo, priority: score, status: 'not-started' };
        });
        
        // Sort by priority (highest first)
        priorityScores.sort((a, b) => b.priority - a.priority);
        
        // Update project
        await db.collection('projects').doc(currentProjectId).update({
            status: 'active',
            todos: priorityScores,
            finalizedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showAlert('Voting finalized! Project is now active.', 'success');
        
    } catch (error) {
        console.error('Error finalizing voting:', error);
        showAlert('Error finalizing voting', 'error');
    }
};

// View Kanban board
window.viewKanban = function() {
    window.location.href = `kanban.html?projectId=${currentProjectId}`;
};

// Render team members
function renderTeamMembers() {
    const members = currentProject.members || {};
    const teamMembersList = document.getElementById('team-members-list');
    
    const memberCount = Object.keys(members).length;
    
    if (memberCount === 0) {
        teamMembersList.innerHTML = '<p style="color: var(--text-secondary);">No team members yet.</p>';
        return;
    }
    
    teamMembersList.innerHTML = `
        <ul style="list-style: none;">
            ${Object.values(members).map(member => `
                <li style="padding: 10px; border-bottom: 1px solid var(--border-color);">
                    <strong>${member.username}</strong>
                    <span style="color: var(--text-secondary);"> (${member.email})</span>
                    ${member.role === 'creator' ? '<span style="color: var(--primary-color); font-weight: 600;"> - Creator</span>' : ''}
                </li>
            `).join('')}
        </ul>
    `;
}

// Logout
window.logout = async function() {
    await auth.signOut();
    window.location.href = 'index.html';
};

// Allow Enter key to add todo
document.getElementById('new-todo-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});
