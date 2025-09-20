#!/usr/bin/env node

/**
 * Database Configuration Checker
 * 
 * This script checks your current database configuration
 * and helps identify connection issues.
 */

import pkg from 'pg';
const { Client: createClient } = pkg;
import fs from 'fs';

async function checkDatabaseConfig() {
    console.log('🔍 Database Configuration Checker');
    console.log('=' .repeat(50));
    console.log('');
    
    // Check for environment files
    const envFiles = ['.env.local', '.env', '.env.development'];
    let envFile = null;
    
    for (const file of envFiles) {
        if (fs.existsSync(file)) {
            envFile = file;
            break;
        }
    }
    
    if (envFile) {
        console.log(`✅ Found environment file: ${envFile}`);
        
        // Load environment variables
        const envContent = fs.readFileSync(envFile, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim();
            }
        });
        
        console.log('📋 Environment variables:');
        console.log(`   PGHOST: ${envVars.PGHOST || 'not set'}`);
        console.log(`   PGPORT: ${envVars.PGPORT || 'not set'}`);
        console.log(`   PGDATABASE: ${envVars.PGDATABASE || 'not set'}`);
        console.log(`   PGUSER: ${envVars.PGUSER || 'not set'}`);
        console.log(`   PGPASSWORD: ${envVars.PGPASSWORD ? '***' : 'not set'}`);
        console.log(`   DATABASE_URL: ${envVars.DATABASE_URL ? '***' : 'not set'}`);
        console.log('');
        
        // Test database connection
        if (envVars.DATABASE_URL) {
            await testConnection({ connectionString: envVars.DATABASE_URL });
        } else if (envVars.PGHOST && envVars.PGDATABASE && envVars.PGUSER) {
            await testConnection({
                host: envVars.PGHOST,
                port: envVars.PGPORT || 5432,
                database: envVars.PGDATABASE,
                user: envVars.PGUSER,
                password: envVars.PGPASSWORD
            });
        } else {
            console.log('❌ Missing required database configuration');
            console.log('You need either:');
            console.log('1. DATABASE_URL environment variable, or');
            console.log('2. PGHOST, PGDATABASE, and PGUSER environment variables');
            console.log('');
            console.log('Run "node setup-test-database.js" to configure your database.');
        }
    } else {
        console.log('❌ No environment file found');
        console.log('Available files:', envFiles.join(', '));
        console.log('');
        console.log('Run "node setup-test-database.js" to configure your database.');
    }
}

async function testConnection(config) {
    console.log('🔌 Testing database connection...');
    
    const client = new createClient(config);
    
    try {
        await client.connect();
        console.log('✅ Database connection successful!');
        
        // Check database info
        const dbInfo = await client.query('SELECT current_database(), current_user, version()');
        console.log(`   Database: ${dbInfo.rows[0].current_database}`);
        console.log(`   User: ${dbInfo.rows[0].current_user}`);
        console.log(`   Version: ${dbInfo.rows[0].version.split(' ')[0]}`);
        
        // Check for required tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'business_users', 'pos_application')
            ORDER BY table_name
        `);
        
        const existingTables = tablesResult.rows.map(row => row.table_name);
        const requiredTables = ['users', 'business_users', 'pos_application'];
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        console.log('');
        console.log('📊 Required tables status:');
        requiredTables.forEach(table => {
            const exists = existingTables.includes(table);
            console.log(`   ${table}: ${exists ? '✅' : '❌'}`);
        });
        
        if (missingTables.length > 0) {
            console.log('');
            console.log('⚠️ Missing tables:', missingTables.join(', '));
            console.log('You may need to run your database migrations first.');
        } else {
            console.log('');
            console.log('✅ All required tables found!');
            console.log('You can now run the test scripts.');
        }
        
        await client.end();
        
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        console.log('');
        
        if (error.code === '3D000') {
            console.log('💡 The database does not exist. You may need to:');
            console.log('1. Create the database first');
            console.log('2. Run "node setup-test-database.js" to set up a test database');
        } else if (error.code === '28P01') {
            console.log('💡 Authentication failed. Please check your username and password.');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('💡 Connection refused. Please check:');
            console.log('1. PostgreSQL is running');
            console.log('2. Host and port are correct');
        } else {
            console.log('💡 Please check your database configuration and try again.');
        }
    }
}

// Run the check
checkDatabaseConfig().catch(error => {
    console.error('❌ Check failed:', error);
    process.exit(1);
});
