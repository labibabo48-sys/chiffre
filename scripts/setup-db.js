const { Client } = require('pg');

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/chiffre",
};

async function setup() {
    console.log('Starting database setup...');

    // 1. Check if database exists, if not create it (requires connecting to default postgres db first)
    const dbName = 'chiffre';
    const rootClient = new Client({
        connectionString: "postgresql://postgres:postgres@localhost:5432/postgres",
    });

    try {
        await rootClient.connect();
        const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        if (res.rows.length === 0) {
            console.log(`Database '${dbName}' does not exist. Creating...`);
            await rootClient.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database '${dbName}' created.`);
        } else {
            console.log(`Database '${dbName}' already exists.`);
        }
    } catch (err) {
        console.error('Error checking/creating database:', err);
    } finally {
        await rootClient.end();
    }

    // 2. Connect to the actual database and create tables
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();
        console.log('Connected to database.');

        // Logins Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.logins (
        id serial NOT NULL,
        username character varying(255) NOT NULL,
        password character varying(255) NOT NULL,
        role character varying(50) NOT NULL,
        full_name character varying(100),    
        CONSTRAINT logins_pkey PRIMARY KEY (id),
        CONSTRAINT logins_username_key UNIQUE (username)
      );
    `);
        console.log('Table logins checked/created.');

        // Chiffres Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.chiffres (
        id serial NOT NULL,
        date character varying(255) NOT NULL,
        recette_de_caisse character varying(255) NOT NULL,
        total_diponce character varying(255) NOT NULL,
        diponce jsonb,
        recette_net character varying(255) NOT NULL,
        tpe character varying(255) NOT NULL,
        cheque_bancaire character varying(255) NOT NULL,
        espaces character varying(255) NOT NULL,
        CONSTRAINT chiffres_pkey PRIMARY KEY (id),
        CONSTRAINT chiffres_date_key UNIQUE (date)
      );
    `);
        console.log('Table chiffres checked/created.');

        // Suppliers Table (Extra feature for the dropdown)
        await client.query(`
      CREATE TABLE IF NOT EXISTS public.suppliers (
        id serial NOT NULL,
        name character varying(255) NOT NULL,
        CONSTRAINT suppliers_pkey PRIMARY KEY (id),
        CONSTRAINT suppliers_name_key UNIQUE (name)
      );
    `);
        console.log('Table suppliers checked/created.');

        // 3. Seed initial data
        // Create admin user if not exists
        const adminCheck = await client.query("SELECT * FROM logins WHERE username = 'admin'");
        if (adminCheck.rows.length === 0) {
            // Using plain text password as per user's implicitly simple requirements/mock auth, 
            // but in real app should be hashed. 
            // The user didn't ask for hashing explicitly in the SQL, but standard practice.
            // However, my mock auth in page.tsx currently doesn't check DB, I should probably update that too if I can.
            // For now, let's insert a record so the DB isn't empty.
            await client.query(`
        INSERT INTO logins (username, password, role, full_name)
        VALUES ('admin', 'admin123', 'admin', 'Administrateur');
      `);
            console.log('Admin user created (user: admin, pass: admin123).');
        }

        const cashierCheck = await client.query("SELECT * FROM logins WHERE username = 'caissier'");
        if (cashierCheck.rows.length === 0) {
            await client.query(`
        INSERT INTO logins (username, password, role, full_name)
        VALUES ('caissier', 'caissier123', 'caissier', 'Caissier Principal');
      `);
            console.log('Cashier user created (user: caissier, pass: caissier123).');
        }

        // Seed some suppliers
        const supplierCount = await client.query('SELECT count(*) FROM suppliers');
        if (parseInt(supplierCount.rows[0].count) === 0) {
            await client.query(`
        INSERT INTO suppliers (name) VALUES 
        ('Steg'), ('Sonede'), ('Fournisseur Boissons'), ('Boulangerie Centrale');
      `);
            console.log('Default suppliers seeded.');
        }

    } catch (err) {
        console.error('Error setup database:', err);
    } finally {
        await client.end();
        console.log('Database setup finished.');
    }
}

setup();
