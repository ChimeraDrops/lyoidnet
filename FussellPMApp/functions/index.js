const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp();

// Email configuration using Microsoft 365
// For security, these values should be set using Firebase CLI:
// firebase functions:config:set email.user="lyoid@lyoid.net" email.password="YOUR_APP_PASSWORD"

const emailConfig = {
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: functions.config().email?.user || 'lyoid@lyoid.net',
        pass: functions.config().email?.password || 'YOUR_APP_PASSWORD'
    },
    tls: {
        ciphers: 'SSLv3'
    }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send project invitation emails to team members
 */
exports.sendProjectInvitations = functions.https.onCall(async (data, context) => {
    const { projectId, projectCode, projectTitle, teamEmails, creatorEmail } = data;
    
    // Validate input
    if (!projectId || !projectCode || !projectTitle || !teamEmails || !Array.isArray(teamEmails)) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    // Base URL - update this with your actual GitHub Pages URL
    const baseUrl = 'https://lyoid.github.io/lyoid.net/FussellPMApp';
    const joinUrl = `${baseUrl}/join-project.html?code=${projectCode}`;
    
    // Send email to each team member
    const emailPromises = teamEmails.map(async (email) => {
        const mailOptions = {
            from: `"Fussell PM" <${emailConfig.auth.user}>`,
            to: email,
            subject: `🚀 You've been invited to join: ${projectTitle}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                 color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                        .button { display: inline-block; background: #2563eb; color: white; 
                                 padding: 15px 30px; text-decoration: none; border-radius: 6px; 
                                 font-weight: 600; margin: 20px 0; }
                        .code-box { background: white; padding: 15px; border-radius: 6px; 
                                   text-align: center; font-size: 24px; font-weight: bold; 
                                   letter-spacing: 3px; color: #2563eb; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Project Invitation</h1>
                        </div>
                        <div class="content">
                            <h2>You've been invited to join a project!</h2>
                            
                            <p><strong>Project:</strong> ${projectTitle}</p>
                            <p>You've been invited to collaborate on this project in Fussell PM.</p>
                            
                            <h3>Your Project Code:</h3>
                            <div class="code-box">${projectCode}</div>
                            
                            <p>Click the button below to join the project:</p>
                            <div style="text-align: center;">
                                <a href="${joinUrl}" class="button">Join Project Now</a>
                            </div>
                            
                            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                                Or copy and paste this link in your browser:<br>
                                <a href="${joinUrl}">${joinUrl}</a>
                            </p>
                            
                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                            
                            <h3>Next Steps:</h3>
                            <ol>
                                <li>Click the link above or enter the project code manually</li>
                                <li>Create your account or login if you already have one</li>
                                <li>Start collaborating with your team!</li>
                            </ol>
                        </div>
                        <div class="footer">
                            <p>© 2026 Fussell PM. All rights reserved.</p>
                            <p>This invitation was sent by ${creatorEmail}</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Invitation sent to: ${email}`);
            return { email, success: true };
        } catch (error) {
            console.error(`Failed to send to ${email}:`, error);
            return { email, success: false, error: error.message };
        }
    });
    
    const results = await Promise.all(emailPromises);
    
    return {
        success: true,
        results: results,
        message: 'Invitations sent'
    };
});

/**
 * Send voting notification when project is launched
 */
exports.sendVotingNotification = functions.https.onCall(async (data, context) => {
    const { projectId, projectTitle } = data;
    
    if (!projectId || !projectTitle) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    // Get project data
    const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Project not found');
    }
    
    const project = projectDoc.data();
    const members = project.members || {};
    
    // Base URL
    const baseUrl = 'https://lyoid.github.io/lyoid.net/FussellPMApp';
    const dashboardUrl = `${baseUrl}/dashboard.html?projectId=${projectId}`;
    
    // Send email to each team member
    const emailPromises = Object.values(members).map(async (member) => {
        const mailOptions = {
            from: `"Fussell PM" <${emailConfig.auth.user}>`,
            to: member.email,
            subject: `🗳️ Time to Vote: ${projectTitle}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                 color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                        .button { display: inline-block; background: #2563eb; color: white; 
                                 padding: 15px 30px; text-decoration: none; border-radius: 6px; 
                                 font-weight: 600; margin: 20px 0; }
                        .alert-box { background: #dbeafe; border-left: 4px solid #2563eb; 
                                    padding: 15px; border-radius: 6px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🗳️ Priority Voting Started!</h1>
                        </div>
                        <div class="content">
                            <h2>Hi ${member.username},</h2>
                            
                            <p>The project "<strong>${projectTitle}</strong>" has been launched and is ready for priority voting!</p>
                            
                            <div class="alert-box">
                                <strong>Your mission:</strong> You have 20 points to assign across all project tasks. 
                                Use these points to indicate which tasks you think are most important.
                            </div>
                            
                            <h3>How it works:</h3>
                            <ul>
                                <li>You have a total of 20 points to distribute</li>
                                <li>Assign points to each task based on its priority</li>
                                <li>More points = higher priority</li>
                                <li>Once everyone votes, tasks will be prioritized on the Kanban board</li>
                            </ul>
                            
                            <div style="text-align: center;">
                                <a href="${dashboardUrl}" class="button">Vote Now</a>
                            </div>
                            
                            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                                Or copy and paste this link in your browser:<br>
                                <a href="${dashboardUrl}">${dashboardUrl}</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2026 Fussell PM. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Voting notification sent to: ${member.email}`);
            return { email: member.email, success: true };
        } catch (error) {
            console.error(`Failed to send to ${member.email}:`, error);
            return { email: member.email, success: false, error: error.message };
        }
    });
    
    const results = await Promise.all(emailPromises);
    
    return {
        success: true,
        results: results,
        message: 'Voting notifications sent'
    };
});

/**
 * Test email function
 */
exports.sendTestEmail = functions.https.onCall(async (data, context) => {
    const mailOptions = {
        from: `"Fussell PM" <${emailConfig.auth.user}>`,
        to: 'lyoid@lyoid.net',
        subject: 'Test Email from Fussell PM',
        html: '<h1>Test Email</h1><p>If you receive this, email configuration is working!</p>'
    };
    
    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
        console.error('Error sending test email:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
