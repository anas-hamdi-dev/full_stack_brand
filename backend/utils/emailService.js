const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
let apiInstance;
if (process.env.BREVO_API_KEY) {
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

/**
 * Send email verification code via Brevo
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit verification code
 * @param {string} fullName - User's full name
 * @returns {Promise<Object>} Brevo API response
 */
async function sendVerificationEmail(email, code, fullName) {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || 'Brands App';

    if (!senderEmail) {
      throw new Error('BREVO_SENDER_EMAIL environment variable is not set');
    }

    if (!apiInstance) {
      apiInstance = new brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    }

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = 'Verify your email';
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #2c3e50; margin-top: 0;">Email Verification</h1>
            <p>Hello ${fullName || 'there'},</p>
            <p>Thank you for signing up! Please use the following code to verify your email address:</p>
            <div style="background-color: #ffffff; border: 2px solid #3498db; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #3498db; font-size: 32px; letter-spacing: 5px; margin: 0; font-family: 'Courier New', monospace;">${code}</h2>
            </div>
            <p style="color: #7f8c8d; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #7f8c8d; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
            <p style="color: #95a5a6; font-size: 12px; margin: 0;">This is an automated message, please do not reply.</p>
          </div>
        </body>
      </html>
    `;
    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email, name: fullName || email }];

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending verification email via Brevo:', error);
    throw new Error(`Failed to send verification email: ${error.message || 'Unknown error'}`);
  }
}

module.exports = {
  sendVerificationEmail
};

