import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate } from '@/lib/erpnext-client';

const NOTE_TITLE = '[SYSTEM] Expenses Data';

async function getExpensesNote() {
  const notes = await erpnextGet('Note', [['title', '=', NOTE_TITLE]]);
  if (notes && notes.length > 0) {
    return notes[0];
  }
  return null;
}

export async function GET() {
  try {
    const note = await getExpensesNote();
    if (!note || !note.content) {
      return NextResponse.json([]);
    }
    
    // The content is stored as HTML by Frappe Text Editor usually, strip tags if needed, 
    // or assume we store clean JSON string in the note.
    const cleanJson = note.content.replace(/<[^>]+>/g, '').trim();
    const expenses = JSON.parse(cleanJson || '[]');
    
    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error('Expenses GET Error:', error.message);
    // Return empty array on failure instead of crashing the app
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { expense } = await req.json();
    
    // Ensure the new expense has an ID
    const newExpense = {
      ...expense,
      id: expense.id || `EXP-${Date.now()}`,
      status: expense.status || 'pending',
    };

    // 1. Fetch existing
    let note = await getExpensesNote();
    let expenses = [];
    
    if (note && note.content) {
      try {
        const cleanJson = note.content.replace(/<[^>]+>/g, '').trim();
        expenses = JSON.parse(cleanJson || '[]');
      } catch (e) {
        expenses = [];
      }
    }

    // 2. Add new expense (Idempotency Check)
    const existingIndex = expenses.findIndex((e: any) => e.id === newExpense.id);
    if (existingIndex > -1) {
      console.log('Duplicate expense request detected. Returning existing record:', newExpense.id);
      return NextResponse.json({ ...expenses[existingIndex], duplicate: true });
    }
    
    expenses.push(newExpense);

    // 3. Save back
    const jsonStr = JSON.stringify(expenses);
    if (note) {
      await erpnextUpdate('Note', note.name, { content: jsonStr });
    } else {
      await erpnextCreate('Note', { title: NOTE_TITLE, content: jsonStr });
    }

    return NextResponse.json(newExpense);
  } catch (error: any) {
    console.error('Expenses POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, action, ...updates } = await req.json();
    
    let note = await getExpensesNote();
    if (!note || !note.content) {
      return NextResponse.json({ error: 'No expenses found' }, { status: 404 });
    }

    const cleanJson = note.content.replace(/<[^>]+>/g, '').trim();
    let expenses = JSON.parse(cleanJson || '[]');

    const index = expenses.findIndex((e: any) => e.id === id);
    if (index > -1) {
      if (action) {
         expenses[index].status = action === 'approve' ? 'approved' : (action === 'refuse' ? 'rejected' : 'pending');
      } else {
         expenses[index] = { ...expenses[index], ...updates };
      }

      await erpnextUpdate('Note', note.name, { content: JSON.stringify(expenses) });
      return NextResponse.json(expenses[index]);
    }

    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Expenses PUT Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    let note = await getExpensesNote();
    if (note && note.content) {
      const cleanJson = note.content.replace(/<[^>]+>/g, '').trim();
      let expenses = JSON.parse(cleanJson || '[]');
      
      expenses = expenses.filter((e: any) => e.id !== id);
      await erpnextUpdate('Note', note.name, { content: JSON.stringify(expenses) });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Expenses DELETE Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
