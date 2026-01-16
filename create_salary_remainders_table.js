const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS salary_remainders (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        amount NUMERIC(15, 3) NOT NULL DEFAULT 0,
        month VARCHAR(10) NOT NULL, -- Format YYYY-MM
        status VARCHAR(50) DEFAULT 'en attente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Table salary_remainders created successfully');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await client.end();
    }
}

main();
