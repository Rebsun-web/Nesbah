import cron from 'node-cron'
import pool from '@/lib/db'

cron.schedule('0 * * * *', async () => {
    console.log('Running auto-ignore logic...')
    try {
        const client = await pool.connect()
        await client.query(`
      UPDATE submitted_applications
      SET ignored_by = COALESCE(ignored_by, '[]'::jsonb) || to_jsonb(bank_users.user_id::INT)
      FROM bank_users
      WHERE submitted_applications.created_at < NOW() - INTERVAL '48 hours'
      AND NOT ignored_by @> to_jsonb(bank_users.user_id::INT)
      AND NOT opened_by @> to_jsonb(bank_users.user_id::INT)
      AND NOT purchased_by @> to_jsonb(bank_users.user_id::INT);
    `)
        client.release()
    } catch (err) {
        console.error('Auto-ignore cron failed:', err)
    }
})