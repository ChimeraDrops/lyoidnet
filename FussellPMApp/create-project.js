// Create Project Page Logic
import firebaseConfig from './firebase-config.js';

// Initialize Firebase (with error handling for local testing)
let db, auth, functions;
let firebaseInitialized = false;
let currentUser = null;

try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        functions = firebase.functions();
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
    } else {
        console.warn('Firebase not configured - running in demo mode. UI will work but data will not be saved.');
    }
} catch (error) {
    console.error('Firebase initialization failed:', error);
    console.warn('Running in demo mode - UI will work but data will not be saved.');
}

// Check authentication on page load
if (firebaseInitialized) {
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User authenticated:', user.email);
            currentUser = user;
            // Show user info in header
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('user-info').classList.remove('hidden');
        } else {
            console.log('No user authenticated, redirecting to login');
            // Redirect to login if not authenticated
            window.location.href = 'login.html?redirect=create-project.html';
        }
    });
}

// State management
let todos = [];
let teamEmails = [];

// Add todo item
function addTodo() {
    console.log('addTodo called');
    const input = document.getElementById('todo-input');
    const todoText = input.value.trim();
    
    console.log('Todo text:', todoText);
    
    if (todoText) {
        const newTodo = {
            id: Date.now(),
            text: todoText,
            createdBy: 'project-creator'
        };
        todos.push(newTodo);
        console.log('Added todo:', newTodo);
        console.log('Total todos:', todos.length);
        input.value = '';
        renderTodos();
    } else {
        console.warn('Empty todo text, not adding');
    }
}

// Remove todo item
function removeTodo(id) {
    console.log('Removing todo:', id);
    todos = todos.filter(todo => todo.id !== id);
    console.log('Remaining todos:', todos.length);
    renderTodos();
}

// Make removeTodo available globally for onclick in rendered HTML
window.removeTodo = removeTodo;

// Render todos
function renderTodos() {
    console.log('renderTodos called, count:', todos.length);
    const todoList = document.getElementById('todo-list');
    
    if (!todoList) {
        console.error('todo-list element not found!');
        return;
    }
    
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
    console.log('Rendered', todos.length, 'todos');
}

// Add email
function addEmail() {
    console.log('addEmail called');
    const input = document.getElementById('email-input');
    const email = input.value.trim().toLowerCase();
    
    console.log('Email:', email);
    
    if (email && isValidEmail(email)) {
        if (!teamEmails.includes(email)) {
            teamEmails.push(email);
            console.log('Added email:', email);
            console.log('Total emails:', teamEmails.length);
            input.value = '';
            renderEmails();
        } else {
            console.warn('Email already added:', email);
            showAlert('This email has already been added', 'error');
        }
    } else if (email) {
        console.warn('Invalid email format:', email);
        showAlert('Please enter a valid email address', 'error');
    } else {
        console.warn('Empty email, not adding');
    }
}

// Remove email
function removeEmail(email) {
    console.log('Removing email:', email);
    teamEmails = teamEmails.filter(e => e !== email);
    console.log('Remaining emails:', teamEmails.length);
    renderEmails();
}

// Make removeEmail available globally for onclick in rendered HTML
window.removeEmail = removeEmail;

// Render emails
function renderEmails() {
    console.log('renderEmails called, count:', teamEmails.length);
    const emailTags = document.getElementById('email-tags');
    
    if (!emailTags) {
        console.error('email-tags element not found!');
        return;
    }
    
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
    console.log('Rendered', teamEmails.length, 'emails');
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
    
    // Check if Firebase is initialized
    if (!firebaseInitialized) {
        showAlert('Firebase not configured. Please set up Firebase to create projects. See README.md for instructions.', 'error');
        console.error('Cannot create project: Firebase not initialized');
        console.log('Demo data:', { title, description, todos, teamEmails });
        return;
    }
    
    // Show loading
    document.getElementById('create-project-form').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    try {
        // Generate unique project code
        const projectCode = generateProjectCode();
        
        // Use authenticated user as creator
        if (!currentUser) {
            throw new Error('You must be logged in to create a project');
        }
        
        // Create project document
        const projectRef = await db.collection('projects').add({
            title: title,
            description: description,
            code: projectCode,
            creatorId: currentUser.uid,
            creatorEmail: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'setup', // setup, voting, active
            teamMembers: teamEmails,
            todos: todos,
            votingComplete: false,
            launched: false
        }); (if deployed)
        try {
            const sendInvitations = functions.httpsCallable('sendProjectInvitations');
            await sendInvitations({
                projectId: projectRef.id,
                projectCode: projectCode,
                projectTitle: title,
                teamEmails: teamEmails,
                creatorEmail: currentUser.email
            });
        } catch (emailError) {
            console.warn('Email notifications not sent (Cloud Functions may not be deployed):', emailError);
            // Continue anyway - emails are optional
        } teamEmails: teamEmails,
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
console.log('Initializing create-project.js');
console.log('Firebase initialized:', firebaseInitialized);
renderTodos();
renderEmails();

// Attach event listeners to buttons
document.getElementById('add-todo-btn').addEventListener('click', addTodo);
document.getElementById('add-email-btn').addEventListener('click', addEmail);

// Logout handler
document.getElementById('logout-btn').addEventListener('click', async () => {
    if (firebaseInitialized && auth) {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
});

console.log('Initialization complete - event listeners attached');
