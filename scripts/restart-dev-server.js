const { spawn } = require('child_process');
const path = require('path');

console.log('🔄 Restarting development server with optimized session management...');

// Kill any existing Node.js processes (be careful with this in production)
const killProcess = spawn('pkill', ['-f', 'next dev'], { stdio: 'inherit' });

killProcess.on('close', (code) => {
    console.log(`✅ Killed existing processes (exit code: ${code})`);
    
    // Wait a moment for processes to fully terminate
    setTimeout(() => {
        console.log('🚀 Starting development server...');
        
        // Start the development server
        const devServer = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        devServer.on('error', (error) => {
            console.error('❌ Failed to start development server:', error);
        });
        
        devServer.on('close', (code) => {
            console.log(`🛑 Development server stopped (exit code: ${code})`);
        });
        
    }, 2000);
});

killProcess.on('error', (error) => {
    console.error('❌ Failed to kill existing processes:', error);
});
