const { exec } = require('child_process');
const { Pool } = require('pg');

console.log('🚨 FORCE CLEARING ALL DATABASE CONNECTIONS...\n');

// Create a minimal pool to check and clear connections
const tempPool = new Pool({
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
});

async function forceClearConnections() {
    try {
        console.log('🔍 Checking current connection status...');
        
        // Try to connect and get connection info
        const client = await tempPool.connect();
        console.log('✅ Connected to database');
        
        // Get all active connections
        const result = await client.query(`
            SELECT 
                pid,
                usename,
                application_name,
                client_addr,
                state,
                query_start,
                backend_start
            FROM pg_stat_activity 
            WHERE datname = 'postgres'
            AND state != 'idle'
            ORDER BY backend_start DESC
        `);
        
        console.log(`📊 Found ${result.rows.length} active connections:`);
        result.rows.forEach(row => {
            console.log(`   PID ${row.pid}: ${row.application_name || 'unknown'} (${row.state})`);
        });
        
        client.release();
        await tempPool.end();
        
        // Kill all Next.js processes
        console.log('\n🛑 Killing all Next.js processes...');
        await new Promise((resolve) => {
            exec('pkill -f "next"', (error) => {
                if (error) {
                    console.log('No Next.js processes found to kill');
                } else {
                    console.log('✅ Killed Next.js processes');
                }
                resolve();
            });
        });
        
        // Wait for processes to fully terminate
        console.log('⏳ Waiting for processes to terminate...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Kill any remaining Node.js processes (be careful!)
        console.log('🛑 Killing any remaining Node.js processes...');
        await new Promise((resolve) => {
            exec('pkill -f "node.*Nesbah"', (error) => {
                if (error) {
                    console.log('No additional Node.js processes found');
                } else {
                    console.log('✅ Killed additional Node.js processes');
                }
                resolve();
            });
        });
        
        // Wait again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Start fresh Next.js server
        console.log('\n🚀 Starting fresh Next.js development server...');
        const child = exec('npm run dev', {
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        
        child.on('error', (error) => {
            console.error('❌ Error starting Next.js server:', error.message);
        });
        
        child.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Next.js server exited with code ${code}`);
            }
        });
        
        // Give it time to start
        setTimeout(() => {
            console.log('\n✅ Fresh Next.js server should be running');
            console.log('🔄 All connections have been cleared and server restarted');
            console.log('📊 The new server will create fresh database connections as needed');
        }, 5000);
        
    } catch (error) {
        console.error('❌ Error during force clear:', error.message);
        
        // Even if there's an error, try to restart the server
        console.log('\n🔄 Attempting to restart server anyway...');
        exec('npm run dev', {
            cwd: process.cwd(),
            stdio: 'inherit'
        });
    }
}

// Run the force clear
forceClearConnections();
