const crypto = require('crypto');

function generateJWTSecret() {
    console.log('🔐 Generating Secure JWT Secret...\n');
    
    // Generate a secure random string of 64 characters
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    
    console.log('✅ Generated JWT Secret:');
    console.log('='.repeat(80));
    console.log(jwtSecret);
    console.log('='.repeat(80));
    
    console.log('\n📝 Instructions:');
    console.log('1. Copy the JWT secret above');
    console.log('2. Add it to your .env file:');
    console.log(`   JWT_SECRET=${jwtSecret}`);
    console.log('3. Add it to your production environment variables');
    console.log('4. Keep this secret secure and never commit it to version control');
    
    console.log('\n⚠️  Security Notes:');
    console.log('- This secret should be at least 64 characters long');
    console.log('- Store it securely in environment variables');
    console.log('- Rotate this secret periodically in production');
    console.log('- Never use the default secret in production');
    
    console.log('\n🔧 Environment Variables to Set:');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log('JWT_EXPIRES_IN=8h');
    console.log('JWT_REFRESH_EXPIRES_IN=7d');
    console.log('JWT_ISSUER=nesbah-app');
    console.log('JWT_AUDIENCE=nesbah-users');
    
    return jwtSecret;
}

function generateMFASecret() {
    console.log('\n🔐 Generating Secure MFA Secret...\n');
    
    // Generate a secure random string of 32 characters
    const mfaSecret = crypto.randomBytes(32).toString('hex');
    
    console.log('✅ Generated MFA Secret:');
    console.log('='.repeat(80));
    console.log(mfaSecret);
    console.log('='.repeat(80));
    
    console.log('\n📝 Instructions:');
    console.log('1. Copy the MFA secret above');
    console.log('2. Add it to your .env file:');
    console.log(`   MFA_SECRET=${mfaSecret}`);
    
    return mfaSecret;
}

function generateAllSecrets() {
    console.log('🚀 Generating All Security Secrets...\n');
    
    const jwtSecret = generateJWTSecret();
    const mfaSecret = generateMFASecret();
    
    console.log('\n📋 Complete .env Configuration:');
    console.log('='.repeat(80));
    console.log('# Security Configuration');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log(`MFA_SECRET=${mfaSecret}`);
    console.log('JWT_EXPIRES_IN=8h');
    console.log('JWT_REFRESH_EXPIRES_IN=7d');
    console.log('JWT_ISSUER=nesbah-app');
    console.log('JWT_AUDIENCE=nesbah-users');
    console.log('='.repeat(80));
    
    console.log('\n✅ All secrets generated successfully!');
    console.log('💡 Remember to update your environment variables with these secrets.');
}

if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--mfa-only')) {
        generateMFASecret();
    } else if (args.includes('--jwt-only')) {
        generateJWTSecret();
    } else {
        generateAllSecrets();
    }
}

module.exports = { 
    generateJWTSecret, 
    generateMFASecret, 
    generateAllSecrets 
};
