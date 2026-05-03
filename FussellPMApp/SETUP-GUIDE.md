# Complete Setup Guide - Fussell PM on GitHub Pages

This guide will walk you through setting up Firebase and deploying to GitHub Pages step-by-step.

---

## Part 1: Create Firebase Project (10 minutes)

### Step 1: Go to Firebase Console

1. Open your browser and go to: **https://console.firebase.google.com/**
2. Sign in with your Google account (or create one if needed)
3. Click the **"Create a project"** button (or **"Add project"**)

### Step 2: Create Your Project

1. **Project name**: Type `fussell-pm` (or any name you want)
2. Click **Continue**
3. **Google Analytics**: You can disable this for now (toggle it OFF)
4. Click **Create project**
5. Wait 30 seconds for it to create
6. Click **Continue** when it says "Your new project is ready"

---

## Part 2: Enable Firestore Database (2 minutes)

### Step 1: Create Firestore Database

1. In the left sidebar, expand **"Databases & Storage"** (or look for **"Build"** in older UI) → Click **"Firestore Database"**
2. Click **"Create database"**
3. **Secure rules for Cloud Firestore**:
   - Select **"Start in production mode"** (we'll fix rules next)
   - Click **Next**
4. **Cloud Firestore location**:
   - Choose a region close to you (e.g., `us-east1`, `us-central1`, `europe-west1`)
   - Click **Enable**
5. Wait for it to provision (takes about 30 seconds)

### Step 2: Set Up Security Rules

1. Once Firestore is ready, click the **"Rules"** tab at the top
2. You'll see the default rules. **Replace everything** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"** at the top right
4. Click **"Publish"** again to confirm

---

## Part 3: Enable Authentication (1 minute)

### Step 1: Turn On Email/Password Auth

1. In the left sidebar, expand **"Security"** (or look for **"Build"** in older UI) → Click **"Authentication"**
2. Click **"Get started"**
3. Click the **"Sign-in method"** tab at the top
4. Find **"Email/Password"** in the list and click on it
5. Toggle **"Enable"** to ON (the first toggle, not "Email link")
6. Click **"Save"**

---

## Part 4: Get Your Firebase Configuration (2 minutes)

### Step 1: Register Your Web App

1. Click the **gear icon** (⚙️) next to "Project Overview" in the left sidebar
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section (bottom of the page)
4. Click the **`</>`** icon (Web platform) to add a web app
5. **Register app**:
   - **App nickname**: Type `Fussell PM Web`
   - **Firebase Hosting**: Leave UNCHECKED (we're using GitHub Pages)
   - Click **"Register app"**

### Step 2: Copy Your Configuration

1. You'll see a code block that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "fussell-pm.firebaseapp.com",
  projectId: "fussell-pm",
  storageBucket: "fussell-pm.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123..."
};
```

2. **Copy JUST the firebaseConfig object** (everything inside the curly braces `{ }`)
3. Click **"Continue to console"**

### Step 3: Update Your Code

1. Open your project folder: `FussellPMApp`
2. Open the file: **`firebase-config.js`**
3. Find this section:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

4. **Replace it** with your copied config from Firebase
5. **Save the file**

**Example of what it should look like:**

```javascript
// Firebase Configuration
// Replace these values with your Firebase project credentials

const firebaseConfig = {
    apiKey: "AIzaSyC-9tqPB4lXhEq2XLlPlqvKdRR3mmXPDWE",
    authDomain: "fussell-pm.firebaseapp.com",
    projectId: "fussell-pm",
    storageBucket: "fussell-pm.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};

// Initialize Firebase
// This will be loaded via CDN in HTML files
// Uncomment when Firebase SDK is loaded:
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();
// const auth = firebase.auth();

export default firebaseConfig;
```

---

## Part 5: Deploy to GitHub Pages (5 minutes)

### Step 1: Commit Your Changes

1. Open **Command Prompt** or **PowerShell**
2. Navigate to your project:
   ```powershell
   cd "C:\Users\lyoid\OneDrive\Documents\_PERSONAL\Resume Work\lyoid.net"
   ```

3. Add your files:
   ```powershell
   git add FussellPMApp/
   ```

4. Commit:
   ```powershell
   git commit -m "Add Fussell PM app with Firebase config"
   ```

5. Push to GitHub:
   ```powershell
   git push origin main
   ```

### Step 2: Enable GitHub Pages

1. Go to your GitHub repository in your browser
2. Click **"Settings"** tab (top right)
3. In the left sidebar, click **"Pages"**
4. Under **"Source"**:
   - Select **"Deploy from a branch"**
   - Branch: Select **"main"**
   - Folder: Select **"/ (root)"**
5. Click **"Save"**
6. Wait 1-2 minutes for it to deploy

### Step 3: Update Firebase Authorized Domains

1. **Get your GitHub Pages URL**:
   - It will be: `https://[your-username].github.io`
   - Look at the top of the Pages settings page - it will show your URL

2. **Add it to Firebase**:
   - Go back to Firebase Console
   - Click **"Authentication"** in sidebar
   - Click **"Settings"** tab at the top
   - Scroll to **"Authorized domains"**
   - Click **"Add domain"**
   - Type: `[your-username].github.io` (replace with your actual username)
   - Click **"Add"**

---

## Part 6: Test Your App! (2 minutes)

1. Go to: `https://[your-username].github.io/lyoid.net/FussellPMApp/`
2. Open **DevTools** (press F12)
3. Go to **Console** tab
4. You should see: `"Firebase initialized successfully"`
5. Try creating a project!

---

## Troubleshooting

### "Firebase not configured" message
- Make sure you saved `firebase-config.js` with your real config
- Hard refresh the page (Ctrl + Shift + R)
- Check browser console for errors

### "Permission denied" when creating project
- Make sure you published the Firestore security rules
- Make sure Authentication is enabled

### Page shows 404 on GitHub Pages
- Wait 2-3 minutes after enabling Pages
- Make sure you committed and pushed your files
- Check the GitHub Pages settings shows "Your site is live at..."

### Email notifications not working
- This is normal! Email requires Cloud Functions setup (advanced)
- See `functions/README.md` for email setup
- The app works fine without emails - just share project codes manually

---

## Next Steps (Optional)

### To Set Up Email Notifications:

See the file `functions/README.md` for instructions on:
- Installing Firebase CLI
- Setting up Cloud Functions
- Configuring your Microsoft 365 email
- Deploying email notifications

**Note**: Email is optional. The core app works perfectly without it - you just share project codes manually instead of via email.

---

## Summary

✅ **What You Have Now:**
- Firebase backend (database + authentication)
- App deployed on GitHub Pages
- Real-time collaboration working
- Full Kanban board functionality

✅ **What Works:**
- Creating projects
- Joining projects with codes
- User accounts and login
- Adding and voting on tasks
- Real-time Kanban board
- Drag-and-drop task management

⏳ **What's Optional:**
- Email invitations (requires Cloud Functions setup)

---

## Questions?

If something doesn't work:
1. Check the browser console (F12) for error messages
2. Verify your `firebase-config.js` has real values (not "YOUR_API_KEY")
3. Make sure Firestore rules are published
4. Try logging out and back in to Firebase Console

Your app should now be fully functional! 🎉
