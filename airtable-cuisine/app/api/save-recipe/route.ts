import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const BASE_ID      = process.env.AIRTABLE_BASE_ID!;
  const API_KEY      = process.env.AIRTABLE_API_KEY!;
  const TAB_REC      = 'Recipes';
  const TAB_ING      = 'Ingredients';
  const TAB_RESTR    = 'DietaryRestrictions';
  const TAB_LINK_ING = 'Recipe_Ingredients';

  try {
    const {
      name,
      prepTime,
      cookTime,
      difficulty,
      restrictions,
      ingredients,
      steps,
      nutritionAnalysis
    } = await request.json();

    // ─── Lookup ou création des restrictions ─────────────────────────────────────
    let restrictionIds: string[] = [];
    if (restrictions?.length) {
      const lists = await Promise.all(
        restrictions.map((r: string) =>
          fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${TAB_RESTR}?filterByFormula=Name%3D'${encodeURIComponent(r)}'`,
            { headers: { Authorization: `Bearer ${API_KEY}` } }
          ).then(r => r.json())
        )
      );
      restrictionIds = lists
      .map(l => l.records?.[0]?.id)
      .filter((id): id is string => Boolean(id));
    }

    // ─── Lookup ou création des ingrédients & collecte de leurs IDs ──────────────
    const ingredientIds: string[] = [];
    await Promise.all(
      ingredients.map(async (ingName: string) => {
        // a) lookup
        let list = await fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${TAB_ING}?filterByFormula=Name%3D'${encodeURIComponent(ingName)}'`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        ).then(r => r.json());

        let ingId = list.records?.[0]?.id;
        // b) si pas trouvé, on crée
        if (!ingId) {
          const createIng = await fetch(
            `https://api.airtable.com/v0/${BASE_ID}/${TAB_ING}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ fields: { Name: ingName } }),
            }
          ).then(r => r.json());

          ingId = createIng.id;
        }

        // c) on stocke l'ID pour 1) Recipe.Ingredients et 2) Recipe_Ingredients
        if (ingId) ingredientIds.push(ingId);
      })
    );

    // ─── Création du record Recipe AVEC lien direct vers Ingredients ─────────────
    const recFields: Record<string, any> = {
      Name:        name,
      Description: steps.join('\n'),
      PrepTime:    Number(prepTime),
      CookTime:    Number(cookTime),
      Difficulty:  difficulty,
      Ingredients: ingredientIds,
      NutritionAnalysis: nutritionAnalysis,
    };
    if (restrictionIds.length) {
      recFields.DietaryRestrictions = restrictionIds;
    }

    const createRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TAB_REC}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: recFields }),
      }
    );
    const created = await createRes.json();
    if (!createRes.ok) {
      console.error('Airtable Recipes error:', created);
      return NextResponse.json({ error: created }, { status: 500 });
    }
    const recipeId = created.id;

    // ─── Création des jointures dans Recipe_Ingredients (optionnel) ──────────────
    await Promise.all(
      ingredientIds.map(ingId =>
        fetch(
          `https://api.airtable.com/v0/${BASE_ID}/${TAB_LINK_ING}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                Recipe:     [recipeId],
                Ingredient: [ingId],
              },
            }),
          }
        )
      )
    );

    return NextResponse.json({ success: true, recipeId });
  } catch (e: any) {
    console.error('Save-recipe error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
