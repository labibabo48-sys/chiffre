const { Pool } = require('pg');
require('dotenv').config();

async function check() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        const empCount = await pool.query("SELECT COUNT(*) FROM employees");
        console.log('Employees count:', empCount.rows[0].count);

        const rsCount = await pool.query("SELECT COUNT(*) FROM restes_salaires_daily");
        console.log('Restes Salaires Daily count:', rsCount.rows[0].count);

        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tables.rows.map(r => r.table_name));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
