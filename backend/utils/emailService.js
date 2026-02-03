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
          <!--[if mso]>
          <style type="text/css">
            body, table, td {font-family: Arial, sans-serif !important;}
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #0A050F; font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0A050F; background: linear-gradient(180deg, #0D0814 0%, #0A050F 100%);">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
                  <!-- Main Card -->
                  <tr>
                    <td style="background-color: #15101F; border: 1px solid #2A2233; border-radius: 16px; padding: 40px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);">
                      <!-- Header -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding-bottom: 30px;">
                            <h1 style="margin: 0; color: #F5F3F9; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; line-height: 1.2;">
                              Email Verification
                            </h1>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Greeting -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #F5F3F9; font-size: 16px; line-height: 1.6;">
                              Hello ${fullName || 'there'},
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 30px;">
                            <p style="margin: 0; color: #F5F3F9; font-size: 16px; line-height: 1.6;">
                              Thank you for signing up! Please use the following code to verify your email address:
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Verification Code Box -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 30px;">
                            <div style="background: linear-gradient(135deg, #9D5AE8 0%, #D99FF5 100%); border: 2px solid #9D5AE8; border-radius: 16px; padding: 30px 20px; text-align: center; box-shadow: 0 0 40px rgba(157, 90, 232, 0.3);">
                              <h2 style="margin: 0; color: #F5F3F9; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', 'Monaco', monospace; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">
                                ${code}
                              </h2>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Info Text -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding-bottom: 15px;">
                            <p style="margin: 0; color: #B8B0C4; font-size: 14px; line-height: 1.6;">
                              This code will expire in 10 minutes.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 30px;">
                            <p style="margin: 0; color: #B8B0C4; font-size: 14px; line-height: 1.6;">
                              If you didn't create an account, please ignore this email.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Divider -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding-bottom: 30px;">
                            <div style="border-top: 1px solid #2A2233; height: 1px; width: 100%;"></div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Footer -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td>
                            <p style="margin: 0; color: #B8B0C4; font-size: 12px; line-height: 1.5;">
                              This is an automated message, please do not reply.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Spacer -->
                  <tr>
                    <td style="height: 40px;"></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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

