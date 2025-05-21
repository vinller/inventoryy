const nodemailer = require("nodemailer");
require("dotenv").config();

async function sendPasswordEmail({ to, name, password }) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const htmlBody = `
  <html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9f9f9;
        margin: 0;
        padding: 0;
      }
      .container {
        margin: 40px auto;
        background-color: #f9f9f9;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      }
      .header {
        background-color: #6C0018;
        color: #ffffff;
        text-align: center;
        padding: 20px;
      }
      .header img {
        max-width: 160px;
        margin-bottom: 10px;
      }
      .content {
        padding: 30px;
        text-align: left;
        color: #000000;
      }
      .content h2 {
        color: #6C0018;
      }
      .info-box {
        background-color: #d9d9d9;
        padding: 15px;
        border-radius: 5px;
        margin: 15px 0;
      }
      .info-box strong {
        display: inline-block;
        width: 100px;
      }
      .login-button {
        display: inline-block;
        margin: 20px 0;
        background-color: #F59701;
        color: #000000;
        padding: 10px 20px;
        text-decoration: none;
        font-weight: bold;
        border-radius: 5px;
      }
      .footer {
        background-color: #6C0018;
        color: #ffffff;
        font-size: 12px;
        padding: 15px;
        text-align: center;
      }
      .footer p:first-of-type {
        color: #F59701;
        font-weight: bold;
        margin-bottom: 4px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://newamericanuniversity.asu.edu/modules/composer/webspark-module-asu_footer/img/ASU-EndorsedLogo.png" alt="ASU Logo">
        <h1>MU/STPV Inventory System</h1>
      </div>
      <div class="content">
        <h2>Welcome, ${name}!</h2>
        <p>We're excited to let you know that your account has been successfully created in the <strong>MU/STPV Inventory System</strong>.</p>
        <p>This system allows you to check in and out inventory, track equipment usage, and monitor overdue items in real time.</p>
        <p>Please use the credentials below to log in and begin using the system:</p>
        <div class="info-box">
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Password:</strong> <code>${password}</code></p>
        </div>
        <a class="login-button" href="http://localhost:3000/" target="_blank">Log In to Your Account</a>
        <p>If you have any issues accessing your account, please reach out to your building manager or system administrator.</p>
      </div>
      <div class="footer">
        <p style="color: #F59701; margin-bottom: 5px; font-weight: bold;">Memorial Union & Student Pavilion Inventory System <br>© Arizona State University</p>
        <p style="margin-top: 5px;">This email was generated and sent by an automated system and is not monitored. Kindly refrain from replying directly to this message.</p>
      </div>
    </div>
  </body>
  </html>
`;

const info = await transporter.sendMail({
  from: `"Inventory Logger" <${process.env.EMAIL_USER}>`,
  to,
  subject: "Welcome to the ASU Inventory Logger",
  html: htmlBody,
});

  return info; // ✅ This is required so auth.js can log info.messageId
}

module.exports = { sendPasswordEmail };
