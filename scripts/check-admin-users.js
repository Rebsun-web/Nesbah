const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function checkAdminUsers() {
    console.log('🔍 Checking admin users...');
    
    const client = await pool.connect();
    
    try {
        // Check if admin_users table exists and get admin users
        const adminUsersQuery = `
            SELECT 
                admin_id,
                username,
                email,
                is_active,
                created_at
            FROM admin_users
            ORDER BY created_at DESC
        `;
        
        const adminUsers = await client.query(adminUsersQuery);
        
        if (adminUsers.rows.length > 0) {
            console.log('\n👤 Existing Admin Users:');
            adminUsers.rows.forEach(admin => {
                console.log(`ID: ${admin.admin_id} | Username: ${admin.username} | Email: ${admin.email} | Active: ${admin.is_active} | Created: ${admin.created_at}`);
            });
        } else {
            console.log('\n⚠️ No admin users found in the database');
            
            // Create a default admin user
            console.log('📝 Creating default admin user...');
            
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const createAdminQuery = `
                INSERT INTO admin_users (username, email, password_hash, is_active, is_super_admin)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING admin_id, username, email
            `;
            
            const newAdmin = await client.query(createAdminQuery, [
                'admin',
                'admin@nesbah.com',
                hashedPassword,
                true,
                true
            ]);
            
            console.log('✅ Created admin user:');
            console.log(`Username: admin`);
            console.log(`Email: admin@nesbah.com`);
            console.log(`Password: admin123`);
            console.log(`ID: ${newAdmin.rows[0].admin_id}`);
        }
        
    } catch (error) {
        console.error('❌ Error checking admin users:', error.message);
        
        if (error.code === '42P01') {
            console.log('💡 admin_users table does not exist. Run the admin migration first.');
        }
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the check
if (require.main === module) {
    checkAdminUsers()
        .then(() => {
            console.log('🎉 Admin users check completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Admin users check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkAdminUsers };
