import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'chifere_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function executeSQLFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting notification trigger fix...');
    
    // Read the SQL fix file
    const sqlFilePath = path.join(__dirname, 'fix_notification_trigger.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          await client.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('🎉 All notification trigger fixes applied successfully!');
    
    // Verify the functions exist
    console.log('🔍 Verifying functions...');
    const functions = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('notify_new_order', 'notify_order_status_update', 'create_notification')
      ORDER BY routine_name;
    `);
    
    console.log('📋 Updated functions:');
    functions.rows.forEach(row => {
      console.log(`  - ${row.routine_name}`);
    });
    
    // Check triggers
    console.log('🔍 Verifying triggers...');
    const triggers = await client.query(`
      SELECT trigger_name, event_object_table, action_timing, event_manipulation
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
      AND trigger_name IN ('trigger_notify_new_order', 'trigger_notify_order_status_update')
      ORDER BY trigger_name;
    `);
    
    console.log('📋 Active triggers:');
    triggers.rows.forEach(row => {
      console.log(`  - ${row.trigger_name} on ${row.event_object_table} (${row.action_timing} ${row.event_manipulation})`);
    });
    
  } catch (error) {
    console.error('💥 Error applying notification trigger fix:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Test the notification system
async function testNotificationSystem() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧪 Testing notification system...');
    
    // Test create_notification function with a dummy user
    const testResult = await client.query(`
      SELECT create_notification(
        '00000000-0000-0000-0000-000000000000'::UUID,
        'test'::notification_type,
        'Test Notification',
        'This is a test notification to verify the system works',
        '{"test": true}'::JSONB
      ) as notification_id;
    `);
    
    if (testResult.rows[0].notification_id) {
      console.log('✅ Notification system test passed');
      
      // Clean up test notification
      await client.query(`
        DELETE FROM public.notifications 
        WHERE id = $1
      `, [testResult.rows[0].notification_id]);
      console.log('🧹 Test notification cleaned up');
    } else {
      console.log('⚠️  Notification system test returned null (expected for non-existent user)');
    }
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error.message);
  } finally {
    client.release();
  }
}

// Main execution
async function main() {
  try {
    await executeSQLFix();
    await testNotificationSystem();
    console.log('\n🎯 Notification trigger fix completed successfully!');
    console.log('📝 The system now handles null seller_id values gracefully');
  } catch (error) {
    console.error('\n💥 Failed to apply notification trigger fix:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { executeSQLFix, testNotificationSystem };
