import { query } from '@/lib/db';
import { beyQuery } from '@/lib/beyDb';

export const resolvers = {
    Query: {
        getChiffreByDate: async (_: any, { date }: { date: string }) => {
            const res = await query('SELECT * FROM chiffres WHERE date = $1', [date]);

            // Fetch paid invoices for this date
            const paidInvoicesRes = await query("SELECT * FROM invoices WHERE status = 'paid' AND paid_date = $1", [date]);
            const paidInvoices = paidInvoicesRes.rows.map(inv => {
                let photos = [];
                try {
                    photos = typeof inv.photos === 'string' ? JSON.parse(inv.photos) : (Array.isArray(inv.photos) ? inv.photos : []);
                } catch (e) { photos = []; }

                // Merge photo_url if it exists and is not in photos
                if (inv.photo_url && !photos.includes(inv.photo_url)) {
                    photos = [inv.photo_url, ...photos];
                }

                return {
                    supplier: inv.supplier_name,
                    amount: inv.amount,
                    paymentMethod: inv.payment_method,
                    invoices: photos,
                    isFromFacturation: true,
                    invoiceId: inv.id,
                    doc_type: inv.doc_type,
                    doc_number: inv.doc_number
                };
            });

            // Fetch from local database
            const [avances, doublages, extras, primes] = await Promise.all([
                query('SELECT id, employee_name as username, montant FROM advances WHERE date = $1 ORDER BY id DESC', [date]),
                query('SELECT id, employee_name as username, montant FROM doublages WHERE date = $1 ORDER BY id DESC', [date]),
                query('SELECT id, employee_name as username, montant FROM extras WHERE date = $1 ORDER BY id DESC', [date]),
                query('SELECT id, employee_name as username, montant FROM primes WHERE date = $1 ORDER BY id DESC', [date])
            ]);

            const extraDetails = extras.rows;
            const primesDetails = primes.rows;

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
                is_locked: data.is_locked,
                diponce: JSON.stringify(combinedDiponce),
                diponce_divers: typeof data.diponce_divers === 'string' ? data.diponce_divers : JSON.stringify(data.diponce_divers || []),
                diponce_journalier: typeof data.diponce_journalier === 'string' ? data.diponce_journalier : JSON.stringify(data.diponce_journalier || []),
                diponce_admin: typeof data.diponce_admin === 'string' ? data.diponce_admin : JSON.stringify(data.diponce_admin || []),
                avances_details: avances.rows.map(r => ({ id: r.id, username: r.username, montant: parseFloat(r.montant) })),
                doublages_details: doublages.rows.map(r => ({ id: r.id, username: r.username, montant: parseFloat(r.montant) })),
                extras_details: extraDetails.map(r => ({ id: r.id, username: r.username, montant: parseFloat(r.montant) })),
                primes_details: primesDetails.map(r => ({ id: r.id, username: r.username, montant: parseFloat(r.montant) }))
            };
        },
        getInvoices: async (_: any, { supplierName, startDate, endDate, month, payer }: any) => {
            let sql = 'SELECT * FROM invoices WHERE 1=1';
            const params = [];
            if (supplierName) {
                params.push(`%${supplierName}%`);
                sql += ` AND (supplier_name ILIKE $${params.length} OR doc_number ILIKE $${params.length} OR amount::text ILIKE $${params.length})`;
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
            if (payer) {
                params.push(payer);
                sql += ` AND payer = $${params.length}`;
            }
            sql += ' ORDER BY updated_at DESC, id DESC';
            const res = await query(sql, params);
            return res.rows.map(r => ({
                ...r,
                photos: typeof r.photos === 'string' ? r.photos : JSON.stringify(r.photos || [])
            }));
        },
        getChiffresByRange: async (_: any, { startDate, endDate }: { startDate: string, endDate: string }) => {
            const [res, avances, doublages, extras, primes, paidInvoicesRes] = await Promise.all([
                query('SELECT * FROM chiffres WHERE date >= $1 AND date <= $2 ORDER BY date ASC', [startDate, endDate]),
                query('SELECT id, date, employee_name as username, montant FROM advances WHERE date >= $1 AND date <= $2 ORDER BY id DESC', [startDate, endDate]),
                query('SELECT id, date, employee_name as username, montant FROM doublages WHERE date >= $1 AND date <= $2 ORDER BY id DESC', [startDate, endDate]),
                query('SELECT id, date, employee_name as username, montant FROM extras WHERE date >= $1 AND date <= $2 ORDER BY id DESC', [startDate, endDate]),
                query('SELECT id, date, employee_name as username, montant FROM primes WHERE date >= $1 AND date <= $2 ORDER BY id DESC', [startDate, endDate]),
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
            extras.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            primes.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            paidInvoicesRes.rows.forEach(r => { const d = normalizeDate(r.paid_date); if (d) allDatesSet.add(d); });

            const sortedDates = Array.from(allDatesSet).sort();

            const paidInvoicesByDate: Record<string, any[]> = {};
            paidInvoicesRes.rows.forEach(inv => {
                const d = normalizeDate(inv.paid_date);
                if (d) {
                    if (!paidInvoicesByDate[d]) paidInvoicesByDate[d] = [];

                    let photos = [];
                    try {
                        photos = typeof inv.photos === 'string' ? JSON.parse(inv.photos) : (Array.isArray(inv.photos) ? inv.photos : []);
                    } catch (e) { photos = []; }

                    if (inv.photo_url && !photos.includes(inv.photo_url)) {
                        photos = [inv.photo_url, ...photos];
                    }

                    paidInvoicesByDate[d].push({
                        supplier: inv.supplier_name,
                        amount: inv.amount,
                        paymentMethod: inv.payment_method,
                        invoices: photos,
                        photo_cheque: inv.photo_cheque_url,
                        photo_verso: inv.photo_verso_url,
                        isFromFacturation: true,
                        invoiceId: inv.id,
                        doc_type: inv.doc_type,
                        doc_number: inv.doc_number
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
                const dayExtras = extras.rows.filter(r => normalizeDate(r.date) === dayStr);
                const dayPrimes = primes.rows.filter(r => normalizeDate(r.date) === dayStr);
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
                const totalDiponce = sumDiponce + sumDivers + sumJournalier + sumAdmin + dayAvances.reduce((s, r) => s + (parseFloat(r.montant) || 0), 0) + dayDoublages.reduce((s, r) => s + (parseFloat(r.montant) || 0), 0) + dayExtras.reduce((s, r) => s + (parseFloat(r.montant) || 0), 0) + dayPrimes.reduce((s, r) => s + (parseFloat(r.montant) || 0), 0);
                const recetteCaisse = parseFloat(row.recette_de_caisse) || 0;
                const recetteNet = recetteCaisse - totalDiponce;

                return {
                    ...row,
                    is_locked: row.is_locked,
                    total_diponce: totalDiponce.toString(),
                    recette_net: recetteNet.toString(),
                    diponce: JSON.stringify(combinedDiponce),
                    diponce_divers: typeof row.diponce_divers === 'string' ? row.diponce_divers : JSON.stringify(row.diponce_divers || []),
                    diponce_journalier: typeof row.diponce_journalier === 'string' ? row.diponce_journalier : JSON.stringify(row.diponce_journalier || []),
                    diponce_admin: typeof row.diponce_admin === 'string' ? row.diponce_admin : JSON.stringify(row.diponce_admin || []),
                    avances_details: dayAvances.map(r => ({ id: r.id, username: r.username, montant: r.montant.toString(), date: r.date })),
                    doublages_details: dayDoublages.map(r => ({ id: r.id, username: r.username, montant: r.montant.toString(), date: r.date })),
                    extras_details: dayExtras.map(r => ({ id: r.id, username: r.username, montant: r.montant.toString(), date: r.date })),
                    primes_details: dayPrimes.map(r => ({ id: r.id, username: r.username, montant: r.montant.toString(), date: r.date }))
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

                        res.rows.forEach((r: any) => {
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

            const [netRes, invoicesRes, unpaidInvoicesRes, tpeRes, chequeRes, cashRes, bankRes, caisseRes, expRes, ticketRes, riadhRes] = await Promise.all([
                query(`SELECT SUM(CAST(NULLIF(REPLACE(recette_net, ',', '.'), '') AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(amount, ',', '.'), '') AS NUMERIC)) as total FROM invoices WHERE status = 'paid' AND paid_date ${dateFilter.replace('date', 'paid_date')}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(amount, ',', '.'), '') AS NUMERIC)) as total FROM invoices WHERE status = 'unpaid' AND date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(tpe, ',', '.'), '') AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(cheque_bancaire, ',', '.'), '') AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(espaces, ',', '.'), '') AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(amount, ',', '.'), '') AS NUMERIC)) as total FROM bank_deposits WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(recette_de_caisse, ',', '.'), '') AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(total_diponce, ',', '.'), '') AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(tickets_restaurant, ',', '.'), '') AS NUMERIC)) as total FROM chiffres WHERE date ${dateFilter}`, params),
                query(`SELECT SUM(CAST(NULLIF(REPLACE(amount, ',', '.'), '') AS NUMERIC)) as total FROM invoices WHERE status = 'paid' AND payer = 'riadh' AND paid_date ${dateFilter.replace('date', 'paid_date')}`, params)
            ]);

            const tBankDeposits = parseFloat(bankRes.rows[0]?.total || '0');
            const tCash = parseFloat(cashRes.rows[0]?.total || '0');

            return {
                totalRecetteNette: parseFloat(netRes.rows[0]?.total || '0'),
                totalFacturesPayees: parseFloat(invoicesRes.rows[0]?.total || '0'),
                totalUnpaidInvoices: parseFloat(unpaidInvoicesRes.rows[0]?.total || '0'),
                totalTPE: parseFloat(tpeRes.rows[0]?.total || '0'),
                totalCheque: parseFloat(chequeRes.rows[0]?.total || '0'),
                totalCash: tCash - tBankDeposits,
                totalBankDeposits: tBankDeposits,
                totalRecetteCaisse: parseFloat(caisseRes.rows[0]?.total || '0'),
                totalExpenses: parseFloat(expRes.rows[0]?.total || '0'),
                totalTicketsRestaurant: parseFloat(ticketRes.rows[0]?.total || '0'),
                totalRiadhExpenses: parseFloat(riadhRes.rows[0]?.total || '0')
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

            const res = await query(`SELECT * FROM bank_deposits ${dateFilter} ORDER BY date DESC, id DESC`, params);
            return res.rows;
        },
        getEmployees: async () => {
            const res = await query('SELECT * FROM employees ORDER BY name ASC');
            return res.rows;
        },
        getLockedDates: async () => {
            const res = await query('SELECT date FROM chiffres WHERE is_locked = true');
            return res.rows.map(r => r.date);
        },
        getDailyExpenses: async (_: any, { month, startDate, endDate }: { month?: string, startDate?: string, endDate?: string }) => {
            let start = startDate;
            let end = endDate;

            if (month) {
                start = `${month}-01`;
                const [y, m] = month.split('-');
                const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
                end = `${month}-${String(lastDay).padStart(2, '0')}`;
            }

            if (!start || !end) return [];

            const [res, avances, doublages, extras, primes] = await Promise.all([
                query('SELECT * FROM chiffres WHERE date >= $1 AND date <= $2 ORDER BY date ASC', [start, end]),
                query('SELECT id, date, employee_name as username, montant FROM advances WHERE date >= $1 AND date <= $2 ORDER BY id DESC', [start, end]),
                query('SELECT id, date, employee_name as username, montant FROM doublages WHERE date >= $1 AND date <= $2 ORDER BY id DESC', [start, end]),
                query('SELECT id, date, employee_name as username, montant FROM extras WHERE date >= $1 AND date <= $2 ORDER BY id DESC', [start, end]),
                query('SELECT id, date, employee_name as username, montant FROM primes WHERE date >= $1 AND date <= $2 ORDER BY id DESC', [start, end])
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

            const allDatesSet = new Set<string>();
            res.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            avances.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            doublages.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            extras.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });
            primes.rows.forEach(r => { const d = normalizeDate(r.date); if (d) allDatesSet.add(d); });

            const sortedDates = Array.from(allDatesSet).sort();

            const avancesByDate: Record<string, any[]> = {};
            avances.rows.forEach(r => {
                const d = normalizeDate(r.date);
                if (d) {
                    if (!avancesByDate[d]) avancesByDate[d] = [];
                    avancesByDate[d].push({ ...r, montant: parseFloat(r.montant || '0') });
                }
            });
            const doublagesByDate: Record<string, any[]> = {};
            doublages.rows.forEach(r => {
                const d = normalizeDate(r.date);
                if (d) {
                    if (!doublagesByDate[d]) doublagesByDate[d] = [];
                    doublagesByDate[d].push({ ...r, montant: parseFloat(r.montant || '0') });
                }
            });
            const extrasByDate: Record<string, any[]> = {};
            extras.rows.forEach(r => {
                const d = normalizeDate(r.date);
                if (d) {
                    if (!extrasByDate[d]) extrasByDate[d] = [];
                    extrasByDate[d].push({ ...r, montant: parseFloat(r.montant || '0') });
                }
            });
            const primesByDate: Record<string, any[]> = {};
            primes.rows.forEach(r => {
                const d = normalizeDate(r.date);
                if (d) {
                    if (!primesByDate[d]) primesByDate[d] = [];
                    primesByDate[d].push({ ...r, montant: parseFloat(r.montant || '0') });
                }
            });

            const chiffresByDate: Record<string, any> = {};
            res.rows.forEach(r => {
                const d = normalizeDate(r.date);
                if (d) chiffresByDate[d] = r;
            });

            return sortedDates.map(d => {
                const c = chiffresByDate[d] || { date: d };
                return {
                    ...c,
                    diponce: typeof c.diponce === 'object' ? JSON.stringify(c.diponce) : c.diponce,
                    diponce_divers: typeof c.diponce_divers === 'object' ? JSON.stringify(c.diponce_divers) : c.diponce_divers,
                    diponce_journalier: typeof c.diponce_journalier === 'object' ? JSON.stringify(c.diponce_journalier) : c.diponce_journalier,
                    diponce_admin: typeof c.diponce_admin === 'object' ? JSON.stringify(c.diponce_admin) : c.diponce_admin,
                    avances_details: avancesByDate[d] || [],
                    doublages_details: doublagesByDate[d] || [],
                    extras_details: extrasByDate[d] || [],
                    primes_details: primesByDate[d] || []
                };
            });
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
            const existing = await query('SELECT id, is_locked FROM chiffres WHERE date = $1', [date]);

            let res;
            if (existing.rows.length > 0) {
                if (existing.rows[0].is_locked) {
                    // Normally we should check role here, but we'll enforce it on frontend.
                    // If we want hard enforcement, we'd need context with user info.
                }

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
            diponce_admin = $13::jsonb,
            is_locked = true
          WHERE date = $14 RETURNING *`,
                    [recette_de_caisse, total_diponce, diponceToSave, recette_net, tpe, cheque_bancaire, espaces, tickets_restaurant, extra, primes, diponceDiversToSave, diponceJournalierToSave, diponceAdminToSave, date]
                );
            } else {
                // Insert
                res = await query(
                    `INSERT INTO chiffres (date, recette_de_caisse, total_diponce, diponce, recette_net, tpe, cheque_bancaire, espaces, tickets_restaurant, extra, primes, diponce_divers, diponce_journalier, diponce_admin, is_locked)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14::jsonb, true) RETURNING *`,
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
                invoices: (() => {
                    let photos = [];
                    try {
                        photos = typeof inv.photos === 'string' ? JSON.parse(inv.photos) : (Array.isArray(inv.photos) ? inv.photos : []);
                    } catch (e) { photos = []; }
                    if (inv.photo_url && !photos.includes(inv.photo_url)) {
                        photos = [inv.photo_url, ...photos];
                    }
                    return photos;
                })(),
                photo_cheque: inv.photo_cheque_url,
                photo_verso: inv.photo_verso_url,
                isFromFacturation: true,
                invoiceId: inv.id,
                doc_type: inv.doc_type,
                doc_number: inv.doc_number
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
        addInvoice: async (_: any, { supplier_name, amount, date, photo_url, photos, doc_type, doc_number }: any) => {
            const res = await query(
                'INSERT INTO invoices (supplier_name, amount, date, photo_url, photos, doc_type, doc_number) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING *',
                [supplier_name, amount, date, photo_url, photos || '[]', doc_type || 'Facture', doc_number]
            );
            const row = res.rows[0];
            return {
                ...row,
                photos: JSON.stringify(row.photos || [])
            };
        },
        payInvoice: async (_: any, { id, payment_method, paid_date, photo_cheque_url, photo_verso_url, payer }: any) => {
            const res = await query(
                "UPDATE invoices SET status = 'paid', payment_method = $1, paid_date = $2, photo_cheque_url = $3, photo_verso_url = $4, payer = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
                [payment_method, paid_date, photo_cheque_url, photo_verso_url, payer, id]
            );
            const row = res.rows[0];
            return {
                ...row,
                photos: JSON.stringify(row.photos || [])
            };
        },
        deleteInvoice: async (_: any, { id }: { id: number }) => {
            await query('DELETE FROM invoices WHERE id = $1', [id]);
            return true;
        },
        unpayInvoice: async (_: any, { id }: { id: number }) => {
            const res = await query(
                "UPDATE invoices SET status = 'unpaid', payment_method = NULL, paid_date = NULL, photo_cheque_url = NULL, photo_verso_url = NULL, payer = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
                [id]
            );
            const row = res.rows[0];
            return {
                ...row,
                photos: typeof row.photos === 'string' ? row.photos : JSON.stringify(row.photos || [])
            };
        },
        updateInvoice: async (_: any, { id, supplier_name, amount, date, photo_url, photos, doc_type, doc_number, payment_method, paid_date, category }: any) => {
            const fields = [];
            const params = [];
            if (supplier_name !== undefined) { params.push(supplier_name); fields.push(`supplier_name = $${params.length}`); }
            if (amount !== undefined) { params.push(amount); fields.push(`amount = $${params.length}`); }
            if (date !== undefined) { params.push(date); fields.push(`date = $${params.length}`); }
            if (photo_url !== undefined) { params.push(photo_url); fields.push(`photo_url = $${params.length}`); }
            if (photos !== undefined) { params.push(photos); fields.push(`photos = $${params.length}::jsonb`); }
            if (doc_type !== undefined) { params.push(doc_type); fields.push(`doc_type = $${params.length}`); }
            if (doc_number !== undefined) { params.push(doc_number); fields.push(`doc_number = $${params.length}`); }
            if (payment_method !== undefined) { params.push(payment_method); fields.push(`payment_method = $${params.length}`); }
            if (paid_date !== undefined) { params.push(paid_date); fields.push(`paid_date = $${params.length}`); }
            if (category !== undefined) { params.push(category); fields.push(`category = $${params.length}`); }

            if (fields.length === 0) {
                const r = await query('SELECT * FROM invoices WHERE id = $1', [id]);
                return { ...r.rows[0], photos: typeof r.rows[0].photos === 'string' ? r.rows[0].photos : JSON.stringify(r.rows[0].photos || []) };
            }

            params.push(id);
            const res = await query(
                `UPDATE invoices SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`,
                params
            );
            const row = res.rows[0];
            return {
                ...row,
                photos: typeof row.photos === 'string' ? row.photos : JSON.stringify(row.photos || [])
            };
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
        upsertDesignation: async (_: any, { name, type }: { name: string, type?: string }) => {
            const normalized = name.trim();
            const existing = await query('SELECT * FROM designations WHERE LOWER(name) = LOWER($1)', [normalized]);
            if (existing.rows.length > 0) {
                if (type && existing.rows[0].type !== type) {
                    const res = await query('UPDATE designations SET type = $1 WHERE id = $2 RETURNING *', [type, existing.rows[0].id]);
                    return res.rows[0];
                }
                return existing.rows[0];
            }

            const res = await query('INSERT INTO designations (name, type) VALUES ($1, $2) RETURNING *', [normalized, type || 'divers']);
            return res.rows[0];
        },
        updateDesignation: async (_: any, { id, name, type }: { id: number, name: string, type?: string }) => {
            let sql = 'UPDATE designations SET name = $1';
            const params: any[] = [name.trim()];
            if (type) {
                params.push(type);
                sql += `, type = $${params.length}`;
            }
            params.push(id);
            sql += ` WHERE id = $${params.length} RETURNING *`;
            const res = await query(sql, params);
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
        updateBankDeposit: async (_: any, { id, amount, date }: { id: number, amount: string, date: string }) => {
            const res = await query(
                'UPDATE bank_deposits SET amount = $1, date = $2 WHERE id = $3 RETURNING *',
                [amount, date, id]
            );
            return res.rows[0];
        },
        deleteBankDeposit: async (_: any, { id }: { id: number }) => {
            await query('DELETE FROM bank_deposits WHERE id = $1', [id]);
            return true;
        },
        addPaidInvoice: async (_: any, args: any) => {
            const { supplier_name, amount, date, photo_url, photos, photo_cheque_url, photo_verso_url, payment_method, paid_date, doc_type, doc_number, payer, category } = args;
            const res = await query(
                "INSERT INTO invoices (supplier_name, amount, date, photo_url, photos, photo_cheque_url, photo_verso_url, status, payment_method, paid_date, doc_type, doc_number, payer, origin, category, updated_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, 'paid', $8, $9, $10, $11, $12, 'direct_expense', $13, CURRENT_TIMESTAMP) RETURNING *",
                [supplier_name, amount, date, photo_url, photos || '[]', photo_cheque_url, photo_verso_url, payment_method, paid_date, doc_type || 'Facture', doc_number, payer, category]
            );
            const row = res.rows[0];
            return {
                ...row,
                photos: JSON.stringify(row.photos || [])
            };
        },
        unlockChiffre: async (_: any, { date }: { date: string }) => {
            const res = await query('UPDATE chiffres SET is_locked = false WHERE date = $1 RETURNING *', [date]);
            return res.rows[0];
        },
        upsertEmployee: async (_: any, { name, department }: { name: string, department?: string }) => {
            const normalized = name.trim();
            const existing = await query('SELECT * FROM employees WHERE LOWER(name) = LOWER($1)', [normalized]);
            if (existing.rows.length > 0) {
                if (department && existing.rows[0].department !== department) {
                    const updated = await query('UPDATE employees SET department = $1 WHERE id = $2 RETURNING *', [department, existing.rows[0].id]);
                    return updated.rows[0];
                }
                return existing.rows[0];
            }
            const res = await query('INSERT INTO employees (name, department) VALUES ($1, $2) RETURNING *', [normalized, department || null]);
            return res.rows[0];
        },
        updateEmployee: async (_: any, { id, name, department }: { id: number, name: string, department?: string }) => {
            const res = await query('UPDATE employees SET name = $1, department = $2 WHERE id = $3 RETURNING *', [name.trim(), department || null, id]);
            return res.rows[0];
        },
        deleteEmployee: async (_: any, { id }: { id: number }) => {
            await query('DELETE FROM employees WHERE id = $1', [id]);
            return true;
        },
        addAvance: async (_: any, { username, amount, date }: any) => {
            const res = await query('INSERT INTO advances (employee_name, montant, date) VALUES ($1, $2, $3) ON CONFLICT (employee_name, date) DO UPDATE SET montant = $2 RETURNING id, employee_name as username, montant', [username, amount, date]);
            const row = res.rows[0];
            return { ...row, montant: parseFloat(row.montant) };
        },
        deleteAvance: async (_: any, { id }: any) => {
            await query('DELETE FROM advances WHERE id = $1', [id]);
            return true;
        },
        addDoublage: async (_: any, { username, amount, date }: any) => {
            const res = await query('INSERT INTO doublages (employee_name, montant, date) VALUES ($1, $2, $3) ON CONFLICT (employee_name, date) DO UPDATE SET montant = $2 RETURNING id, employee_name as username, montant', [username, amount, date]);
            const row = res.rows[0];
            return { ...row, montant: parseFloat(row.montant) };
        },
        deleteDoublage: async (_: any, { id }: any) => {
            await query('DELETE FROM doublages WHERE id = $1', [id]);
            return true;
        },
        addExtra: async (_: any, { username, amount, date }: any) => {
            const res = await query('INSERT INTO extras (employee_name, montant, date) VALUES ($1, $2, $3) ON CONFLICT (employee_name, date) DO UPDATE SET montant = $2 RETURNING id, employee_name as username, montant', [username, amount, date]);
            const row = res.rows[0];
            return { ...row, montant: parseFloat(row.montant) };
        },
        deleteExtra: async (_: any, { id }: any) => {
            await query('DELETE FROM extras WHERE id = $1', [id]);
            return true;
        },
        addPrime: async (_: any, { username, amount, date }: any) => {
            const res = await query('INSERT INTO primes (employee_name, montant, date) VALUES ($1, $2, $3) ON CONFLICT (employee_name, date) DO UPDATE SET montant = $2 RETURNING id, employee_name as username, montant', [username, amount, date]);
            const row = res.rows[0];
            return { ...row, montant: parseFloat(row.montant) };
        },
        deletePrime: async (_: any, { id }: any) => {
            await query('DELETE FROM primes WHERE id = $1', [id]);
            return true;
        },
    },
};
