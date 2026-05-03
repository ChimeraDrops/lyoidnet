# Fussell PM - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Firebase Setup (5 min)

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** and **Authentication (Email/Password)**
3. Copy your Firebase config from Project Settings

### Step 2: Configure App (1 min)

1. Open `firebase-config.js`
2. Paste your Firebase config:
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

### Step 3: Test Locally

Open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

Navigate to `http://localhost:8000`

### Step 4: Deploy to GitHub Pages (2 min)

```bash
git add .
git commit -m "Add Fussell PM"
git push origin main
```

Enable GitHub Pages in your repo settings!

---

## 📧 Email Setup (Optional - for Production)

### Quick Setup

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```

2. Initialize functions:
```bash
firebase init functions
```

3. Set email credentials:
```bash
firebase functions:config:set email.user="lyoid@lyoid.net"
firebase functions:config:set email.password="YOUR_APP_PASSWORD"
```

4. Update `functions/index.js` with your GitHub Pages URL (line 30)

5. Deploy:
```bash
firebase deploy --only functions
```

### Get Microsoft 365 App Password

1. Go to [account.microsoft.com/security](https://account.microsoft.com/security)
2. Enable two-step verification
3. Create App Password
4. Use in Firebase config above

---

## 🎯 Usage

### For Project Creators:

1. Click "Start New Project"
2. Fill in details and add team emails
3. Submit - emails sent automatically!
4. When ready, click "Launch Project for Voting"
5. After everyone votes, click "Finalize Voting"
6. Manage your Kanban board!

### For Team Members:

1. Check your email for invitation
2. Click link or enter project code
3. Create account
4. Vote when notified (20 points to distribute)
5. Collaborate on Kanban board!

---

## 🔧 Troubleshooting

**Can't see real-time updates?**
- Check browser console for errors
- Verify Firebase config is correct
- Make sure Firestore rules are set

**Email not working?**
- This is optional for testing
- You can manually share project codes
- Set up Cloud Functions for production

**Authentication failing?**
- Enable Email/Password in Firebase Auth
- Check Firebase config
- Clear browser cache

---

## 📚 Full Documentation

See `README.md` for complete documentation including:
- Detailed setup instructions
- Database schema
- Security rules
- Customization options
- Advanced features

---

## 💡 Pro Tips

1. **Test with 2 browser windows** - open in regular + incognito to simulate multiple users
2. **Use project codes** - Email setup is optional, you can share codes manually
3. **Real-time sync** - Changes appear instantly for all users
4. **Mobile friendly** - Works on phones and tablets

---

## 🎉 You're Ready!

Start creating projects and collaborating with your team!

**Questions?** Contact: lyoid@lyoid.net
