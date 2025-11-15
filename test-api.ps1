# Script de Prueba para Verificar el API (PowerShell)
# Uso: .\test-api.ps1 https://tu-api-production.up.railway.app

param(
    [string]$ApiUrl = "http://localhost:3001"
)

Write-Host "🧪 Testing API at: $ApiUrl" -ForegroundColor Cyan
Write-Host ""

# Función para probar endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = $null,
        [string]$Description,
        [string]$CookieFile = $null
    )
    
    Write-Host -NoNewline "Testing $Description... "
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    $uri = "$ApiUrl$Endpoint"
    
    try {
        if ($Method -eq "GET") {
            if ($CookieFile) {
                $response = Invoke-WebRequest -Uri $uri -Method GET -Headers $headers -WebSession (Import-Clixml $CookieFile) -ErrorAction Stop
            } else {
                $response = Invoke-WebRequest -Uri $uri -Method GET -Headers $headers -ErrorAction Stop
            }
        }
        elseif ($Method -eq "POST") {
            $body = $Data | ConvertFrom-Json | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body -ErrorAction Stop
        }
        elseif ($Method -eq "PATCH") {
            $body = $Data | ConvertFrom-Json | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $uri -Method PATCH -Headers $headers -Body $body -WebSession (Import-Clixml $CookieFile) -ErrorAction Stop
        }
        
        $statusCode = $response.StatusCode
        
        if ($statusCode -ge 200 -and $statusCode -lt 300) {
            Write-Host "✅ OK (HTTP $statusCode)" -ForegroundColor Green
            return $true
        }
        elseif ($statusCode -ge 400 -and $statusCode -lt 500) {
            Write-Host "⚠️  Client Error (HTTP $statusCode)" -ForegroundColor Yellow
            Write-Host "   Response: $($response.Content)" -ForegroundColor Yellow
            return $false
        }
        else {
            Write-Host "❌ Server Error (HTTP $statusCode)" -ForegroundColor Red
            Write-Host "   Response: $($response.Content)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ Error (HTTP $statusCode)" -ForegroundColor Red
        Write-Host "   Message: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 1. Probar endpoint de Insurers
Write-Host "📋 Testing Insurers Endpoints" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/insurers" -Description "GET /insurers"
Write-Host ""

# 2. Probar endpoint de Plans
Write-Host "💼 Testing Plans Endpoints" -ForegroundColor Cyan
Test-Endpoint -Method "GET" -Endpoint "/plans" -Description "GET /plans"
Write-Host ""

# 3. Probar registro de usuario
Write-Host "🔐 Testing Auth Endpoints" -ForegroundColor Cyan
$registerData = @{
    email = "test@example.com"
    password = "test123456"
    name = "Test User"
} | ConvertTo-Json

Test-Endpoint -Method "POST" -Endpoint "/auth/register" -Data $registerData -Description "POST /auth/register"

# Login y guardar cookies
$loginData = @{
    email = "test@example.com"
    password = "test123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$ApiUrl/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginData -SessionVariable session
    $session | Export-Clixml -Path "cookies.txt"
    Test-Endpoint -Method "GET" -Endpoint "/auth/me" -Description "GET /auth/me (with auth)" -CookieFile "cookies.txt"
}
catch {
    Write-Host "⚠️  Could not test /auth/me (login may have failed)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Probar creación de Lead
Write-Host "📝 Testing Leads Endpoints" -ForegroundColor Cyan
$leadData = @{
    name = "Juan Pérez"
    email = "juan@example.com"
    phone = "+56912345678"
    region = "Metropolitana"
} | ConvertTo-Json

Test-Endpoint -Method "POST" -Endpoint "/leads" -Data $leadData -Description "POST /leads"
Write-Host ""

# 5. Resumen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "If all tests passed, your API is working correctly!" -ForegroundColor Green
Write-Host "Check VERIFICACION_COMPLETA.md for detailed verification steps." -ForegroundColor Yellow

