// Join Project Logic
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

async function joinProject() {
    const codeInput = document.getElementById('project-code');
    const code = codeInput.value.trim().toUpperCase();
    if (!code) {
        showAlert('Please enter a project code', 'error');
        return;
    }

    const btn = document.getElementById('join-btn');
    btn.disabled = true;
    btn.textContent = 'Joining...';

    try {
        const snap = await db.collection('projects').where('code', '==', code).limit(1).get();
        if (snap.empty) {
            showAlert('Invalid project code. Please check and try again.', 'error');
            btn.disabled = false;
            btn.textContent = 'Join Project';
            return;
        }

        const doc = snap.docs[0];
        const project = doc.data();

        // If already a member or creator, just go to it
        if (project.creatorId === currentUser.uid || (project.teamMembers || []).includes(currentUser.email)) {
            showAlert('You are already a member of this project!', 'success');
            setTimeout(() => {
                window.location.href = `dashboard.html?projectId=${doc.id}`;
            }, 1000);
            return;
        }

        // Add user email to teamMembers
        await db.collection('projects').doc(doc.id).update({
            teamMembers: firebase.firestore.FieldValue.arrayUnion(currentUser.email)
        });

        showAlert(`Joined "${project.title}"!`, 'success');
        setTimeout(() => {
            window.location.href = `dashboard.html?projectId=${doc.id}`;
        }, 1000);
    } catch (err) {
        console.error('Error joining project:', err);
        showAlert('Error joining project: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Join Project';
    }
}

auth.onAuthStateChanged((user) => {
    if (!user) {
        const code = new URLSearchParams(window.location.search).get('code') || '';
        window.location.href = 'login.html?redirect=join-project.html' + (code ? '%3Fcode%3D' + code : '');
        return;
    }
    currentUser = user;
    document.getElementById('auth-loading').classList.add('hidden');
    document.getElementById('user-email-display').textContent = user.email;
    document.getElementById('join-form').style.display = 'block';

    document.getElementById('join-btn').addEventListener('click', joinProject);
    document.getElementById('project-code').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); joinProject(); }
    });

    // Auto-fill code from URL if provided
    const codeFromUrl = new URLSearchParams(window.location.search).get('code');
    if (codeFromUrl) {
        document.getElementById('project-code').value = codeFromUrl.toUpperCase();
    }
});

console.log('join-project.js loaded');
