// Authentication Logic
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Check authentication state
export function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                resolve(user);
            } else {
                reject(new Error('Not authenticated'));
            }
        });
    });
}

// Login function
export async function login(username, password) {
    try {
        // Find user by username
        const userQuery = await db.collection('users')
            .where('username', '==', username)
            .limit(1)
            .get();
        
        if (userQuery.empty) {
            throw new Error('Username not found');
        }
        
        const userData = userQuery.docs[0].data();
        const email = userData.email;
        
        // Sign in with email and password
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
        return userCredential.user;
    } catch (error) {
        showAlert(`Login failed: ${error.message}`, 'error');
        throw error;
    }
}

// Logout function
export async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Get current user data
export async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    const userDoc = await db.collection('users').doc(user.uid).get();
    return userDoc.data();
}

// Show alert (utility function)
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
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
