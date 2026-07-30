// const sgMail = require('@sendgrid/mail');

// // Set API Key
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// // ============ SEND EMAIL FUNCTION ============
// const sendEmail = async ({ to, subject, html }) => {
//     try {
//         const msg = {
//             to: to || process.env.ADMIN_EMAIL, // Send to admin by default
//             from: {
//                 email: process.env.SENDGRID_FROM_EMAIL || "ahsaanmajeed57@gmail.com",
//                 name: 'Amb AutoWorkshop'
//             },
//             subject,
//             html,
//         };

//         await sgMail.send(msg);
//         console.log('✅ Email sent successfully');
//         return { success: true };
//     } catch (error) {
//         console.log('❌ Email sending failed:', error.response?.body || error.message);
//         return { success: false, error: error.message };
//     }
// };

// // ============ SEND REGISTRATION REQUEST TO ADMIN ============
// const sendRegistrationRequestEmail = async (userData) => {
//     const { name, email, phone, address, role } = userData;

//     const html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <style>
//             body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
//             .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
//             .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
//             .header h1 { color: #2563eb; margin: 0; }
//             .content { padding: 20px 0; }
//             .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
//             .info-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
//             .info-table .label { font-weight: bold; color: #4b5563; }
//             .info-table .value { color: #1f2937; }
//             .status-pending { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 14px; }
//             .btn { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 5px; }
//             .btn-reject { background: #dc2626; }
//             .footer { text-align: center; padding-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
//         </style>
//     </head>
//     <body>
//         <div class="container">
//             <div class="header">
//                 <h1>🚗 AMB - AutoWorkshop</h1>
//                 <p style="color: #6b7280;">Staff Registration Request</p>
//             </div>
            
//             <div class="content">
//                 <p>Hello Admin,</p>
//                 <p>A new staff member has registered and is waiting for your approval.</p>
                
//                 <table class="info-table">
//                     <tr>
//                         <td class="label">Name:</td>
//                         <td class="value">${name}</td>
//                     </tr>
//                     <tr>
//                         <td class="label">Email:</td>
//                         <td class="value">${email}</td>
//                     </tr>
//                     <tr>
//                         <td class="label">Phone:</td>
//                         <td class="value">${phone}</td>
//                     </tr>
//                     <tr>
//                         <td class="label">Address:</td>
//                         <td class="value">${address || 'N/A'}</td>
//                     </tr>
//                     <tr>
//                         <td class="label">Role:</td>
//                         <td class="value">${role === 0 ? 'Staff' : 'Admin'}</td>
//                     </tr>
//                     <tr>
//                         <td class="label">Status:</td>
//                         <td class="value"><span class="status-pending">⏳ Pending Approval</span></td>
//                     </tr>
//                 </table>
                
//                 <p style="margin-top: 20px;">
//                     Please review the registration and approve or reject it from the admin panel.
//                 </p>
                
//                 <div style="text-align: center; margin-top: 25px;">
//                     <a href="http://localhost:3000/admin/users" class="btn">Go to Admin Panel</a>
//                 </div>
//             </div>
            
//             <div class="footer">
//                 <p>This is an automated message from AutoWorkshop.</p>
//                 <p>&copy; 2024 AutoWorkshop. All rights reserved.</p>
//             </div>
//         </div>
//     </body>
//     </html>
//     `;

//     return await sendEmail({
//         subject: "📋 New Staff Registration - Pending Approval",
//         html
//     });
// };

// // ============ SEND APPROVAL EMAIL TO USER ============
// const sendApprovalEmail = async (email, name) => {
//     const html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <style>
//             body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
//             .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
//             .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; }
//             .header h1 { color: #16a34a; margin: 0; }
//             .content { padding: 20px 0; text-align: center; }
//             .success-icon { font-size: 60px; color: #16a34a; }
//             .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
//             .footer { text-align: center; padding-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
//         </style>
//     </head>
//     <body>
//         <div class="container">
//             <div class="header">
//                 <h1>✅ Registration Approved</h1>
//             </div>
//             <div class="content">
//                 <div class="success-icon">✅</div>
//                 <h2>Congratulations ${name}!</h2>
//                 <p>Your account has been approved by the admin.</p>
//                 <p>You can now login to AutoWorkshop.</p>
//                 <br>
//                 <a href="http://localhost:3000/login" class="btn">Login Now</a>
//             </div>
//             <div class="footer">
//                 <p>&copy; 2024 AutoWorkshop. All rights reserved.</p>
//             </div>
//         </div>
//     </body>
//     </html>
//     `;

//     return await sendEmail({
//         to: email,
//         subject: "✅ Account Approved - AMB - AutoWorkshop",
//         html
//     });
// };

// // ============ SEND REJECTION EMAIL TO USER ============
// const sendRejectionEmail = async (email, name, reason) => {
//     const html = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//         <style>
//             body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
//             .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
//             .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 20px; }
//             .header h1 { color: #dc2626; margin: 0; }
//             .content { padding: 20px 0; text-align: center; }
//             .error-icon { font-size: 60px; color: #dc2626; }
//             .reason-box { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626; }
//             .footer { text-align: center; padding-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
//         </style>
//     </head>
//     <body>
//         <div class="container">
//             <div class="header">
//                 <h1>❌ Registration Rejected</h1>
//             </div>
//             <div class="content">
//                 <div class="error-icon">❌</div>
//                 <h2>Dear ${name},</h2>
//                 <p>We regret to inform you that your registration request has been rejected.</p>
                
//                 ${reason ? `
//                 <div class="reason-box">
//                     <strong>Reason:</strong><br>
//                     ${reason}
//                 </div>
//                 ` : ''}
                
//                 <p>If you have any questions, please contact the admin.</p>
//             </div>
//             <div class="footer">
//                 <p>&copy; 2024 AutoWorkshop. All rights reserved.</p>
//             </div>
//         </div>
//     </body>
//     </html>
//     `;

//     return await sendEmail({
//         to: email,
//         subject: "❌ Registration Rejected - AutoWorkshop",
//         html
//     });
// };

// module.exports = {
//     sendEmail,
//     sendRegistrationRequestEmail,
//     sendApprovalEmail,
//     sendRejectionEmail
// };