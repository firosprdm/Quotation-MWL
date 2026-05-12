import { NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(req: Request) {
  const body = await req.json();
  fs.writeFileSync('pdf-error.log', JSON.stringify(body, null, 2) + '\n', { flag: 'a' });
  console.log('BROWSER LOG:', body);
  return NextResponse.json({ success: true });
}
