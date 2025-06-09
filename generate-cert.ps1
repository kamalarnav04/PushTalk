# PowerShell script to generate self-signed SSL certificates for HTTPS support
# This enables microphone access from network devices

Write-Host "🔒 Generating SSL certificates for HTTPS support..." -ForegroundColor Green

# Check if OpenSSL is available
try {
    $opensslVersion = openssl version 2>$null
    if ($opensslVersion) {
        Write-Host "✅ OpenSSL found: $opensslVersion" -ForegroundColor Green
        
        # Generate private key and certificate
        Write-Host "🔑 Generating private key..." -ForegroundColor Yellow
        openssl genpkey -algorithm RSA -out server/key.pem -pkcs8 -pass pass: 2>$null
        
        Write-Host "📜 Generating self-signed certificate..." -ForegroundColor Yellow
        openssl req -new -x509 -key server/key.pem -out server/cert.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>$null
        
        if (Test-Path "server/key.pem" -and Test-Path "server/cert.pem") {
            Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
            Write-Host "📁 Files created:" -ForegroundColor Cyan
            Write-Host "   - server/key.pem (private key)" -ForegroundColor Gray
            Write-Host "   - server/cert.pem (certificate)" -ForegroundColor Gray
            Write-Host ""
            Write-Host "🚀 Now restart the server to use HTTPS:" -ForegroundColor Green
            Write-Host "   npm start" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "⚠️  Note: You'll need to accept the security warning in your browser" -ForegroundColor Yellow
            Write-Host "   (this is normal for self-signed certificates)" -ForegroundColor Gray
        } else {
            Write-Host "❌ Failed to generate certificates" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ OpenSSL not found or failed to run" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Installation options:" -ForegroundColor Yellow
    Write-Host "1. Install Git for Windows (includes OpenSSL):" -ForegroundColor Gray
    Write-Host "   https://git-scm.com/download/win" -ForegroundColor Blue
    Write-Host ""
    Write-Host "2. Install OpenSSL for Windows:" -ForegroundColor Gray
    Write-Host "   https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Blue
    Write-Host ""
    Write-Host "3. Use Chocolatey:" -ForegroundColor Gray
    Write-Host "   choco install openssl" -ForegroundColor Blue
    Write-Host ""
    Write-Host "4. Alternative: Use Node.js to generate certificates" -ForegroundColor Gray
    Write-Host "   node generate-cert.js" -ForegroundColor Blue
}
