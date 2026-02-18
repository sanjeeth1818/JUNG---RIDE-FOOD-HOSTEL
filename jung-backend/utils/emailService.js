require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const commonStyles = `
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
    .content { padding: 40px 30px; }
    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #764ba2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .highlight { color: #764ba2; font-weight: bold; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; color: white; margin-bottom: 20px; }
    .status-approved { background-color: #28a745; }
    .status-rejected { background-color: #dc3545; }
    .status-pending { background-color: #ffc107; color: #333; }
`;

const createTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>${commonStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
        </div>
        <div class="content">
            ${bodyContent}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Jung App. All rights reserved.</p>
            <p>This is an automated message, please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
`;

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"Jung App Team" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendRegistrationEmail = async (email, name) => {
    const html = createTemplate('Welcome to Jung App!', `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>Thank you for registering with <strong>Jung App</strong>. We are thrilled to have you on board!</p>
        <p>Your account has been successfully created. You can now explore all the features we offer.</p>
        <center><span class="status-badge status-pending">Registration Successful</span></center>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <center><a href="#" class="btn">Get Started</a></center>
    `);
    return sendEmail(email, 'Welcome to Jung App - Registration Successful', html);
};

const sendPartnerRegistrationEmail = async (email, name) => {
    const html = createTemplate('Partner Registration Received', `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>Thanks for signing up as a partner with <strong>Jung App</strong>.</p>
        <p>Your application is currently <strong>PENDING approval</strong>. Our team will review your details and documents shortly.</p>
        <center><span class="status-badge status-pending">Status: Pending Review</span></center>
        <p>You will receive another email once your account status changes.</p>
    `);
    return sendEmail(email, 'Jung App - Partner Registration Received', html);
};

const sendApprovalEmail = async (email, name, role) => {
    const html = createTemplate('Account Approved!', `
        <p>Congratulations <span class="highlight">${name}</span>!</p>
        <p>Your <strong>${role}</strong> account has been approved by our administration team.</p>
        <center><span class="status-badge status-approved">Status: Active</span></center>
        <p>You can now log in and start using the platform.</p>
        <center><a href="#" class="btn">Login Now</a></center>
    `);
    return sendEmail(email, 'Jung App - Account Approved', html);
};

const sendRejectionEmail = async (email, name, role) => {
    const html = createTemplate('Account Status Update', `
        <p>Hi <span class="highlight">${name}</span>,</p>
        <p>We regret to inform you that your <strong>${role}</strong> application has been declined at this time.</p>
        <center><span class="status-badge status-rejected">Status: Rejected</span></center>
        <p>This may be due to incomplete documentation or not meeting our current requirements.</p>
        <p>Please contact support for more details.</p>
    `);
    return sendEmail(email, 'Jung App - Account Status Update', html);
};

module.exports = {
    sendRegistrationEmail,
    sendPartnerRegistrationEmail,
    sendApprovalEmail,
    sendRejectionEmail
};
