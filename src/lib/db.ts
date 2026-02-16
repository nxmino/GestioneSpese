import { neon } from '@neondatabase/serverless';

export interface Expense {
    id: number;
    amount: number;
    description: string;
    category: string;
    person: 'mino' | 'ambra';
    date: string;
    created_at: string;
}

export const CATEGORIES = [
    { id: 'spesa', label: 'Spesa', emoji: '🛒', color: '#00cec9' },
    { id: 'bollette', label: 'Bollette', emoji: '💡', color: '#fdcb6e' },
    { id: 'casa', label: 'Casa', emoji: '🏠', color: '#6c5ce7' },
    { id: 'trasporti', label: 'Trasporti', emoji: '🚗', color: '#e17055' },
    { id: 'salute', label: 'Salute', emoji: '💊', color: '#00b894' },
    { id: 'svago', label: 'Svago', emoji: '🎮', color: '#fd79a8' },
    { id: 'altro', label: 'Altro', emoji: '📦', color: '#636e72' },
] as const;

export function getCategoryInfo(id: string) {
    return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

function getSQL() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set. Please connect a Neon Postgres database in Vercel Storage.');
    }
    return neon(databaseUrl);
}

export async function initDB() {
    const sql = getSQL();
    await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      amount DECIMAL(10,2) NOT NULL,
      description VARCHAR(500) NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'altro',
      person VARCHAR(20) NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export async function getExpenses(filters?: {
    person?: string;
    category?: string;
    month?: string;
    limit?: number;
}) {
    await initDB();
    const sql = getSQL();

    // Build dynamic query
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (filters?.person) {
        conditions.push(`person = $${paramIndex++}`);
        params.push(filters.person);
    }
    if (filters?.category) {
        conditions.push(`category = $${paramIndex++}`);
        params.push(filters.category);
    }
    if (filters?.month) {
        conditions.push(`TO_CHAR(date, 'YYYY-MM') = $${paramIndex++}`);
        params.push(filters.month);
    }

    let query = `SELECT * FROM expenses WHERE ${conditions.join(' AND ')} ORDER BY date DESC, created_at DESC`;

    if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
    }

    const result = await sql.query(query, params);
    return result as unknown as Expense[];
}

export async function addExpense(expense: {
    amount: number;
    description: string;
    category: string;
    person: string;
    date: string;
}) {
    await initDB();
    const sql = getSQL();
    const result = await sql`
    INSERT INTO expenses (amount, description, category, person, date)
    VALUES (${expense.amount}, ${expense.description}, ${expense.category}, ${expense.person}, ${expense.date})
    RETURNING *
  `;
    return result[0] as Expense;
}

export async function deleteExpense(id: number) {
    await initDB();
    const sql = getSQL();
    await sql`DELETE FROM expenses WHERE id = ${id}`;
}

export async function getStats(month?: string) {
    await initDB();
    const sql = getSQL();

    const monthFilter = month
        ? `AND TO_CHAR(date, 'YYYY-MM') = '${month}'`
        : `AND TO_CHAR(date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')`;

    const totalResult = await sql.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1 ${monthFilter}`
    );

    const byPersonResult = await sql.query(
        `SELECT person, COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1 ${monthFilter} GROUP BY person`
    );

    const byCategoryResult = await sql.query(
        `SELECT category, COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1 ${monthFilter} GROUP BY category ORDER BY total DESC`
    );

    const monthlyResult = await sql.query(
        `SELECT TO_CHAR(date, 'YYYY-MM') as month, COALESCE(SUM(amount), 0) as total 
     FROM expenses 
     GROUP BY TO_CHAR(date, 'YYYY-MM') 
     ORDER BY month DESC 
     LIMIT 12`
    );

    return {
        total: parseFloat((totalResult as unknown as { total: string }[])[0]?.total || '0'),
        byPerson: (byPersonResult as unknown as { person: string; total: string }[]).reduce((acc: Record<string, number>, row) => {
            acc[row.person] = parseFloat(row.total);
            return acc;
        }, {} as Record<string, number>),
        byCategory: (byCategoryResult as unknown as { category: string; total: string }[]).map((row) => ({
            category: row.category,
            total: parseFloat(row.total),
        })),
        monthly: (monthlyResult as unknown as { month: string; total: string }[]).map((row) => ({
            month: row.month,
            total: parseFloat(row.total),
        })),
    };
}
