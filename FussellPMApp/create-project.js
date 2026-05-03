// Create Project Page Logic
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const functions = firebase.functions();

// State management
let todos = [];
let teamEmails = [];

// Add todo item
window.addTodo = function() {
    const input = document.getElementById('todo-input');
    const todoText = input.value.trim();
    
    if (todoText) {
        todos.push({
            id: Date.now(),
            text: todoText,
            createdBy: 'project-creator'
        });
        input.value = '';
        renderTodos();
    }
};

// Remove todo item
window.removeTodo = function(id) {
    todos = todos.filter(todo => todo.id !== id);
    renderTodos();
};

// Render todos
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    
    if (todos.length === 0) {
        todoList.innerHTML = '<li style="color: #6b7280; text-align: center; padding: 20px;">No tasks added yet</li>';
        return;
    }
    
    todoList.innerHTML = todos.map(todo => `
        <li class="todo-item">
            <div class="todo-content">${todo.text}</div>
            <div class="todo-actions">
                <button class="btn btn-danger" onclick="removeTodo(${todo.id})">Remove</button>
            </div>
        </li>
    `).join('');
}

// Add email
window.addEmail = function() {
    const input = document.getElementById('email-input');
    const email = input.value.trim().toLowerCase();
    
    if (email && isValidEmail(email)) {
        if (!teamEmails.includes(email)) {
            teamEmails.push(email);
            input.value = '';
            renderEmails();
        } else {
            showAlert('This email has already been added', 'error');
        }
    } else if (email) {
        showAlert('Please enter a valid email address', 'error');
    }
};

// Remove email
window.removeEmail = function(email) {
    teamEmails = teamEmails.filter(e => e !== email);
    renderEmails();
};

// Render emails
function renderEmails() {
    const emailTags = document.getElementById('email-tags');
    
    if (teamEmails.length === 0) {
        emailTags.innerHTML = '<span style="color: #6b7280; padding: 10px;">No team members added yet</span>';
        return;
    }
    
    emailTags.innerHTML = teamEmails.map(email => `
        <span class="email-tag">
            ${email}
            <span class="remove" onclick="removeEmail('${email}')">&times;</span>
        </span>
    `).join('');
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

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

// Generate project code
function generateProjectCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Handle form submission
document.getElementById('create-project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('project-title').value.trim();
    const description = document.getElementById('project-description').value.trim();
    
    // Validation
    if (!title || !description) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    if (teamEmails.length === 0) {
        showAlert('Please add at least one team member email', 'error');
        return;
    }
    
    // Show loading
    document.getElementById('create-project-form').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    try {
        // Generate unique project code
        const projectCode = generateProjectCode();
        
        // For now, we'll use anonymous auth or a temporary creator ID
        // In production, you'd want to authenticate the creator first
        const creatorId = `creator_${Date.now()}`;
        
        // Create project document
        const projectRef = await db.collection('projects').add({
            title: title,
            description: description,
            code: projectCode,
            creatorId: creatorId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'setup', // setup, voting, active
            teamMembers: teamEmails,
            todos: todos,
            votingComplete: false,
            launched: false
        });
        
        // Call Cloud Function to send invitation emails
        const sendInvitations = functions.httpsCallable('sendProjectInvitations');
        await sendInvitations({
            projectId: projectRef.id,
            projectCode: projectCode,
            projectTitle: title,
            teamEmails: teamEmails,
            creatorEmail: 'lyoid@lyoid.net' // You'll want to make this dynamic
        });
        
        showAlert('Project created successfully! Invitations sent.', 'success');
        
        // Redirect to creator dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = `dashboard.html?projectId=${projectRef.id}&role=creator`;
        }, 2000);
        
    } catch (error) {
        console.error('Error creating project:', error);
        showAlert(`Error creating project: ${error.message}`, 'error');
        
        // Show form again
        document.getElementById('create-project-form').classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
});

// Allow Enter key to add todos and emails
document.getElementById('todo-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTodo();
    }
});

document.getElementById('email-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addEmail();
    }
});

// Initialize
renderTodos();
renderEmails();
