const { exec } = require('child_process');

console.log('🚨 KILLING POSTGRESQL CONNECTIONS DIRECTLY...\n');

async function killPostgresConnections() {
    try {
        // Kill all connections except the postgres superuser
        console.log('🛑 Terminating all PostgreSQL connections...');
        
        const killCommand = `PGPASSWORD='Riyadh123!@#' psql -h 34.166.77.134 -U postgres -d postgres -c "
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = 'postgres' 
            AND pid <> pg_backend_pid() 
            AND usename != 'postgres';
        "`;
        
        exec(killCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Error killing connections:', error.message);
            } else {
                console.log('✅ PostgreSQL connections terminated');
                console.log('Output:', stdout);
            }
            
            // Now kill Next.js processes
            console.log('\n🛑 Killing Next.js processes...');
            exec('pkill -f "next"', (error) => {
                if (error) {
                    console.log('No Next.js processes found');
                } else {
                    console.log('✅ Next.js processes killed');
                }
                
                // Wait and restart
                setTimeout(() => {
                    console.log('\n🚀 Starting fresh Next.js server...');
                    exec('npm run dev', {
                        cwd: process.cwd(),
                        stdio: 'inherit'
                    });
                }, 2000);
            });
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the connection killer
killPostgresConnections();
