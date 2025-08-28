const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Resetting database connection pool...\n');

// Check if there's a running Next.js process
function findNextProcess() {
    return new Promise((resolve) => {
        exec('ps aux | grep "next" | grep -v grep', (error, stdout) => {
            if (error || !stdout.trim()) {
                resolve(null);
            } else {
                const lines = stdout.trim().split('\n');
                const processes = lines.map(line => {
                    const parts = line.split(/\s+/);
                    return {
                        pid: parts[1],
                        command: parts.slice(10).join(' ')
                    };
                });
                resolve(processes);
            }
        });
    });
}

// Kill Next.js processes
function killNextProcesses(processes) {
    return new Promise((resolve) => {
        if (!processes || processes.length === 0) {
            console.log('ℹ️  No running Next.js processes found');
            resolve();
            return;
        }

        console.log(`🔍 Found ${processes.length} Next.js process(es):`);
        processes.forEach(proc => {
            console.log(`   PID ${proc.pid}: ${proc.command}`);
        });

        const pids = processes.map(proc => proc.pid);
        const killCommand = `kill -9 ${pids.join(' ')}`;
        
        console.log(`\n🛑 Killing processes: ${killCommand}`);
        exec(killCommand, (error) => {
            if (error) {
                console.error('❌ Error killing processes:', error.message);
            } else {
                console.log('✅ Successfully killed Next.js processes');
            }
            resolve();
        });
    });
}

// Start Next.js development server
function startNextServer() {
    return new Promise((resolve) => {
        console.log('\n🚀 Starting Next.js development server...');
        const child = exec('npm run dev', {
            cwd: process.cwd(),
            stdio: 'inherit'
        });

        // Give it a moment to start
        setTimeout(() => {
            console.log('✅ Next.js server should be starting up');
            console.log('🔄 Database connection pool will be recreated with fresh connections');
            resolve();
        }, 3000);

        // Handle process events
        child.on('error', (error) => {
            console.error('❌ Error starting Next.js server:', error.message);
        });

        child.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Next.js server exited with code ${code}`);
            }
        });
    });
}

// Main execution
async function resetConnectionPool() {
    try {
        // Find and kill existing Next.js processes
        const processes = await findNextProcess();
        await killNextProcesses(processes);
        
        // Wait a moment for processes to fully terminate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Start fresh Next.js server
        await startNextServer();
        
    } catch (error) {
        console.error('❌ Error resetting connection pool:', error.message);
    }
}

// Run the reset
resetConnectionPool();
