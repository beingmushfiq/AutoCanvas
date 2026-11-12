<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password — AutoCanvas</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #090d16;
      padding: 32px 32px 28px;
      text-align: left;
      border-bottom: 2px solid #f59e0b;
    }
    .brand-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0;
      display: inline-block;
    }
    .brand-badge {
      display: inline-block;
      margin-left: 8px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      padding: 2px 8px;
      border-radius: 9999px;
      vertical-align: middle;
    }
    .content {
      padding: 36px 32px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.3px;
    }
    p {
      font-size: 14px;
      color: #334155;
      margin: 0 0 16px;
    }
    .notice-box {
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 14px 18px;
      margin: 20px 0;
      font-size: 13px;
      color: #92400e;
    }
    .cta-container {
      margin: 32px 0 24px;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 13px 30px;
      border-radius: 10px;
      letter-spacing: 0.2px;
      box-shadow: 0 2px 4px rgba(15, 23, 42, 0.15);
    }
    .break-url {
      font-size: 11px;
      color: #94a3b8;
      word-break: break-all;
      margin-top: 16px;
    }
    .footer {
      padding: 24px 32px;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }
    .footer p {
      font-size: 11px;
      color: #94a3b8;
      margin: 0 0 6px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="brand-title">AutoCanvas</span>
        <span class="brand-badge">Account Security</span>
      </div>
      <div class="content">
        <h1>Password Recovery Request</h1>
        <p>Hello {{ $user->name }},</p>
        <p>We received a request to reset the password for your AutoCanvas account associated with <strong>{{ $user->email }}</strong>.</p>
        
        <div class="notice-box">
          This secure password reset link will expire in <strong>{{ $expireMinutes }} minutes</strong>.
        </div>

        <div class="cta-container">
          <a href="{{ $resetUrl }}" class="cta-button" target="_blank">Reset AutoCanvas Password &rarr;</a>
        </div>

        <p class="break-url">
          If the button above does not work, copy and paste this link into your web browser:<br>
          <a href="{{ $resetUrl }}" style="color: #64748b;">{{ $resetUrl }}</a>
        </p>

        <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
          <strong>Didn't request this?</strong> If you did not initiate this password reset request, you can safely ignore this email. Your existing credentials remain completely secure and unchanged.
        </p>
      </div>
      <div class="footer">
        <p>&copy; {{ date('Y') }} AutoCanvas. All rights reserved.</p>
        <p>Need help? Contact support desk at hello@devcenterpoint.com.</p>
      </div>
    </div>
  </div>
</body>
</html>

