'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChefHat, Loader2, X } from 'lucide-react';

export default function GenerateRecipePage() {
  const [ingredients, setIngredients] = useState<{ id: string; name: string }[]>([]);
  const [restrictions, setRestrictions] = useState<{ id: string; name: string }[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedRestriction, setSelectedRestriction] = useState('');
  const [usedIngredients, setUsedIngredients] = useState<string[]>([]);
  const [usedRestrictions, setUsedRestrictions] = useState<string[]>([]);
  const [servings, setServings] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [displayRecipe, setDisplayRecipe] = useState<string | null>(null);

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
    Les ingrédients doivent être listés sous forme de noms simples, **sans quantité, sans unité**.
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
    ${usedRestrictions.length ? `Restrictions : ${usedRestrictions.join(', ')}.` : ''}`.trim();

    try {
      const llmRes = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'mistral', options: { temperature: 0.7 } }),
      });
      const llmJson = await llmRes.json();
      let content = llmJson.message.content as string;
      const start = content.indexOf('{');
      const end   = content.lastIndexOf('}');
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
        alert('✅ Recette créée avec succès !');
        window.location.href = '/recipes/list';
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch {
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <ChefHat className="h-8 w-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-gray-800">Générateur de Recette IA</h1>
      </div>
      <Button 
        onClick={() => window.location.href = '/recipes/list'} 
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        Voir toutes les recettes
      </Button>
    </div>

      {/* Form */}
      <div className="space-y-6">
        <div>
          <Label>Ajouter un ingrédient</Label>
          <div className="flex gap-2 mt-2">
            <Input list="ings" value={selectedIngredient} onChange={e => setSelectedIngredient(e.target.value)} placeholder="Ingrédient" className="flex-1" />
            <datalist id="ings">{ingredients.map(i => <option key={i.id} value={i.name} />)}</datalist>
            <Button onClick={addIngredient} className="bg-green-600 text-white">Ajouter</Button>
          </div>
        </div>

        <div>
          <Label>Ajouter une restriction</Label>
          <div className="flex gap-2 mt-2">
            <Input list="ress" value={selectedRestriction} onChange={e => setSelectedRestriction(e.target.value)} placeholder="Restriction" className="flex-1" />
            <datalist id="ress">{restrictions.map(r => <option key={r.id} value={r.name} />)}</datalist>
            <Button onClick={addRestriction} className="bg-yellow-600 text-white">Ajouter</Button>
          </div>
        </div>

        <div>
          <Label>Nombre de personnes</Label>
          <Input type="number" min="1" value={servings} onChange={e => setServings(parseInt(e.target.value))} className="mt-2" />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={loading} className="bg-orange-600 text-white flex-1">
            {loading ? <><Loader2 className="animate-spin mr-2" />Chargement…</> : 'Générer recette'}
          </Button>
          <Button onClick={clearAll} variant="outline">Tout effacer</Button>
        </div>
      </div>

      {displayRecipe && (
        <pre className="mt-6 whitespace-pre-wrap bg-white p-4 rounded shadow font-mono">
          {displayRecipe}
        </pre>
      )}
    </main>
  );
}
