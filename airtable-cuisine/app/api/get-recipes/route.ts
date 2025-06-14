import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const BASE_ID = process.env.AIRTABLE_BASE_ID!
    const API_KEY = process.env.AIRTABLE_API_KEY!
    const TABLE   = 'Recipes'

    // On récupère jusqu'à 20 records (pas de tri nécessaire si tu n'as pas CreatedTime)
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Airtable list error:', err)
      return NextResponse.json(
        { error: 'Impossible de récupérer les recettes', details: err },
        { status: 500 }
      )
    }

    const { records } = await res.json()
    const data = records.map((r: any) => ({
      id:                 r.id,
      name:               r.fields.Name,
      description:        r.fields.Description,
      prepTime:           r.fields.PrepTime,
      cookTime:           r.fields.CookTime,
      difficulty:         r.fields.Difficulty,
      ingredientsLinkIds: r.fields.Recipe_Ingredients || [],
      restrictionsIds:    r.fields.Restrictions || [],
    }))

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Get-recipes unexpected error:', e)
    return NextResponse.json(
      { error: 'Erreur interne get-recipes', details: e.message },
      { status: 500 }
    )
  }
}
