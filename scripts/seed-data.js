const { Client } = require('pg');

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/chiffre",
};

async function seed() {
    console.log('Starting data seeding...');
    const client = new Client(DB_CONFIG);

    try {
        await client.connect();
        console.log('Connected to database.');

        const suppliers = ['Steg', 'Sonede', 'Fournisseur Boissons', 'Boulangerie Centrale', 'Nettoyage Pro', 'Maintenance Alpha'];

        // Generate data for the last months of 2025 and Jan 2026
        const monthsData = [
            { year: 2025, months: [10, 11, 12] },
            { year: 2026, months: [1] }
        ];

        for (const yearData of monthsData) {
            const year = yearData.year;
            for (const month of yearData.months) {
                const daysInMonth = new Date(year, month, 0).getDate();
                console.log(`Generating data for ${month}/${year} (${daysInMonth} days)...`);

                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    // Random data generation
                    const recetteCaisse = (Math.random() * (2500 - 1200) + 1200).toFixed(3);

                    const numExpenses = Math.floor(Math.random() * 4) + 2;
                    const expenses = [];
                    let totalExpensesDynamic = 0;

                    for (let i = 0; i < numExpenses; i++) {
                        const amount = (Math.random() * 200 + 50).toFixed(3);
                        expenses.push({
                            supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
                            amount: amount,
                            invoices: []
                        });
                        totalExpensesDynamic += parseFloat(amount);
                    }

                    const setupTotal = 350;
                    const totalExpenses = (totalExpensesDynamic + setupTotal).toFixed(3);
                    const recetteNet = (parseFloat(recetteCaisse) - parseFloat(totalExpenses)).toFixed(3);

                    const tpe = (parseFloat(recetteNet) * (Math.random() * 0.2 + 0.1)).toFixed(3);
                    const cheque = (parseFloat(recetteNet) * (Math.random() * 0.1 + 0.05)).toFixed(3);
                    const espaces = (parseFloat(recetteNet) - parseFloat(tpe) - parseFloat(cheque)).toFixed(3);

                    // Using specific date as identifier for update if exists
                    await client.query(`
                        INSERT INTO chiffres (date, recette_de_caisse, total_diponce, diponce, recette_net, tpe, cheque_bancaire, espaces)
                        VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
                        ON CONFLICT (date) DO UPDATE SET
                            recette_de_caisse = EXCLUDED.recette_de_caisse,
                            total_diponce = EXCLUDED.total_diponce,
                            diponce = EXCLUDED.diponce,
                            recette_net = EXCLUDED.recette_net,
                            tpe = EXCLUDED.tpe,
                            cheque_bancaire = EXCLUDED.cheque_bancaire,
                            espaces = EXCLUDED.espaces;
                    `, [
                        dateStr,
                        recetteCaisse,
                        totalExpenses,
                        JSON.stringify(expenses),
                        recetteNet,
                        tpe,
                        cheque,
                        espaces
                    ]);
                }
            }
        }

        console.log('Seeding completed successfully!');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seed();
