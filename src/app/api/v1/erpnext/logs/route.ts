import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate } from '@/lib/erpnext-client';

// We use the ERPNext 'Note' DocType to store system-wide audit logs
// Professional approach: Custom DocType 'Audit Log' would be better, but 'Note' is available by default.

export async function GET() {
  try {
    const notes = await erpnextGet('Note', [['content', 'like', '[Audit Log]%']], ['name', 'title', 'content', 'creation'], 100);
    
    const logs = notes.map((n: any) => {
      try {
        const rawContent = n.content.replace('[Audit Log] ', '');
        const parsed = JSON.parse(rawContent);
        return {
          timestamp: new Date(n.creation).getTime(),
          ...parsed
        };
      } catch (e) {
        return {
          timestamp: new Date(n.creation).getTime(),
          user: 'System',
          action: 'Legacy Log',
          details: n.content
        };
      }
    }).sort((a: any, b: any) => b.timestamp - a.timestamp);

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Logs GET Error:', error.message);
    return NextResponse.json([], { status: 200 }); // Return empty instead of error for UX
  }
}

export async function POST(req: NextRequest) {
  try {
    const log = await req.json();
    
    await erpnextCreate('Note', {
      title: `${log.action} - ${new Date().toISOString()}`,
      content: `[Audit Log] ${JSON.stringify(log)}`,
      public: 0
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Logs POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
