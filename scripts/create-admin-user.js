const pool = require('../src/lib/db.cjs');
const bcrypt = require('bcrypt');

async function createAdminUser() {
    const client = await pool.connect();
    
    try {
        console.log('🔐 Creating admin user...');
        
        // Hash the password
        const passwordHash = await bcrypt.hash('admin123', 12);
        
        // Insert admin user
        const result = await client.query(`
            INSERT INTO admin_users (email, password_hash, full_name, role, permissions, is_active) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            ON CONFLICT (email) DO UPDATE SET 
                password_hash = $2, 
                full_name = $3, 
                role = $4, 
                permissions = $5, 
                is_active = $6
            RETURNING admin_id, email, full_name, role
        `, [
            'admin@nesbah.com',
            passwordHash,
            'System Administrator',
            'super_admin',
            JSON.stringify({all_permissions: true}),
            true
        ]);
        
        console.log('✅ Admin user created/updated successfully:');
        console.log('📧 Email:', result.rows[0].email);
        console.log('👤 Name:', result.rows[0].full_name);
        console.log('🔑 Role:', result.rows[0].role);
        console.log('🔑 Password: admin123');
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

createAdminUser();
