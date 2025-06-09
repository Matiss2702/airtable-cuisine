import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Restrictions`, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Erreur chargement Airtable' }, { status: 500 });
  }

  const data = await res.json();

  const records = data.records.map((rec: any) => ({
    id: rec.id,
    name: rec.fields.Name || 'Restriction inconnue',
  }));

  return NextResponse.json(records);
}
