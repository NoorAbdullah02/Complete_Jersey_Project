"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.orderConfirmationHtml = orderConfirmationHtml;
exports.orderConfirmationText = orderConfirmationText;
exports.adminNotificationHtml = adminNotificationHtml;
exports.paymentConfirmationHtml = paymentConfirmationHtml;
exports.adminVerificationHtml = adminVerificationHtml;
const node_fetch_1 = __importDefault(require("node-fetch"));
async function sendEmail(to, subject, htmlContent, textContent) {
    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_FROM_EMAIL;
    const fromName = process.env.BREVO_FROM_NAME || 'ICE Jersey';
    if (!apiKey) {
        console.error('Email Error: BREVO_API_KEY is not configured in .env');
        return { success: false };
    }
    if (!fromEmail) {
        console.error('Email Error: BREVO_FROM_EMAIL is not configured in .env');
        return { success: false };
    }
    try {
        console.log(`Email Service: Attempting to send email to ${to} with subject: ${subject}`);
        const response = await (0, node_fetch_1.default)('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'api-key': apiKey,
            },
            body: JSON.stringify({
                sender: {
                    name: fromName,
                    email: fromEmail,
                },
                to: [{ email: to }],
                subject,
                htmlContent,
                textContent,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Email Error: Brevo API returned error ${response.status}: ${response.statusText}`, errorText);
            return { success: false };
        }
        console.log(`Email Service: Successfully sent email to ${to} (Status: ${response.status})`);
        return { success: true };
    }
    catch (error) {
        console.error('Email Error: Failed to send email:', error.message);
        if (error.cause)
            console.error('Caused by:', error.cause);
        return { success: false };
    }
}
function orderConfirmationHtml(order) {
    const itemsHtml = (order.items || []).map((item) => `
        <div style="border-bottom: 1px dashed #eee; padding: 10px 0;">
            <p style="margin: 0; color: #333;"><strong>Jersey #${item.jerseyNumber || item.jersey_number}</strong> (${item.size})</p>
            <p style="margin: 0; font-size: 0.85rem; color: #666;">
                Name: ${item.jerseyName || item.jersey_name || 'N/A'} | 
                Type: ${item.collarType || item.collar_type}/${item.sleeveType || item.sleeve_type}
            </p>
        </div>
    `).join('');
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Order Received!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 5px 0;">ICE Department Jersey Registration</p>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Hello ${order.name}!</h2>
        <p style="color: #555; line-height: 1.6;">Thank you for your order. We've received your registration details and will verify your payment shortly.</p>
        
        <div style="background: #f8faff; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #eef2ff;">
          <h3 style="color: #667eea; margin-top: 0; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 5px; display: inline-block;">Order Summary:</h3>
          <div style="margin: 15px 0;">
            ${itemsHtml}
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; color: #444;">
            <tr><td style="padding: 5px 0;"><strong>Order ID:</strong></td><td style="text-align: right;">ICE-${String(order.id).padStart(3, '0')}</td></tr>
            <tr><td style="padding: 5px 0;"><strong>Mobile:</strong></td><td style="text-align: right;">${order.mobile_number || order.mobileNumber}</td></tr>
            ${order.transaction_id || order.transactionId ? `<tr><td style="padding: 5px 0;"><strong>TxID:</strong></td><td style="text-align: right;">${order.transaction_id || order.transactionId}</td></tr>` : ''}
            <tr style="font-size: 18px; color: #667eea;"><td style="padding: 15px 0 5px 0;"><strong>Total Price:</strong></td><td style="text-align: right; padding: 15px 0 5px 0;"><strong>৳${order.final_price || order.finalPrice}</strong></td></tr>
          </table>
        </div>

        <div style="background: #fff8eb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Note:</strong> Verification can take up to 24 hours. You'll receive another email once your payment is confirmed.</p>
        </div>

        <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">
          If you have any questions, contact our coordinators:<br>
          <strong>Aldrik</strong> (01850685667) | <strong>Munna</strong> (01637964859)
        </p>
      </div>
      <div style="background: #f1f5f9; color: #64748b; text-align: center; padding: 15px; font-size: 11px;">
        &copy; 2025 Department of Information & Communication Engineering. All rights reserved.
      </div>
    </div>
  `;
}
function orderConfirmationText(order) {
    const itemsText = (order.items || []).map((item) => `- Jersey #${item.jerseyNumber || item.jersey_number} (${item.size}) | Name: ${item.jerseyName || item.jersey_name || 'N/A'}`).join('\n');
    return `
ICE Jersey Order Confirmation

Hello ${order.name}!

Your order (ICE-${String(order.id).padStart(3, '0')}) has been received successfully.

Order Details:
${itemsText}

Total Price: ৳${order.final_price || order.finalPrice}
Status: Pending Verification

Contact: Aldrik (01850685667) | Munna (01637964859)
  `;
}
function adminNotificationHtml(order) {
    const itemsHtml = (order.items || []).map((item) => `<li><strong>#${item.jerseyNumber || item.jersey_number}</strong> (${item.size}) - ${item.jerseyName || item.jersey_name || 'N/A'}</li>`).join('');
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dc3545; border-radius: 8px; overflow: hidden;">
      <div style="background: #dc3545; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">NEW ORDER RECEIVED</h1>
      </div>
      <div style="padding: 20px; background: #fff;">
        <h2 style="color: #333; margin-top: 0;">Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="background: #f8f9fa;"><td style="padding: 8px;"><strong>Customer:</strong></td><td style="padding: 8px;">${order.name}</td></tr>
          <tr><td style="padding: 8px;"><strong>Mobile:</strong></td><td style="padding: 8px;">${order.mobile_number || order.mobileNumber}</td></tr>
          <tr style="background: #f8f9fa;"><td style="padding: 8px;"><strong>Email:</strong></td><td style="padding: 8px;">${order.email}</td></tr>
          <tr><td style="padding: 8px;"><strong>Total Price:</strong></td><td style="padding: 8px;">৳${order.final_price || order.finalPrice}</td></tr>
          ${order.transaction_id || order.transactionId ? `<tr style="background: #f8f9fa;"><td style="padding: 8px;"><strong>TxID:</strong></td><td style="padding: 8px;">${order.transaction_id || order.transactionId}</td></tr>` : ''}
        </table>
        
        <h3 style="color: #dc3545; border-bottom: 2px solid #dc3545; padding-bottom: 5px; margin-top: 20px;">Items:</h3>
        <ul style="padding-left: 20px; color: #444;">
          ${itemsHtml}
        </ul>
        
        ${order.notes ? `<div style="background: #fff5f5; padding: 10px; border-radius: 5px; margin-top: 15px; border: 1px solid #feb2b2;"><p style="margin: 0; font-size: 13px;"><strong>Notes:</strong> ${order.notes}</p></div>` : ''}
      </div>
    </div>
  `;
}
function paymentConfirmationHtml(order) {
    const itemsHtml = (order.items || []).map((item) => `<li style="margin-bottom: 5px;"><strong>#${item.jerseyNumber || item.jersey_number}</strong> (${item.size})</li>`).join('');
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #10b981; border-radius: 10px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmed!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 5px 0;">Your order is now in production</p>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Great news, ${order.name}!</h2>
        <p style="color: #555; line-height: 1.6;">Your payment has been successfully verified. We've started processing your jersey order.</p>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #d1fae5;">
          <h3 style="color: #059669; margin-top: 0; font-size: 18px;">Order Details:</h3>
          <p style="margin: 5px 0; color: #064e3b;"><strong>Order ID:</strong> ICE-${String(order.id).padStart(3, '0')}</p>
          <ul style="margin: 10px 0; padding-left: 20px; color: #064e3b;">
            ${itemsHtml}
          </ul>
          <p style="margin: 5px 0; color: #059669;"><strong>Status:</strong> Confirmed & Processing</p>
        </div>

        <p style="color: #555; font-size: 14px;"><strong>Timeline:</strong> Manufacturing takes 7-10 business days. We will notify you once it's ready for pickup.</p>
      </div>
      <div style="background: #f1f5f9; color: #64748b; text-align: center; padding: 15px; font-size: 11px;">
        &copy; 2025 Department of Information & Communication Engineering. All rights reserved.
      </div>
    </div>
  `;
}
function adminVerificationHtml(name, verifyUrl) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Verify Your Email</h1>
      </div>
      <div style="padding: 20px; background: #f8f9fa;">
        <h2 style="color: #333;">Hello ${name}!</h2>
        <p>Please verify your email to activate your admin account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: 700;">Verify Email</a>
        </div>
        <p style="font-size: 0.85rem; color: #666;">If the button doesn't work, copy and paste this link: ${verifyUrl}</p>
      </div>
    </div>
  `;
}
//# sourceMappingURL=email.js.map