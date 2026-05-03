# Firebase Functions Setup

This folder contains Firebase Cloud Functions for sending email notifications.

## Installation

1. Make sure you have Node.js installed (v18 or higher)
2. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

3. Install dependencies:
   ```bash
   cd functions
   npm install
   ```

## Configuration

### Set Email Credentials (Secure Method)

Use Firebase CLI to set environment variables:

```bash
firebase functions:config:set email.user="lyoid@lyoid.net"
firebase functions:config:set email.password="YOUR_APP_PASSWORD"
```

### Microsoft 365 App Password

To get an App Password for Microsoft 365:

1. Go to https://account.microsoft.com/security
2. Under "Security info", select "Advanced security options"
3. Enable two-step verification if not already enabled
4. Under "App passwords", select "Create a new app password"
5. Copy the generated password (it will only be shown once)
6. Use this password in the Firebase config above

## Testing Locally

Run the functions emulator:

```bash
firebase emulators:start --only functions
```

## Deployment

Deploy to Firebase:

```bash
firebase deploy --only functions
```

Or deploy a specific function:

```bash
firebase deploy --only functions:sendProjectInvitations
```

## Functions

### sendProjectInvitations
Sends invitation emails to team members when a project is created.

**Parameters:**
- `projectId`: Project ID
- `projectCode`: 6-character project code
- `projectTitle`: Project title
- `teamEmails`: Array of email addresses
- `creatorEmail`: Email of project creator

### sendVotingNotification
Sends notification when project enters voting phase.

**Parameters:**
- `projectId`: Project ID
- `projectTitle`: Project title

### sendTestEmail
Sends a test email to verify configuration.

**Parameters:** None

## Logs

View function logs:

```bash
firebase functions:log
```

## Troubleshooting

### Error: Invalid login credentials
- Verify your Microsoft 365 App Password is correct
- Make sure two-step verification is enabled
- Regenerate App Password if needed

### Error: Connection timeout
- Check that port 587 is not blocked by firewall
- Verify SMTP settings are correct

### Error: Quota exceeded
- Check Firebase billing plan limits
- Free plan: 125K function invocations/month
- Consider upgrading to Blaze plan for production use
