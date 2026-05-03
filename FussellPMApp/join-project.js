// Join Project - login, signup, or enter code
import firebaseConfig from './firebase-config.js';

if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;

function showAlert(message, type = 'info') {
    const c = document.getElementById('alert-container');
    const cls = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    c.innerHTML = `<div class="alert ${cls}">${message}</div>`;
    setTimeout(() => { c.innerHTML = ''; }, 5000);
}

// Persist code across login redirects via sessionStorage
function getStoredCode() {
    return (sessionStorage.getItem('pendingProjectCode') || '').toUpperCase();
}
function setStoredCode(code) {
    if (code) sessionStorage.setItem('pendingProjectCode', code.toUpperCase());
    else sessionStorage.removeItem('pendingProjectCode');
}

// Find a project by code and add the current user to teamMembers
async function joinByCode(code) {
    const upper = code.trim().toUpperCase();
    if (!upper) {
        showAlert('Please enter a project code', 'error');
        return null;
    }
    const snap = await db.collection('projects').where('code', '==', upper).limit(1).get();
    if (snap.empty) {
        showAlert('Invalid project code. Please check and try again.', 'error');
        return null;
    }
    const docRef = snap.docs[0];
    const project = docRef.data();

    if (project.creatorId === currentUser.uid || (project.teamMembers || []).includes(currentUser.email)) {
        showAlert('You are already a member of this project!', 'success');
        return docRef.id;
    }

    await db.collection('projects').doc(docRef.id).update({
        teamMembers: firebase.firestore.FieldValue.arrayUnion(currentUser.email)
    });
    showAlert(`Joined "${project.title}"!`, 'success');
    return docRef.id;
}

function showLoggedIn() {
    document.getElementById('auth-loading').classList.add('hidden');
    document.getElementById('logged-out-section').style.display = 'none';
    document.getElementById('logged-in-section').style.display = 'block';
    document.getElementById('user-email-display').textContent = currentUser.email;

    // Auto-fill stored or URL code
    const urlCode = new URLSearchParams(window.location.search).get('code') || '';
    const stored = getStoredCode();
    const initial = (urlCode || stored).toUpperCase();
    if (initial) document.getElementById('project-code').value = initial;
}

function showLoggedOut() {
    document.getElementById('auth-loading').classList.add('hidden');
    document.getElementById('logged-in-section').style.display = 'none';
    document.getElementById('logged-out-section').style.display = 'block';

    // Pre-fill code from URL or storage
    const urlCode = new URLSearchParams(window.location.search).get('code') || '';
    const stored = getStoredCode();
    const initial = (urlCode || stored).toUpperCase();
    if (initial) document.getElementById('pending-code').value = initial;
}

function switchTab(which) {
    const loginTab = document.getElementById('tab-login');
    const signupTab = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (which === 'login') {
        loginTab.classList.add('btn-primary'); loginTab.classList.remove('btn-secondary');
        signupTab.classList.add('btn-secondary'); signupTab.classList.remove('btn-primary');
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signupTab.classList.add('btn-primary'); signupTab.classList.remove('btn-secondary');
        loginTab.classList.add('btn-secondary'); loginTab.classList.remove('btn-primary');
        signupForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const code = document.getElementById('pending-code').value.trim().toUpperCase();
    setStoredCode(code);

    try {
        const userQuery = await db.collection('users').where('username', '==', username).limit(1).get();
        if (userQuery.empty) {
            showAlert('Username not found', 'error');
            return;
        }
        const email = userQuery.docs[0].data().email;
        await auth.signInWithEmailAndPassword(email, password);
        // onAuthStateChanged will handle the rest
    } catch (err) {
        console.error('Login error:', err);
        showAlert('Login failed: ' + err.message, 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const code = document.getElementById('pending-code').value.trim().toUpperCase();

    if (password !== confirm) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }

    setStoredCode(code);

    try {
        // Check username uniqueness
        const existing = await db.collection('users').where('username', '==', username).limit(1).get();
        if (!existing.empty) {
            showAlert('Username already taken', 'error');
            return;
        }

        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await db.collection('users').doc(cred.user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // onAuthStateChanged will handle the rest
    } catch (err) {
        console.error('Signup error:', err);
        showAlert('Signup failed: ' + err.message, 'error');
    }
}

async function handleJoinClick() {
    const code = document.getElementById('project-code').value.trim().toUpperCase();
    const btn = document.getElementById('join-btn');
    btn.disabled = true;
    btn.textContent = 'Joining...';

    const projectId = await joinByCode(code);
    if (projectId) {
        setStoredCode('');
        setTimeout(() => {
            window.location.href = `dashboard.html?projectId=${projectId}`;
        }, 800);
    } else {
        btn.disabled = false;
        btn.textContent = 'Join Project';
    }
}

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        showLoggedOut();
        return;
    }
    currentUser = user;

    // If a code is pending (from before login/signup), auto-join now
    const pending = getStoredCode() || new URLSearchParams(window.location.search).get('code') || '';
    if (pending) {
        const projectId = await joinByCode(pending);
        if (projectId) {
            setStoredCode('');
            setTimeout(() => {
                window.location.href = `dashboard.html?projectId=${projectId}`;
            }, 800);
            return;
        }
        // Fall through to logged-in screen if join failed
    }

    showLoggedIn();
});

// Wire up listeners (always — they're idempotent)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tab-login').addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-signup').addEventListener('click', () => switchTab('signup'));
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('join-btn').addEventListener('click', handleJoinClick);
    document.getElementById('project-code').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleJoinClick(); }
    });
    document.getElementById('signout-btn').addEventListener('click', async () => {
        await auth.signOut();
        location.reload();
    });

    // Default to login tab
    switchTab('login');
});

console.log('join-project.js loaded');
