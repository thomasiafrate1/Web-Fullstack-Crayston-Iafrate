# Test Campaign Workflow Script
# Usage: ./test-campaigns.ps1

Write-Host "🔧 Campaign Testing Script" -ForegroundColor Cyan
Write-Host "=" * 60

# Check environment variables
Write-Host "`n1️⃣ Checking environment variables..."

$required_vars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY"
)

$missing_vars = @()
foreach ($var in $required_vars) {
    $value = [System.Environment]::GetEnvironmentVariable($var)
    if ($value) {
        $masked = $value.Substring(0, [Math]::Min(10, $value.Length)) + "..."
        Write-Host "   ✅ $var = $masked" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $var missing" -ForegroundColor Red
        $missing_vars += $var
    }
}

if ($missing_vars.Count -gt 0) {
    Write-Host "`n   Set missing variables and try again" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is available
Write-Host "`n2️⃣ Checking Node.js..."
$node_version = node --version
if ($node_version) {
    Write-Host "   ✅ Node.js $node_version detected" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found" -ForegroundColor Red
    exit 1
}

# Check if supabase CLI is available
Write-Host "`n3️⃣ Checking Supabase CLI..."
$supabase_version = supabase --version 2>$null
if ($supabase_version) {
    Write-Host "   ✅ $supabase_version" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Supabase CLI not found (optional)" -ForegroundColor Yellow
}

# Option menu
Write-Host "`n4️⃣ Select test option:"
Write-Host "   1. Run automated test script"
Write-Host "   2. Check Supabase function status"
Write-Host "   3. View recent audit logs"
Write-Host "   4. Test Resend API connection"
Write-Host "   5. View campaign statistics"

$choice = Read-Host "`nEnter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "`n▶️  Running automated test script..."
        Write-Host "=" * 60
        node test-campaign.mjs
    }
    
    "2" {
        Write-Host "`n▶️  Checking function status..."
        Write-Host "=" * 60
        if ($supabase_version) {
            supabase functions list
        } else {
            Write-Host "Supabase CLI not available" -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host "`n▶️  View recent audit logs (requires psql)..."
        Write-Host "=" * 60
        Write-Host "Execute this SQL in your Supabase SQL editor:"
        Write-Host @"
SELECT 
  action,
  entity_type,
  entity_id,
  metadata,
  created_at
FROM audit_logs
WHERE action LIKE '%campaign%'
ORDER BY created_at DESC
LIMIT 20;
"@ -ForegroundColor Cyan
    }
    
    "4" {
        Write-Host "`n▶️  Testing Resend API connection..."
        Write-Host "=" * 60
        $resend_key = [System.Environment]::GetEnvironmentVariable("RESEND_API_KEY")
        if (-not $resend_key) {
            Write-Host "RESEND_API_KEY not set" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Sending test email via Resend..."
        $response = curl.exe -s -X POST "https://api.resend.com/emails" `
            -H "Authorization: Bearer $resend_key" `
            -H "Content-Type: application/json" `
            -d '{
                "from": "onboarding@resend.dev",
                "to": "delivered@resend.dev",
                "subject": "Campaign System Test",
                "html": "<p>Test email from campaign system</p>"
            }'
        
        Write-Host $response | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
    
    "5" {
        Write-Host "`n▶️  Campaign Statistics..."
        Write-Host "=" * 60
        Write-Host "Execute this SQL in your Supabase SQL editor:"
        Write-Host @"
-- Campaign counts by status
SELECT 
  status,
  COUNT(*) as count
FROM campaigns
GROUP BY status;

-- Recipient delivery stats
SELECT 
  status,
  COUNT(*) as count
FROM campaign_recipients
GROUP BY status;

-- Recent campaigns
SELECT 
  c.name,
  c.status,
  COUNT(r.id) as recipient_count,
  c.created_at
FROM campaigns c
LEFT JOIN campaign_recipients r ON c.id = r.campaign_id
GROUP BY c.id, c.name, c.status, c.created_at
ORDER BY c.created_at DESC
LIMIT 10;
"@ -ForegroundColor Cyan
    }
    
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
    }
}

Write-Host "`n" + "=" * 60
Write-Host "Test completed" -ForegroundColor Green
