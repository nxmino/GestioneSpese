import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, addExpense } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const person = searchParams.get('person') || undefined;
        const category = searchParams.get('category') || undefined;
        const month = searchParams.get('month') || undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

        const expenses = await getExpenses({ person, category, month, limit });
        return NextResponse.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount, description, category, person, date } = body;

        if (!amount || !description || !person) {
            return NextResponse.json(
                { error: 'Amount, description, and person are required' },
                { status: 400 }
            );
        }

        const expense = await addExpense({
            amount: parseFloat(amount),
            description,
            category: category || 'altro',
            person,
            date: date || new Date().toISOString().split('T')[0],
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error('Error adding expense:', error);
        return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
    }
}
