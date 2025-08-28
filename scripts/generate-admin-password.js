const bcrypt = require('bcrypt');

async function generatePasswordHash() {
    const password = 'admin123'; // Default password - CHANGE THIS IN PRODUCTION
    const saltRounds = 12;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Password:', password);
        console.log('Hash:', hash);
        console.log('\n⚠️  IMPORTANT: Change this password immediately in production!');
    } catch (error) {
        console.error('Error generating password hash:', error);
    }
}

generatePasswordHash();
