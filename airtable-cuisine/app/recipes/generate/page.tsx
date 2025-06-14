'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChefHat, Loader2, X } from 'lucide-react';

type Recipe = {
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  restrictions: string[];
  ingredients: string[];
  steps: string[];
  nutritionAnalysis: string;
};

export default function GenerateRecipePage() {
  const [ingredients, setIngredients] = useState<{ id: string; name: string }[]>([]);
  const [restrictions, setRestrictions] = useState<{ id: string; name: string }[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedRestriction, setSelectedRestriction] = useState('');
  const [usedIngredients, setUsedIngredients] = useState<string[]>([]);
  const [usedRestrictions, setUsedRestrictions] = useState<string[]>([]);
  const [servings, setServings] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [displayRecipe, setDisplayRecipe] = useState<Recipe | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ingredients').then(r => r.json()).then(setIngredients).catch(console.error);
    fetch('/api/restrictions').then(r => r.json()).then(setRestrictions).catch(console.error);
  }, []);

  const addIngredient = () => {
    if (selectedIngredient && !usedIngredients.includes(selectedIngredient)) {
      setUsedIngredients(prev => [...prev, selectedIngredient]);
      setSelectedIngredient('');
    }
  };

  const addRestriction = () => {
    if (selectedRestriction && !usedRestrictions.includes(selectedRestriction)) {
      setUsedRestrictions(prev => [...prev, selectedRestriction]);
      setSelectedRestriction('');
    }
  };

  const removeIngredient = (i: string) => setUsedIngredients(prev => prev.filter(x => x !== i));
  const removeRestriction = (r: string) => setUsedRestrictions(prev => prev.filter(x => x !== r));

  const clearAll = () => {
    setUsedIngredients([]);
    setUsedRestrictions([]);
    setDisplayRecipe(null);
  };

  const handleSubmit = async () => {
    if (!usedIngredients.length) {
      alert('Veuillez ajouter au moins un ingrédient');
      return;
    }

    setLoading(true);
    setDisplayRecipe(null);

    const prompt = `
EN FRANÇAIS je veux une recette de cuisine avec les ingrédients suivants et les restrictions éventuelles et une analyse nutritionnelle complète. 
Le JSON doit respecter ce format, dans "steps" il faut mettre les étapes de la recette, et dans "description" un texte descriptif de la recette, et "name" doit être le nom de la recette.
je veux que pour le step ce soit bien detaillé, avec des phrases complètes et pas juste une liste d'actions. le JSON doit etre au format suivant et NE DOIT contenir aucun texte avant ou après.
Tous les champs numériques doivent être des nombres sans unités.
Les champs vitamins et minerals doivent être inclus dans nutrition.
Les ingrédients doivent être listés sous forme de noms simples, **sans quantité, sans unité**.Exemples valides : "riz", "farine", "beurre".
{
  "name": string,
  "description": string,
  "prepTime": number,
  "cookTime": number,
  "difficulty": "Easy"|"Medium"|"Hard",
  "restrictions": string[],
  "ingredients": string[],
  "steps": string[],
  "nutrition": {
    "calories": number,
    "proteins": number,
    "carbohydrates": number,
    "fats": number,
    "vitamins": { [nom: string]: string },
    "minerals": { [nom: string]: string }
  }
}
Fin JSON.

Recette avec ces ingrédients : ${usedIngredients.join(', ')}. Pour ${servings} personnes.
${usedRestrictions.length ? `Restrictions : ${usedRestrictions.join(', ')}` : ''}`.trim();

    try {
      const llmRes = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'mistral',
          options: { temperature: 0.7 },
        }),
      });

      const llmJson = await llmRes.json();
      let content = llmJson.message.content as string;
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      content = content.slice(start, end + 1);
      const payload = JSON.parse(content);
      payload.servings = servings;

      const nutrition = payload.nutrition || {};
      const vitamins = nutrition.vitamins || payload.vitamins || {};
      const minerals = nutrition.minerals || payload.minerals || {};

      const nutritionSummary = `
        Calories: ${nutrition.calories ?? payload.calories} kcal
        Protéines: ${nutrition.proteins ?? payload.proteins} g
        Glucides: ${nutrition.carbohydrates ?? payload.carbohydrates} g
        Lipides: ${nutrition.fats ?? payload.fats} g
        Vitamines: ${Object.entries(vitamins).map(([k, v]) => `${k}: ${v}`).join(', ') || 'N/A'}
        Minéraux: ${Object.entries(minerals).map(([k, v]) => `${k}: ${v}`).join(', ') || 'N/A'}
      `.trim();

      const saveRes = await fetch('/api/save-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, nutritionAnalysis: nutritionSummary }),
      });

      const saveJson = await saveRes.json();

      if (saveJson.success) {
        setDisplayRecipe({ ...payload, nutritionAnalysis: nutritionSummary });
        setSuccessMessage("Recette ajoutée avec succès !");
        setTimeout(() => setSuccessMessage(null), 10000); 
      }
      else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (e) {
      console.error(e);
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center items-start min-h-screen px-4 pt-20">
    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ChefHat className="h-8 w-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-gray-800">Générateur de Recette IA</h1>
      </div>

        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded shadow transition-opacity duration-500">
            {successMessage}
          </div>
        )}


      {/* Formulaire */}
      <div className="w-full space-y-6 mb-6">
          <div>
          <Label className="text-lg font-semibold text-gray-800 dark:text-black">
            Ajouter un ingrédient
          </Label>            
            <div className="flex gap-2 mt-2">
              <Input
                list="ings"
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                placeholder="Ingrédient"
                className="flex-1 text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <datalist id="ings">
                {ingredients.map((i) => (
                  <option key={i.id} value={i.name} />
                ))}
              </datalist>
              <Button
                onClick={addIngredient}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Ajouter
              </Button>
            </div>
          </div>

          <div>
          <Label className="text-lg font-semibold text-gray-800 dark:text-black">Ajouter une restriction</Label>
            <div className="flex gap-2 mt-2">
              <Input
                list="ress"
                value={selectedRestriction}
                onChange={(e) => setSelectedRestriction(e.target.value)}
                placeholder="Restriction"
                className="flex-1 text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <datalist id="ress">
                {restrictions.map((r) => (
                  <option key={r.id} value={r.name} />
                ))}
              </datalist>
              <Button
                onClick={addRestriction}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Ajouter
              </Button>
            </div>
          </div>

          <div>
          <Label className="text-lg font-semibold text-gray-800 dark:text-black">
            Nombre de personnes
          </Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value))}
              className="flex-1 text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {usedIngredients.length > 0 && (
              <div>
                <Label className="font-semibold">Ingrédients</Label>
                {usedIngredients.map((i) => (
                  <div
                    key={i}
                    className="flex justify-between bg-green-100 p-2 rounded mt-2 dark:text-black"
                  >
                    <span>{i}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeIngredient(i)}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {usedRestrictions.length > 0 && (
              <div>
                <Label className="font-semibold">Restrictions</Label>
                {usedRestrictions.map((r) => (
                  <div
                    key={r}
                    className="flex justify-between bg-yellow-100 p-2 rounded mt-2 dark:text-black"
                  >
                    <span>{r}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRestriction(r)}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || !usedIngredients.length}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  Chargement…
                </>
              ) : (
                'Générer recette'
              )}
            </Button>
            <Button onClick={clearAll} variant="outline" className="px-4 py-2 dark:text-black">
              Tout effacer
            </Button>
          </div>
      </div>

      {/* Affichage de la recette */}
      {displayRecipe && (
        <Card className="mt-6 shadow-lg">
          <CardContent className="p-6 text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 space-y-2">
            <div>🍽️ <strong>Recette</strong> : {displayRecipe.name}</div>
            <div>📜 <strong>Description</strong> : {displayRecipe.description}</div>
            <div>⏱️ <strong>Préparation</strong> : {displayRecipe.prepTime} min</div>
            <div>🔥 <strong>Cuisson</strong> : {displayRecipe.cookTime} min</div>
            <div>💪 <strong>Difficulté</strong> : {displayRecipe.difficulty}</div>
            <div>🍽️ <strong>Portions</strong> : {displayRecipe.servings != null ? `${displayRecipe.servings} personne${displayRecipe.servings > 1 ? 's' : ''}` : 'Non spécifiées'}</div>
            {displayRecipe.restrictions.length > 0 && (
              <div>🚫 <strong>Restrictions</strong> : {displayRecipe.restrictions.join(', ')}</div>
            )}
            <div>📝 <strong>Ingrédients</strong> : {displayRecipe.ingredients.join(', ')}</div>
            <div>
              👩‍🍳 <strong>Étapes</strong> :
              <ol className="list-decimal list-inside mt-1 space-y-1">
                {displayRecipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              📊 <strong>Analyse nutritionnelle</strong> :
              <pre className="whitespace-pre-wrap font-mono bg-gray-50 p-2 mt-1 rounded dark:text-black ">
                {displayRecipe.nutritionAnalysis}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}    
    </div>
    </main>
  );
}
