import { query } from '@/lib/db';
import { beyQuery } from '@/lib/beyDb';

export const resolvers = {
    Query: {
        getChiffreByDate: async (_: any, { date }: { date: string }) => {
            const res = await query('SELECT * FROM chiffres WHERE date = $1', [date]);

            // Fetch paid invoices for this date
            const paidInvoicesRes = await query("SELECT * FROM invoices WHERE status = 'paid' AND paid_date = $1", [date]);
            const paidInvoices = paidInvoicesRes.rows.map(inv => ({
                supplier: inv.supplier_name,
                amount: inv.amount,
                paymentMethod: inv.payment_method,
                invoices: inv.photo_url ? [inv.photo_url] : [],
                isFromFacturation: true,
                invoiceId: inv.id
            }));

            // Fetch from bey database
            const [avances, doublages, extrasPrimes] = await Promise.all([
                beyQuery('SELECT username, montant FROM avances WHERE date = $1', [date]),
                beyQuery('SELECT username, montant FROM doublages WHERE date::date = $1', [date]), // Cast timestamp to date
                beyQuery('SELECT username, montant, motif FROM extras WHERE date_extra = $1', [date])
            ]);

            const extraDetails = extrasPrimes.rows.filter(r => r.motif && r.motif.toLowerCase().includes('extra'));
            const primesDetails = extrasPrimes.rows.filter(r => r.motif && r.motif.toLowerCase().includes('prime'));

            let data = res.rows.length > 0 ? { ...res.rows[0] } : { date };

            // Merge existing diponce with paid invoices
            let existingDiponce = [];
            try {
                existingDiponce = typeof data.diponce === 'string' ? JSON.parse(data.diponce) : (data.diponce || []);
            } catch (e) {
                existingDiponce = [];
            }

            const combinedDiponce = [...existingDiponce, ...paidInvoices];

            return {
                ...data,
                diponce: JSON.stringify(combinedDiponce),
                diponce_divers: typeof data.diponce_divers === 'string' ? data.diponce_divers : JSON.stringify(data.diponce_divers || []),
                diponce_journalier: typeof data.diponce_journalier === 'string' ? data.diponce_journalier : JSON.stringify(data.diponce_journalier || []),
                diponce_admin: typeof data.diponce_admin === 'string' ? data.diponce_admin : JSON.stringify(data.diponce_admin || []),
                avances_details: avances.rows.map(r => ({ username: r.username, montant: r.montant.toString() })),
                doublages_details: doublages.rows.map(r => ({ username: r.username, montant: r.montant.toString() })),
                extras_details: extraDetails.map(r => ({ username: r.username, montant: r.montant.toString() })),
                primes_details: primesDetails.map(r => ({ username: r.username, montant: r.montant.toString() }))
            };
        },
        getInvoices: async (_: any, { supplierName, startDate, endDate, month }: any) => {
            let sql = 'SELECT * FROM invoices WHERE 1=1';
            const params = [];
            if (supplierName) {
                params.push(`%${supplierName}%`);
                sql += ` AND supplier_name ILIKE $${params.length}`;
            }
            if (startDate) {
                params.push(startDate);
                sql += ` AND date >= $${params.length}`;
            }
            if (endDate) {
                params.push(endDate);
                sql += ` AND date <= $${params.length}`;
            }
            if (month) {
                params.push(`${month}-%`);
                sql += ` AND (date LIKE $${params.length} OR paid_date LIKE $${params.length})`;
            }
            sql += ' ORDER BY date DESC, id DESC';
            const res = await query(sql, params);
            return res.rows;
        },
        getChiffresByRange: async (_: any, { startDate, endDate }: { startDate: string, endDate: string }) => {
            const [res, avances, doublages, extrasPrimes, paidInvoicesRes] = await Promise.all([
                query('SELECT * FROM chiffres WHERE date >= $1 AND date <= $2 ORDER BY date ASC', [startDate, endDate]),
                beyQuery('SELECT date, username, montant FROM avances WHERE date >= $1 AND date <= $2', [startDate, endDate]),
                beyQuery('SELECT date, username, montant FROM doublages WHERE date::date >= $1 AND date::date <= $2', [startDate, endDate]),
                beyQuery('SELECT date_extra as date, username, montant, motif FROM extras WHERE date_extra >= $1 AND date_extra <= $2', [startDate, endDate]),
                query("SELECT * FROM invoices WHERE status = 'paid' AND paid_date >= $1 AND paid_date <= $2", [startDate, endDate])
            ]);

            const normalizeDate = (d: any) => {
                if (!d) return null;
                try {
                    const dateObj = new Date(d);
                    if (isNaN(dateObj.getTime())) return null;
                    const y = dateObj.getFullYear();
                    const mn = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const dy = String(dateObj.getDate()).padStart(2, '0');
                    return `${y}-${mn}-${dy}`;
                } catch (e) {
                    return null;
                }
            };

            // Create a unique set of all dates that have any activity
            const allDatesSet = new Set<string>();

            res.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            avances.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            doublages.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            extrasPrimes.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            paidInvoicesRes.rows.forEach(r => { const d = normalizeDate(r.paid_date); if (d) allDatesSet.add(d); });

            const sortedDates = Array.from(allDatesSet).sort();

            const paidInvoicesByDate: Record<string, any[]> = {};
            paidInvoicesRes.rows.forEach(inv => {
                const d = normalizeDate(inv.paid_date);
                if (d) {
                    if (!paidInvoicesByDate[d]) paidInvoicesByDate[d] = [];
                    paidInvoicesByDate[d].push({
                        supplier: inv.supplier_name,
                        amount: inv.amount,
                        paymentMethod: inv.payment_method,
                        invoices: inv.photo_url ? [inv.photo_url] : [],
                        isFromFacturation: true,
                        invoiceId: inv.id
                    });
                }
            });

            return sortedDates.map(dayStr => {
                const row = res.rows.find(r => normalizeDate(r.date) === dayStr) || {
                    date: dayStr,
                    recette_de_caisse: '0',
                    total_diponce: '0',
                    diponce: '[]',
                    recette_net: '0',
                    tpe: '0',
                    cheque_bancaire: '0',
                    espaces: '0',
                    tickets_restaurant: '0',
                    extra: '0',
                    primes: '0',
                    diponce_divers: '[]',
                    diponce_journalier: '[]',
                    diponce_admin: '[]'
                };

                const dayAvances = avances.rows.filter(r => normalizeDate(r.date) === dayStr);
                const dayDoublages = doublages.rows.filter(r => normalizeDate(r.date) === dayStr);
                const dayExtrasPrimes = extrasPrimes.rows.filter(r => normalizeDate(r.date) === dayStr);
                const dayPaidInvoices = paidInvoicesByDate[dayStr] || [];

                let diponceList = [];
                try {
                    diponceList = typeof row.diponce === 'string' ? JSON.parse(row.diponce) : (row.diponce || []);
                } catch (e) {
                    diponceList = [];
                }

                // Combine with paid invoices from facturation
                const combinedDiponce = [...diponceList, ...dayPaidInvoices];

                // Calculate cumulative total diponce including facturation
                // Compute totals for all categories to get accurate daily stats
                let diversList = [], journalierList = [], adminList = [];
                try { diversList = typeof row.diponce_divers === 'string' ? JSON.parse(row.diponce_divers) : (row.diponce_divers || []); } catch (e) { }
                try { journalierList = typeof row.diponce_journalier === 'string' ? JSON.parse(row.diponce_journalier) : (row.diponce_journalier || []); } catch (e) { }
                try { adminList = typeof row.diponce_admin === 'string' ? JSON.parse(row.diponce_admin) : (row.diponce_admin || []); } catch (e) { }

                const sumDiponce = combinedDiponce.reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0);
                const sumDivers = diversList.reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0);
                const sumJournalier = journalierList.reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0);
                const sumAdmin = adminList.reduce((s: number, i: any) => s + (parseFloat(i.amount) || 0), 0);
                const sumAvances = dayAvances.reduce((s: number, i: any) => s + (parseFloat(i.montant) || 0), 0);
                const sumDoublages = dayDoublages.reduce((s: number, i: any) => s + (parseFloat(i.montant) || 0), 0);
                const sumExtrasPrimes = dayExtrasPrimes.reduce((s: number, i: any) => s + (parseFloat(i.montant) || 0), 0);

                const totalDiponce = sumDiponce + sumDivers + sumJournalier + sumAdmin + sumAvances + sumDoublages + sumExtrasPrimes;
                const recetteCaisse = parseFloat(row.recette_de_caisse) || 0;
                const recetteNet = recetteCaisse - totalDiponce;

                const extraDetails = dayExtrasPrimes.filter(r => r.motif && r.motif.toLowerCase().includes('extra'));
                const primesDetails = dayExtrasPrimes.filter(r => r.motif && r.motif.toLowerCase().includes('prime'));

                return {
                    ...row,
                    total_diponce: totalDiponce.toString(),
                    recette_net: recetteNet.toString(),
                    diponce: JSON.stringify(combinedDiponce),
                    diponce_divers: typeof row.diponce_divers === 'string' ? row.diponce_divers : JSON.stringify(row.diponce_divers || []),
                    diponce_journalier: typeof row.diponce_journalier === 'string' ? row.diponce_journalier : JSON.stringify(row.diponce_journalier || []),
                    diponce_admin: typeof row.diponce_admin === 'string' ? row.diponce_admin : JSON.stringify(row.diponce_admin || []),
                    avances_details: dayAvances.map(r => ({ username: r.username, montant: r.montant.toString() })),
                    doublages_details: dayDoublages.map(r => ({ username: r.username, montant: r.montant.toString() })),
                    extras_details: extraDetails.map(r => ({ username: r.username, montant: r.montant.toString() })),
                    primes_details: primesDetails.map(r => ({ username: r.username, montant: r.montant.toString() }))
                };
            });
        },
        getSuppliers: async () => {
            const res = await query('SELECT * FROM suppliers ORDER BY name ASC');
            return res.rows;
        },
        getDesignations: async () => {
            const res = await query('SELECT * FROM designations ORDER BY name ASC');
            return res.rows;
        },
        getMonthlySalaries: async (_: any, { startDate, endDate }: { startDate: string, endDate: string }) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const results = [];

            let current = new Date(start.getFullYear(), start.getMonth(), 1);
            while (current <= end) {
                const year = current.getFullYear();
                const month = String(current.getMonth() + 1).padStart(2, '0');
                const tableName = `paiecurrent_${year}_${month}`;

                try {
                    // Check if table exists
                    const tableCheck = await beyQuery(
                        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
                        [tableName]
                    );

                    if (tableCheck.rows[0].exists) {
                        const salaryRes = await beyQuery(`SELECT SUM(salaire_net) as total FROM ${tableName} WHERE paid = true`);
                        results.push({
                            month: current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                            total: parseFloat(salaryRes.rows[0].total) || 0
                        });
                    }
                } catch (e) {
                    console.error(`Error querying ${tableName}:`, e);
                }

                current.setMonth(current.getMonth() + 1);
            }
            return results;
        },
        getPaidUsers: async (_: any, { month, startDate, endDate }: { month?: string, startDate?: string, endDate?: string }) => {
            const monthsToQuery = [];

            if (month) {
                monthsToQuery.push(month.replace('-', '_'));
            } else if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                let current = new Date(start.getFullYear(), start.getMonth(), 1);
                while (current <= end) {
                    monthsToQuery.push(`${current.getFullYear()}_${String(current.getMonth() + 1).padStart(2, '0')}`);
                    current.setMonth(current.getMonth() + 1);
                }
            } else {
                return [];
            }

            const results: any[] = [];
            const processedUsers: Record<string, number> = {};

            for (const formattedMonth of monthsToQuery) {
                const tableName = `paiecurrent_${formattedMonth}`;
                try {
                    const tableCheck = await beyQuery(
                        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
                        [tableName]
                    );

                    if (tableCheck.rows[0].exists) {
                        let sql = `SELECT username, SUM(salaire_net) as amount FROM ${tableName} WHERE paid = true`;
                        const params = [];

                        if (startDate && endDate) {
                            params.push(startDate, endDate);
                            sql += ` AND date >= $1 AND date <= $2`;
                        }

                        sql += ` GROUP BY username`;
                        const res = await beyQuery(sql, params);

                        res.rows.forEach(r => {
                            processedUsers[r.username] = (processedUsers[r.username] || 0) + (parseFloat(r.amount) || 0);
                        });
                    }
                } catch (e) {
                    console.error(`Error fetching paid users for ${tableName}:`, e);
                }
            }

            return Object.entries(processedUsers).map(([username, amount]) => ({
                username,
                amount
            })).sort((a, b) => b.amount - a.amount);
        },
        getPaymentStats: async (_: any, { month, startDate, endDate }: { month?: string, startDate?: string, endDate?: string }) => {
            const params: string[] = [];
            let dateFilter = '';

            if (month) {
                params.push(`${month}-%`);
                dateFilter = "LIKE $1";
            } else if (startDate && endDate) {
                params.push(startDate, endDate);
                dateFilter = ">= $1 AND date <= $2";
            } else {
                return { totalRecetteNette: 0, totalFacturesPayees: 0, totalTPE: 0, totalCheque: 0, totalCash: 0, totalBankDeposits: 0 };
            }

            const [netRes, invoicesRes, tpeRes, chequeRes, cashRes, bankRes] = await Promise.all([
                query(`SELECT SUM(CAST(recette_net AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(amount AS NUMERIC)) as total FROM invoices WHERE status = 'paid' AND paid_date ${dateFilter.replace('date', 'paid_date')}`, params),
                query(`SELECT SUM(CAST(tpe AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(cheque_bancaire AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(espaces AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(amount AS NUMERIC)) as total FROM bank_deposits WHERE date ${dateFilter}`, params),
            ]);

            return {
                totalRecetteNette: parseFloat(netRes.rows[0].total) || 0,
                totalFacturesPayees: parseFloat(invoicesRes.rows[0].total) || 0,
                totalTPE: parseFloat(tpeRes.rows[0].total) || 0,
                totalCheque: parseFloat(chequeRes.rows[0].total) || 0,
                totalCash: parseFloat(cashRes.rows[0].total) || 0,
                totalBankDeposits: parseFloat(bankRes.rows[0].total) || 0,
            };
        },
        getBankDeposits: async (_: any, { month, startDate, endDate }: { month?: string, startDate?: string, endDate?: string }) => {
            const params: string[] = [];
            let dateFilter = '';

            if (month) {
                params.push(`${month}-%`);
                dateFilter = "WHERE date LIKE $1";
            } else if (startDate && endDate) {
                params.push(startDate, endDate);
                dateFilter = "WHERE date >= $1 AND date <= $2";
            } else {
                return [];
            }

            const res = await query(`SELECT * FROM bank_deposits ${dateFilter} ORDER BY date DESC`, params);
            return res.rows;
        }
    },
    Mutation: {
        saveChiffre: async (_: any, args: any) => {
            const {
                date,
                recette_de_caisse,
                total_diponce,
                diponce,
                recette_net,
                tpe,
                cheque_bancaire,
                espaces,
                tickets_restaurant,
                extra,
                primes,
                diponce_divers,
                diponce_journalier,
                diponce_admin,
            } = args;

            // Remove invoices that came from facturation before saving to avoid duplication
            let diponceList = [];
            try {
                diponceList = JSON.parse(diponce);
                diponceList = diponceList.filter((d: any) => !d.isFromFacturation);
            } catch (e) { }

            const diponceToSave = JSON.stringify(diponceList);
            const diponceDiversToSave = diponce_divers;
            const diponceJournalierToSave = diponce_journalier;
            const diponceAdminToSave = diponce_admin;

            // Check if it exists
            const existing = await query('SELECT id FROM chiffres WHERE date = $1', [date]);

            let res;
            if (existing.rows.length > 0) {
                // Update
                res = await query(
                    `UPDATE chiffres SET 
            recette_de_caisse = $1, 
            total_diponce = $2, 
            diponce = $3::jsonb, 
            recette_net = $4, 
            tpe = $5, 
            cheque_bancaire = $6, 
            espaces = $7,
            tickets_restaurant = $8,
            extra = $9,
            primes = $10,
            diponce_divers = $11::jsonb, 
            diponce_journalier = $12::jsonb, 
            diponce_admin = $13::jsonb
          WHERE date = $14 RETURNING *`,
                    [recette_de_caisse, total_diponce, diponceToSave, recette_net, tpe, cheque_bancaire, espaces, tickets_restaurant, extra, primes, diponceDiversToSave, diponceJournalierToSave, diponceAdminToSave, date]
                );
            } else {
                // Insert
                res = await query(
                    `INSERT INTO chiffres (date, recette_de_caisse, total_diponce, diponce, recette_net, tpe, cheque_bancaire, espaces, tickets_restaurant, extra, primes, diponce_divers, diponce_journalier, diponce_admin)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14::jsonb) RETURNING *`,
                    [date, recette_de_caisse, total_diponce, diponceToSave, recette_net, tpe, cheque_bancaire, espaces, tickets_restaurant, extra, primes, diponceDiversToSave, diponceJournalierToSave, diponceAdminToSave]
                );
            }
            const row = res.rows[0];

            // After saving, return it with the paid invoices again for the UI
            const paidInvoicesRes = await query("SELECT * FROM invoices WHERE status = 'paid' AND paid_date = $1", [date]);
            const paidInvoices = paidInvoicesRes.rows.map(inv => ({
                supplier: inv.supplier_name,
                amount: inv.amount,
                paymentMethod: inv.payment_method,
                invoices: inv.photo_url ? [inv.photo_url] : [],
                isFromFacturation: true,
                invoiceId: inv.id
            }));

            const finalDiponce = [...(row.diponce || []), ...paidInvoices];

            return {
                ...row,
                diponce: JSON.stringify(finalDiponce),
                diponce_divers: typeof row.diponce_divers === 'string' ? row.diponce_divers : JSON.stringify(row.diponce_divers || []),
                diponce_journalier: typeof row.diponce_journalier === 'string' ? row.diponce_journalier : JSON.stringify(row.diponce_journalier || []),
                diponce_admin: typeof row.diponce_admin === 'string' ? row.diponce_admin : JSON.stringify(row.diponce_admin || [])
            };
        },
        addInvoice: async (_: any, { supplier_name, amount, date, photo_url }: any) => {
            const res = await query(
                'INSERT INTO invoices (supplier_name, amount, date, photo_url) VALUES ($1, $2, $3, $4) RETURNING *',
                [supplier_name, amount, date, photo_url]
            );
            return res.rows[0];
        },
        payInvoice: async (_: any, { id, payment_method, paid_date, photo_cheque_url, photo_verso_url }: any) => {
            const res = await query(
                "UPDATE invoices SET status = 'paid', payment_method = $1, paid_date = $2, photo_cheque_url = $3, photo_verso_url = $4 WHERE id = $5 RETURNING *",
                [payment_method, paid_date, photo_cheque_url, photo_verso_url, id]
            );
            return res.rows[0];
        },
        deleteInvoice: async (_: any, { id }: { id: number }) => {
            await query('DELETE FROM invoices WHERE id = $1', [id]);
            return true;
        },
        upsertSupplier: async (_: any, { name }: { name: string }) => {
            // Normalize name (trim and title case or lowercase for comparison)
            const normalized = name.trim();
            const existing = await query('SELECT * FROM suppliers WHERE LOWER(name) = LOWER($1)', [normalized]);
            if (existing.rows.length > 0) return existing.rows[0];

            const res = await query('INSERT INTO suppliers (name) VALUES ($1) RETURNING *', [normalized]);
            return res.rows[0];
        },
        updateSupplier: async (_: any, { id, name }: { id: number, name: string }) => {
            const res = await query('UPDATE suppliers SET name = $1 WHERE id = $2 RETURNING *', [name.trim(), id]);
            return res.rows[0];
        },
        deleteSupplier: async (_: any, { id }: { id: number }) => {
            await query('DELETE FROM suppliers WHERE id = $1', [id]);
            return true;
        },
        upsertDesignation: async (_: any, { name }: { name: string }) => {
            const normalized = name.trim();
            const existing = await query('SELECT * FROM designations WHERE LOWER(name) = LOWER($1)', [normalized]);
            if (existing.rows.length > 0) return existing.rows[0];

            const res = await query('INSERT INTO designations (name) VALUES ($1) RETURNING *', [normalized]);
            return res.rows[0];
        },
        updateDesignation: async (_: any, { id, name }: { id: number, name: string }) => {
            const res = await query('UPDATE designations SET name = $1 WHERE id = $2 RETURNING *', [name.trim(), id]);
            return res.rows[0];
        },
        deleteDesignation: async (_: any, { id }: { id: number }) => {
            await query('DELETE FROM designations WHERE id = $1', [id]);
            return true;
        },
        addBankDeposit: async (_: any, { amount, date }: { amount: string, date: string }) => {
            const res = await query(
                'INSERT INTO bank_deposits (amount, date) VALUES ($1, $2) RETURNING *',
                [amount, date]
            );
            return res.rows[0];
        },
        addPaidInvoice: async (_: any, args: any) => {
            const { supplier_name, amount, date, photo_url, photo_cheque_url, photo_verso_url, payment_method, paid_date } = args;
            const res = await query(
                "INSERT INTO invoices (supplier_name, amount, date, photo_url, photo_cheque_url, photo_verso_url, status, payment_method, paid_date) VALUES ($1, $2, $3, $4, $5, $6, 'paid', $7, $8) RETURNING *",
                [supplier_name, amount, date, photo_url, photo_cheque_url, photo_verso_url, payment_method, paid_date]
            );
            return res.rows[0];
        },
    },
};
