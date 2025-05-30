import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ingredientName = searchParams.get('name');

  const filterFormula = `FIND(LOWER('${ingredientName}'), LOWER({Ingredient})) > 0`;

  const res = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Recipe_Ingredients?filterByFormula=${encodeURIComponent(filterFormula)}`, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Erreur chargement recettes' }, { status: 500 });
  }

  const data = await res.json();
  const recipeNames = data.records.map((rec: any) => rec.fields['Name (from Recipe)']).filter(Boolean);

  return NextResponse.json([...new Set(recipeNames)]); // Remove duplicates
}
