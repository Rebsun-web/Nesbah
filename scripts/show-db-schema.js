const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Riyadh123%21%40%23@34.166.77.134:5432/postgres',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function showDatabaseSchema() {
    const client = await pool.connect();
    
    try {
        console.log('🔍 Inspecting database schema...\n');
        
        // Get all tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        console.log(`📋 Found ${tablesResult.rows.length} tables in the database:\n`);
        
        // For each table, get its columns
        for (const tableRow of tablesResult.rows) {
            const tableName = tableRow.table_name;
            
            // Get column information for this table
            const columnsResult = await client.query(`
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale
                FROM information_schema.columns 
                WHERE table_name = $1 
                ORDER BY ordinal_position
            `, [tableName]);
            
            console.log(`📊 Table: ${tableName}`);
            console.log('─'.repeat(50));
            
            if (columnsResult.rows.length === 0) {
                console.log('  No columns found');
            } else {
                columnsResult.rows.forEach(col => {
                    let columnInfo = `  - ${col.column_name}: ${col.data_type}`;
                    
                    if (col.character_maximum_length) {
                        columnInfo += `(${col.character_maximum_length})`;
                    } else if (col.numeric_precision) {
                        if (col.numeric_scale) {
                            columnInfo += `(${col.numeric_precision},${col.numeric_scale})`;
                        } else {
                            columnInfo += `(${col.numeric_precision})`;
                        }
                    }
                    
                    if (col.is_nullable === 'NO') {
                        columnInfo += ' NOT NULL';
                    }
                    
                    if (col.column_default) {
                        columnInfo += ` DEFAULT ${col.column_default}`;
                    }
                    
                    console.log(columnInfo);
                });
            }
            
            // Get foreign key constraints
            const foreignKeysResult = await client.query(`
                SELECT 
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = $1
            `, [tableName]);
            
            if (foreignKeysResult.rows.length > 0) {
                console.log('  🔗 Foreign Keys:');
                foreignKeysResult.rows.forEach(fk => {
                    console.log(`    ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
                });
            }
            
            // Get indexes
            const indexesResult = await client.query(`
                SELECT 
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE tablename = $1
                ORDER BY indexname
            `, [tableName]);
            
            if (indexesResult.rows.length > 0) {
                console.log('  📍 Indexes:');
                indexesResult.rows.forEach(idx => {
                    console.log(`    ${idx.indexname}`);
                });
            }
            
            console.log(''); // Empty line between tables
        }
        
        // Show table relationships summary
        console.log('🔗 Table Relationships Summary:');
        console.log('─'.repeat(50));
        
        const relationshipsResult = await client.query(`
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name, kcu.column_name
        `);
        
        if (relationshipsResult.rows.length > 0) {
            relationshipsResult.rows.forEach(rel => {
                console.log(`  ${rel.table_name}.${rel.column_name} → ${rel.foreign_table_name}.${rel.foreign_column_name}`);
            });
        } else {
            console.log('  No foreign key relationships found');
        }
        
        console.log('\n✅ Database schema inspection complete!');
        
    } catch (error) {
        console.error('❌ Error inspecting database schema:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

showDatabaseSchema().catch(console.error);
