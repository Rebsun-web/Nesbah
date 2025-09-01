#!/usr/bin/env node

const { Pool } = require('pg');

// Emergency database reset script
// This script will forcefully terminate all connections and reset the database pool

const config = {
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
};

async function emergencyDatabaseReset() {
  console.log('🚨 EMERGENCY DATABASE RESET');
  console.log('============================');
  console.log('This script will forcefully reset all database connections');
  console.log('');
  
  // Step 1: Try to connect with superuser privileges
  console.log('🔑 Step 1: Attempting superuser connection...');
  
  let emergencyPool = null;
  let emergencyClient = null;
  
  try {
    emergencyPool = new Pool({
      ...config,
      max: 1,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 1000,
    });
    
    emergencyClient = await emergencyPool.connect();
    console.log('✅ Emergency connection established');
    
    // Step 2: Force terminate ALL connections
    console.log('💀 Step 2: Force terminating all connections...');
    
    const terminateQuery = `
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        pg_terminate_backend(pid) as terminated
      FROM pg_stat_activity 
      WHERE datname = current_database()
      AND pid <> pg_backend_pid();
    `;
    
    const terminateResult = await emergencyClient.query(terminateQuery);
    console.log(`🔪 Terminated ${terminateResult.rowCount} connections`);
    
    // Step 3: Wait for connections to fully close
    console.log('⏳ Step 3: Waiting for connections to fully close...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 4: Check current connection status
    console.log('📊 Step 4: Checking connection status...');
    
    const statusQuery = `
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
      FROM pg_stat_activity
      WHERE datname = current_database();
    `;
    
    const statusResult = await emergencyClient.query(statusQuery);
    const status = statusResult.rows[0];
    
    console.log('📈 Connection Status:');
    console.log(`   Total: ${status.total_connections}`);
    console.log(`   Active: ${status.active_connections}`);
    console.log(`   Idle: ${status.idle_connections}`);
    console.log(`   Idle in Transaction: ${status.idle_in_transaction}`);
    
    // Step 5: Test new connections
    console.log('🧪 Step 5: Testing new connections...');
    
    const testPool = new Pool({
      ...config,
      max: 3,
      min: 1,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 5000,
    });
    
    const testClient1 = await testPool.connect();
    console.log('✅ Test connection 1 successful');
    
    const testClient2 = await testPool.connect();
    console.log('✅ Test connection 2 successful');
    
    const testClient3 = await testPool.connect();
    console.log('✅ Test connection 3 successful');
    
    // Test a simple query
    const testResult = await testClient1.query('SELECT NOW() as current_time, version() as db_version');
    console.log('⏰ Database time:', testResult.rows[0].current_time);
    console.log('🔧 Database version:', testResult.rows[0].db_version.split(' ')[0]);
    
    // Release test connections
    testClient1.release();
    testClient2.release();
    testClient3.release();
    await testPool.end();
    
    console.log('🎉 EMERGENCY RESET COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Restart your Next.js application');
    console.log('   2. Monitor connection usage');
    console.log('   3. Consider reducing max connections if issues persist');
    
  } catch (error) {
    console.error('💥 EMERGENCY RESET FAILED:', error.message);
    console.log('');
    console.log('🚨 The database is in a critical state');
    console.log('💡 Consider these options:');
    console.log('   1. Restart the PostgreSQL server');
    console.log('   2. Check server logs for errors');
    console.log('   3. Contact your database administrator');
    console.log('   4. Wait for connections to timeout naturally');
    
    if (error.code === '53300') {
      console.log('');
      console.log('🔍 Error 53300 indicates connection pool exhaustion');
      console.log('⏰ This usually resolves after 5-10 minutes of inactivity');
      console.log('🔄 You can try running this script again after waiting');
    }
    
  } finally {
    // Cleanup emergency connections
    if (emergencyClient) {
      emergencyClient.release();
    }
    if (emergencyPool) {
      await emergencyPool.end();
    }
  }
}

// Run the emergency reset
if (require.main === module) {
  emergencyDatabaseReset()
    .then(() => {
      console.log('✨ Emergency reset script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Emergency reset script failed:', error);
      process.exit(1);
    });
}

module.exports = { emergencyDatabaseReset };
