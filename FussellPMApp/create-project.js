// Create Project Page Logic
import firebaseConfig from './firebase-config.js';

if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let todos = [];
let createdProjectId = null;
let createdProjectCode = null;

function showAlert(message, type = 'info') {
    const c = document.getElementById('alert-container');
    const cls = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    c.innerHTML = `<div class="alert ${cls}">${message}</div>`;
    setTimeout(() => { c.innerHTML = ''; }, 5000);
}

function generateProjectCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    if (todos.length === 0) {
        list.innerHTML = '<li style="color: #6b7280; text-align: center; padding: 20px;">No tasks added yet</li>';
        return;
    }
    list.innerHTML = todos.map(t => `
        <li class="todo-item">
            <div class="todo-content">${t.text}</div>
            <div class="todo-actions">
                <button class="btn btn-danger" data-id="${t.id}">Remove</button>
            </div>
        </li>
    `).join('');
    list.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.getAttribute('data-id'));
            todos = todos.filter(t => t.id !== id);
            renderTodos();
        });
    });
}

function addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;
    todos.push({ id: Date.now(), text: text });
    input.value = '';
    renderTodos();
}

function initEventListeners() {
    document.getElementById('add-todo-btn').addEventListener('click', addTodo);
    document.getElementById('todo-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addTodo(); }
    });
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = 'index.html';
    });
    document.getElementById('create-project-form').addEventListener('submit', handleSubmit);
    renderTodos();
}

async function handleSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('project-title').value.trim();
    const description = document.getElementById('project-description').value.trim();
    if (!title || !description) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    if (!currentUser) {
        showAlert('You must be logged in to create a project', 'error');
        return;
    }

    document.getElementById('create-project-form').style.display = 'none';
    document.getElementById('loading').classList.remove('hidden');

    try {
        const code = generateProjectCode();
        const ref = await db.collection('projects').add({
            title,
            description,
            code,
            creatorId: currentUser.uid,
            creatorEmail: currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'setup',
            teamMembers: [currentUser.email],
            todos: todos,
            votingComplete: false,
            launched: false
        });

        createdProjectId = ref.id;
        createdProjectCode = code;

        // Show success screen with project code
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('success-code').textContent = code;
        document.getElementById('success-screen').classList.remove('hidden');

        document.getElementById('copy-code-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(code).then(() => {
                showAlert('Code copied to clipboard!', 'success');
            }).catch(() => {
                showAlert('Could not copy. Code: ' + code, 'info');
            });
        });

        document.getElementById('go-dashboard-btn').addEventListener('click', () => {
            window.location.href = `dashboard.html?projectId=${createdProjectId}`;
        });
    } catch (err) {
        console.error('Error creating project:', err);
        showAlert('Error creating project: ' + err.message, 'error');
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('create-project-form').style.display = 'block';
    }
}

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'login.html?redirect=create-project.html';
        return;
    }
    currentUser = user;
    document.getElementById('auth-loading').classList.add('hidden');
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('create-project-form').style.display = 'block';
    initEventListeners();
});

console.log('create-project.js loaded');
