const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    try {
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
