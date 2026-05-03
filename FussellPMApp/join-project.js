// Join Project Page Logic
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentProjectId = null;
let currentProjectData = null;

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

// Verify project code
window.verifyCode = async function() {
    const code = document.getElementById('project-code').value.trim().toUpperCase();
    
    if (!code) {
        showAlert('Please enter a project code', 'error');
        return;
    }
    
    document.getElementById('loading-message').textContent = 'Verifying project code...';
    document.getElementById('code-step').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    try {
        // Query for project with this code
        const projectQuery = await db.collection('projects')
            .where('code', '==', code)
            .limit(1)
            .get();
        
        if (projectQuery.empty) {
            showAlert('Invalid project code. Please check and try again.', 'error');
            document.getElementById('code-step').classList.remove('hidden');
            document.getElementById('loading').classList.add('hidden');
            return;
        }
        
        // Get project data
        const projectDoc = projectQuery.docs[0];
        currentProjectId = projectDoc.id;
        currentProjectData = projectDoc.data();
        
        // Show project info
        document.getElementById('project-info').innerHTML = `
            <div class="alert alert-info">
                <strong>Project:</strong> ${currentProjectData.title}<br>
                <strong>Description:</strong> ${currentProjectData.description}
            </div>
        `;
        
        // Show auth step
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('auth-step').classList.remove('hidden');
        
    } catch (error) {
        console.error('Error verifying code:', error);
        showAlert(`Error: ${error.message}`, 'error');
        document.getElementById('code-step').classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
};

// Show create account form
window.showCreateAccount = function() {
    document.getElementById('create-account-form').classList.remove('hidden');
    document.getElementById('existing-login-form').classList.add('hidden');
    document.getElementById('create-account-btn').classList.add('btn-primary');
    document.getElementById('create-account-btn').classList.remove('btn-secondary');
    document.getElementById('existing-login-btn').classList.remove('btn-primary');
    document.getElementById('existing-login-btn').classList.add('btn-secondary');
};

// Show existing login form
window.showExistingLogin = function() {
    document.getElementById('create-account-form').classList.add('hidden');
    document.getElementById('existing-login-form').classList.remove('hidden');
    document.getElementById('create-account-btn').classList.remove('btn-primary');
    document.getElementById('create-account-btn').classList.add('btn-secondary');
    document.getElementById('existing-login-btn').classList.add('btn-primary');
    document.getElementById('existing-login-btn').classList.remove('btn-secondary');
};

// Handle create account
document.getElementById('create-account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('new-username').value.trim();
    const email = document.getElementById('new-email').value.trim();
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    document.getElementById('loading-message').textContent = 'Creating account...';
    document.getElementById('auth-step').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    try {
        // Create user in Firebase Auth using email
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            projects: [currentProjectId]
        });
        
        // Add user to project's team members
        await db.collection('projects').doc(currentProjectId).update({
            [`members.${user.uid}`]: {
                username: username,
                email: email,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'member'
            }
        });
        
        showAlert('Account created successfully!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = `dashboard.html?projectId=${currentProjectId}`;
        }, 1500);
        
    } catch (error) {
        console.error('Error creating account:', error);
        showAlert(`Error: ${error.message}`, 'error');
        document.getElementById('auth-step').classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
});

// Handle existing login
document.getElementById('existing-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('existing-username').value.trim();
    const password = document.getElementById('existing-password').value;
    
    document.getElementById('loading-message').textContent = 'Logging in...';
    document.getElementById('auth-step').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');
    
    try {
        // Find user by username
        const userQuery = await db.collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();
        
        if (userQuery.empty) {
            showAlert('Username not found', 'error');
            document.getElementById('auth-step').classList.remove('hidden');
            document.getElementById('loading').classList.add('hidden');
            return;
        }
        
        const userData = userQuery.docs[0].data();
        const email = userData.email;
        
        // Sign in with email and password
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Add project to user's projects if not already there
        if (!userData.projects || !userData.projects.includes(currentProjectId)) {
            await db.collection('users').doc(user.uid).update({
                projects: firebase.firestore.FieldValue.arrayUnion(currentProjectId)
            });
        }
        
        // Add user to project's team members if not already there
        await db.collection('projects').doc(currentProjectId).update({
            [`members.${user.uid}`]: {
                username: userData.username,
                email: userData.email,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'member'
            }
        });
        
        showAlert('Login successful!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = `dashboard.html?projectId=${currentProjectId}`;
        }, 1500);
        
    } catch (error) {
        console.error('Error logging in:', error);
        showAlert(`Error: ${error.message}`, 'error');
        document.getElementById('auth-step').classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
});

// Check if there's a project code in URL (from email link)
const urlParams = new URLSearchParams(window.location.search);
const codeFromUrl = urlParams.get('code');
if (codeFromUrl) {
    document.getElementById('project-code').value = codeFromUrl;
    verifyCode();
}
