/**
 * Node.js script to generate self-signed SSL certificates
 * Alternative method when OpenSSL is not available
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Generating SSL certificates using Node.js...');

try {
    // Try using the selfsigned package if available
    let selfsigned;
    try {
        selfsigned = require('selfsigned');
    } catch (error) {
        console.log('📦 Installing selfsigned package...');
        execSync('npm install selfsigned --save-dev', { stdio: 'inherit' });
        selfsigned = require('selfsigned');
    }
    
    // Generate certificate
    console.log('🔑 Generating certificate...');
    const attrs = [
        { name: 'countryName', value: 'US' },
        { name: 'stateOrProvinceName', value: 'State' },
        { name: 'localityName', value: 'City' },
        { name: 'organizationName', value: 'Walkie-Talkie App' },
        { name: 'commonName', value: 'localhost' }
    ];
    
    const options = {
        keySize: 2048,
        days: 365,
        algorithm: 'sha256',
        extensions: [
            {
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: 'localhost' },
                    { type: 2, value: '127.0.0.1' },
                    { type: 7, ip: '127.0.0.1' }
                ]
            }
        ]
    };
    
    const pems = selfsigned.generate(attrs, options);
    
    // Create server directory if it doesn't exist
    const serverDir = path.join(__dirname, 'server');
    if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir);
    }
    
    // Write certificate files
    fs.writeFileSync(path.join(serverDir, 'key.pem'), pems.private);
    fs.writeFileSync(path.join(serverDir, 'cert.pem'), pems.cert);
    
    console.log('✅ SSL certificates generated successfully!');
    console.log('📁 Files created:');
    console.log('   - server/key.pem (private key)');
    console.log('   - server/cert.pem (certificate)');
    console.log('');
    console.log('🚀 Now restart the server to use HTTPS:');
    console.log('   npm start');
    console.log('');
    console.log('⚠️  Note: You\'ll need to accept the security warning in your browser');
    console.log('   (this is normal for self-signed certificates)');
    
} catch (error) {
    console.error('❌ Failed to generate certificates:', error.message);
    console.log('');
    console.log('🔧 Alternative: Use OpenSSL manually:');
    console.log('   openssl req -x509 -newkey rsa:4096 -keyout server/key.pem -out server/cert.pem -days 365 -nodes');
}
