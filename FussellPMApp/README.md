# Fussell PM - Project Management Application

A full-featured, real-time collaborative project management application with Kanban boards, priority voting, and team collaboration features.

## Features

- 🚀 **Project Creation**: Create projects and invite team members via email
- 👥 **Multi-User Collaboration**: Real-time updates across all team members
- 🗳️ **Priority Voting**: Democratic task prioritization with point-based voting system
- 📊 **8-Stage Kanban Board**: 
  - Not Started
  - Leader Assigned
  - Started No Issue
  - Need Resources
  - Underway
  - Out for Approval
  - Closing
  - Done
- 🔄 **Drag & Drop**: Intuitive task management
- 📧 **Email Notifications**: Automated invitations and project updates
- 🔐 **Authentication**: Username/password-based user accounts

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Hosting**: GitHub Pages (frontend) + Firebase (backend services)
- **Email**: Microsoft 365 SMTP via Firebase Cloud Functions

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new Firebase project
3. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **production mode** (we'll configure rules later)
   - Choose your preferred location

4. Enable **Authentication**:
   - Go to Authentication
   - Click "Get started"
   - Enable **Email/Password** sign-in method

5. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`)
   - Register your app
   - Copy the `firebaseConfig` object

### 2. Configure the Application

1. Open `firebase-config.js`
2. Replace the placeholder values with your Firebase config:

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

### 3. Set Up Firestore Security Rules

Go to Firestore Database → Rules and paste the following:

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

### 4. Set Up Firebase Cloud Functions (for Email)

#### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

#### Initialize Cloud Functions

```bash
cd FussellPMApp
firebase init functions
```

- Select your Firebase project
- Choose JavaScript or TypeScript
- Install dependencies with npm

#### Configure Email Settings

1. Open `functions/index.js` (see the `functions` folder in this repo)
2. Update the email configuration with your Microsoft 365 credentials

#### Set Environment Variables (Secure Method)

```bash
firebase functions:config:set email.user="lyoid@lyoid.net"
firebase functions:config:set email.password="YOUR_APP_PASSWORD"
```

**Important**: For Microsoft 365, you need to create an [App Password](https://support.microsoft.com/en-us/account-billing/manage-app-passwords-for-two-step-verification-d6dc8c6d-4bf7-4851-ad95-6d07799387e9):
- Go to Microsoft Account Security
- Enable 2-factor authentication if not already enabled
- Generate an App Password specifically for this application

#### Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### 5. Deploy to GitHub Pages

1. **Add all files to your GitHub repository**:
```bash
git add .
git commit -m "Initial commit - Fussell PM App"
git push origin main
```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Settings → Pages
   - Source: Deploy from branch
   - Branch: `main`, folder: `/FussellPMApp`
   - Save

3. **Access your app**:
   - URL will be: `https://[your-username].github.io/lyoid.net/FussellPMApp/`

### 6. Configure CORS (if needed)

If you encounter CORS issues, add your GitHub Pages domain to Firebase:

1. Firebase Console → Authentication → Settings
2. Add your domain to "Authorized domains"

## Project Structure

```
FussellPMApp/
├── index.html              # Landing page
├── create-project.html     # Project creation form
├── join-project.html       # Team member join page
├── login.html              # Login page
├── dashboard.html          # User dashboard
├── kanban.html             # Kanban board
├── styles.css              # All styles
├── firebase-config.js      # Firebase configuration
├── create-project.js       # Project creation logic
├── join-project.js         # Join project logic
├── auth.js                 # Authentication utilities
├── dashboard.js            # Dashboard logic
├── kanban.js               # Kanban board logic
├── README.md               # This file
└── functions/              # Firebase Cloud Functions
    ├── index.js            # Email notification functions
    └── package.json        # Dependencies
```

## User Workflows

### Creating a New Project

1. Click "Start New Project" on landing page
2. Fill in project title and description
3. Add initial to-do items (optional)
4. Enter team member email addresses
5. Click "Create Project & Send Invitations"
6. Team members receive invitation emails with project code

### Joining a Project

1. Click link in invitation email (or manually enter project code)
2. Create account (username, email, password) or login
3. Access project dashboard

### Priority Voting

1. Project creator clicks "Launch Project for Voting"
2. All team members receive notification email
3. Each member assigns 20 points across all tasks
4. Creator finalizes voting when ready
5. Tasks are prioritized and Kanban board is populated

### Using Kanban Board

1. Drag and drop tasks between columns
2. Click task to view/edit details
3. Assign tasks to team members
4. Track progress through 8 workflow stages
5. Changes sync in real-time to all users

## Database Schema

### Users Collection

```javascript
{
  username: "string",
  email: "string",
  createdAt: timestamp,
  projects: ["projectId1", "projectId2"]
}
```

### Projects Collection

```javascript
{
  title: "string",
  description: "string",
  code: "string (6-char unique code)",
  creatorId: "userId",
  createdAt: timestamp,
  status: "setup|voting|active",
  teamMembers: ["email1@example.com"],
  members: {
    userId: {
      username: "string",
      email: "string",
      joinedAt: timestamp,
      role: "creator|member"
    }
  },
  todos: [{
    id: number,
    text: "string",
    description: "string",
    createdBy: "string",
    priority: number,
    status: "not-started|leader-assigned|...|done",
    assignedTo: "username"
  }],
  votes: {
    userId: {
      0: 5,  // task index: points
      1: 10,
      2: 5
    }
  }
}
```

## Customization

### Adding More Kanban Columns

Edit `kanban.js` - modify the `columns` array:

```javascript
const columns = [
    { id: 'custom-status', title: 'Custom Status' },
    // ... add more
];
```

### Changing Vote Point Allocation

Edit `dashboard.js` - change the initial points:

```javascript
let pointsRemaining = 20;  // Change to desired amount
```

### Styling Customization

All styles are in `styles.css`. Key CSS variables to customize:

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #7c3aed;
    --success-color: #10b981;
    /* ... modify colors */
}
```

## Troubleshooting

### Email Not Sending

- Verify Microsoft 365 App Password is correct
- Check Firebase Functions logs: `firebase functions:log`
- Ensure SMTP port 587 is not blocked

### Real-time Updates Not Working

- Check Firestore security rules
- Verify Firebase initialization in each JS file
- Check browser console for errors

### Authentication Issues

- Verify Email/Password is enabled in Firebase Auth
- Check that user document is created in Firestore
- Clear browser cache and try again

## Future Enhancements

- [ ] Task comments and discussions
- [ ] File attachments
- [ ] Time tracking
- [ ] Project templates
- [ ] Advanced reporting and analytics
- [ ] Mobile app
- [ ] Calendar integration
- [ ] Notifications system

## License

© 2026 Fussell PM. All rights reserved.

## Support

For issues or questions, please contact: lyoid@lyoid.net
