<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AutoCanvas</title>
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
    .card-meta {
      background-color: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 20px;
      margin: 24px 0;
    }
    .meta-row {
      font-size: 13px;
      margin-bottom: 8px;
      display: flex;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      font-weight: 600;
      color: #64748b;
      width: 140px;
    }
    .meta-value {
      color: #0f172a;
      font-weight: 500;
    }
    .cta-container {
      margin: 32px 0 20px;
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
        <span class="brand-badge">Sovereign Studio</span>
      </div>
      <div class="content">
        <h1>Welcome aboard, {{ $user->name }}!</h1>
        <p>Your AutoCanvas autonomous creative workspace has been successfully provisioned and initialized on the sovereign platform.</p>
        
        <div class="card-meta">
          <div class="meta-row">
            <span class="meta-label">Primary Account:</span>
            <span class="meta-value">{{ $user->email }}</span>
          </div>
          @if($organization)
          <div class="meta-row">
            <span class="meta-label">Organization:</span>
            <span class="meta-value">{{ $organization->name }}</span>
          </div>
          @endif
          @if($workspace)
          <div class="meta-row">
            <span class="meta-label">Default Workspace:</span>
            <span class="meta-value">{{ $workspace->name }}</span>
          </div>
          @endif
          <div class="meta-row">
            <span class="meta-label">Plan Tier:</span>
            <span class="meta-value">Autonomous Starter (14-Day Free Access)</span>
          </div>
        </div>

        <p>You can now generate automated content, deploy multi-channel brand campaigns, review scheduled social drops, and track performance analytics directly from your command center.</p>

        <div class="cta-container">
          <a href="{{ $appUrl }}/workspace/overview" class="cta-button" target="_blank">Launch AutoCanvas Workspace &rarr;</a>
        </div>
      </div>
      <div class="footer">
        <p>&copy; {{ date('Y') }} AutoCanvas. All rights reserved.</p>
        <p>If you did not create this account, please contact our support desk at hello@devcenterpoint.com.</p>
      </div>
    </div>
  </div>
</body>
</html>

