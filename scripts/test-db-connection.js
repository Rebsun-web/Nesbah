const { Pool } = require('pg');

const config = {
  host: '34.166.77.134',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Riyadh123!@#',
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 5000,
};

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...');
  
  let pool = null;
  
  try {
    pool = new Pool(config);
    
    console.log('🔌 Attempting to connect...');
    const client = await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('⏰ Database time:', result.rows[0].current_time);
    console.log('🔧 Database version:', result.rows[0].db_version.split(' ')[0]);
    
    // Check connection count
    const connResult = await client.query(`
      SELECT 
        count(*) as total_connections,
        setting as max_connections
      FROM pg_stat_activity 
      CROSS JOIN pg_settings 
      WHERE name = 'max_connections'
      GROUP BY setting
    `);
    
    if (connResult.rows.length > 0) {
      const stats = connResult.rows[0];
      const utilization = (parseInt(stats.total_connections) / parseInt(stats.max_connections)) * 100;
      console.log('📊 Connection Status:');
      console.log(`   Current Connections: ${stats.total_connections}`);
      console.log(`   Max Connections: ${stats.max_connections}`);
      console.log(`   Utilization: ${utilization.toFixed(1)}%`);
    }
    
    client.release();
    console.log('🎉 Database is now accessible!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === '53300') {
      console.log('');
      console.log('🔍 Error 53300: Connection pool exhausted');
      console.log('💡 This usually resolves after 5-10 minutes of inactivity');
      console.log('⏰ Wait a bit longer and try again');
    }
    
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      console.log('✨ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
