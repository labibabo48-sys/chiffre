import { query } from './db';

const initDb = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS public.logins (
        id serial NOT NULL,
        username character varying(255) COLLATE pg_catalog."default" NOT NULL,
        password character varying(255) COLLATE pg_catalog."default" NOT NULL,
        role character varying(50) COLLATE pg_catalog."default" NOT NULL,
        full_name character varying(100) COLLATE pg_catalog."default",
        CONSTRAINT logins_pkey PRIMARY KEY (id),
        CONSTRAINT logins_username_key UNIQUE (username)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS public.chiffres (
        id serial NOT NULL,
        date character varying(255) COLLATE pg_catalog."default" NOT NULL,
        recette_de_caisse character varying(255) COLLATE pg_catalog."default" NOT NULL,
        total_diponce character varying(255) COLLATE pg_catalog."default" NOT NULL,
        diponce jsonb,
        diponce_divers jsonb,
        recette_net character varying(255) COLLATE pg_catalog."default" NOT NULL,
        tpe character varying(255) COLLATE pg_catalog."default" NOT NULL,
        cheque_bancaire character varying(255) COLLATE pg_catalog."default" NOT NULL,
        espaces character varying(255) COLLATE pg_catalog."default" NOT NULL,
        tickets_restaurant character varying(255) DEFAULT '0',
        extra character varying(255) DEFAULT '0',
        primes character varying(255) DEFAULT '0',
        CONSTRAINT chiffres_pkey PRIMARY KEY (id)
      );
    `);

    // Ensure columns exist if table was already created
    const columns = [
      { name: 'tickets_restaurant', type: 'character varying(255)', default: "'0'" },
      { name: 'extra', type: 'character varying(255)', default: "'0'" },
      { name: 'primes', type: 'character varying(255)', default: "'0'" },
      { name: 'diponce_divers', type: 'jsonb', default: null }
    ];

    for (const col of columns) {
      await query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chiffres' AND column_name='${col.name}') THEN
            ALTER TABLE public.chiffres ADD COLUMN ${col.name} ${col.type} ${col.default ? 'DEFAULT ' + col.default : ''};
          END IF;
        END $$;
      `);
    }

    await query(`
      CREATE TABLE IF NOT EXISTS public.suppliers (
        id serial NOT NULL,
        name character varying(255) NOT NULL,
        CONSTRAINT suppliers_pkey PRIMARY KEY (id),
        CONSTRAINT suppliers_name_key UNIQUE (name)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS public.invoices (
        id serial NOT NULL,
        supplier_name character varying(255) NOT NULL,
        amount character varying(255) NOT NULL,
        date character varying(255) NOT NULL,
        photo_url text,
        status character varying(50) DEFAULT 'unpaid',
        payment_method character varying(50),
        paid_date character varying(255),
        CONSTRAINT invoices_pkey PRIMARY KEY (id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS public.bank_deposits (
        id serial NOT NULL,
        amount character varying(255) NOT NULL,
        date character varying(255) NOT NULL,
        CONSTRAINT bank_deposits_pkey PRIMARY KEY (id)
      );
    `);

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

export default initDb;
