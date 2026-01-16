const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    try {
        await client.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS category VARCHAR(100);');
        console.log('Column added successfully');
    } catch (err) {
        console.error('Error adding column:', err);
    } finally {
        await client.end();
    }
}

main();
