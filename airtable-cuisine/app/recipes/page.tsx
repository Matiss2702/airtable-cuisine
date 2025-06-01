'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChefHat, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';

type SavedRecipe = {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  servings: number;
  nutritionAnalysis: string;
  ingredientsLinkIds: string[];
  restrictionsIds: string[];
};

type ExpandedMap = Record<string, boolean>;

export default function RecipesPage() {
  // listes statiques
  const [ingredients, setIngredients] = useState<{ id: string; name: string }[]>([]);
  const [restrictions, setRestrictions] = useState<{ id: string; name: string }[]>([]);

  // form state
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedRestriction, setSelectedRestriction] = useState('');
  const [usedIngredients, setUsedIngredients] = useState<string[]>([]);
  const [usedRestrictions, setUsedRestrictions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // recettes sauvegardées
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [expanded, setExpanded] = useState<ExpandedMap>({});

  // résultat de la génération
  const [displayRecipe, setDisplayRecipe] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/ingredients').then(r => r.json()).then(setIngredients).catch(console.error);
    fetch('/api/restrictions').then(r => r.json()).then(setRestrictions).catch(console.error);
    fetch('/api/get-recipes').then(r => r.json()).then(setSavedRecipes).catch(console.error);
  }, []);

  const mapIdsToNames = (ids: string[], list: { id: string; name: string }[]) =>
    ids.map(id => list.find(item => item.id === id)?.name).filter(Boolean) as string[];

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

  const handleSubmit = async () => {
    if (!usedIngredients.length) {
      alert('Veuillez ajouter au moins un ingrédient');
      return;
    }
    setLoading(true);
    setDisplayRecipe(null);

    const prompt = `
    EN FRANÇAIS je veux une recette de cuisine avec les ingrédients suivants et les restrictions éventuelles.
    Le JSON doit respecter ce format, dans "steps" il faut mettre les étapes de la recette, et dans "description" un texte descriptif de la recette, et "name" doit être le nom de la recette.
    je veux que pour le step ce soit bien detaillé, avec des phrases complètes et pas juste une liste d'actions.:
    { 
      "name": string,
      "description": string,
      "prepTime": number,
      "cookTime": number,
      "difficulty": "Easy"|"Medium"|"Hard",
      "restrictions": string[],
      "ingredients": string[],
      "steps": string[]
    }
    Fin JSON.

    Recette avec ces ingrédients : ${usedIngredients.join(', ')}.
    ${usedRestrictions.length ? `Restrictions : ${usedRestrictions.join(', ')}.` : ''}`.trim();

    try {
      const llmRes = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'llama3', options: { temperature: 0.7 } }),
      });
      const llmJson = await llmRes.json();
      let content = llmJson.message.content as string;
      const start = content.indexOf('{');
      const end   = content.lastIndexOf('}');
      content = content.slice(start, end + 1);
      const payload = JSON.parse(content) as {
        name: string;
        description: string;
        prepTime: number;
        cookTime: number;
        difficulty: string;
        restrictions: string[];
        ingredients: string[];
        steps: string[];
      };

      // affichage intermédiaire
      const lines = [
        `🍽️ Recette : ${payload.name}`,
        `📜 Description : ${payload.description}`,
        `⏱️ Prépa : ${payload.prepTime} min`,
        `🔥 Cuisson : ${payload.cookTime} min`,
        `💪 Difficulté : ${payload.difficulty}`,
        payload.restrictions.length
          ? `🚫 Restrictions : ${payload.restrictions.join(', ')}`
          : null,
        `📝 Ingrédients :`,
        ...payload.ingredients.map(i => `   • ${i}`),
        `👩‍🍳 Étapes :`,
        ...payload.steps.map((s, i) => `   ${i + 1}. ${s}`),
      ].filter(Boolean).join('\n');
      setDisplayRecipe(lines);

      // enregistrement
      const saveRes = await fetch('/api/save-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saveJson = await saveRes.json();
      if (saveJson.success) {
        setSavedRecipes(await fetch('/api/get-recipes').then(r => r.json()));
      } else {
        console.error(saveJson);
        alert('Erreur lors de la sauvegarde');
      }
    } catch {
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setUsedIngredients([]);
    setUsedRestrictions([]);
    setDisplayRecipe(null);
  };

  return (
    <main className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
      {/* Formulaire */}
      <div className="flex items-center gap-3 mb-6">
        <ChefHat className="h-8 w-8 text-orange-600" />
        <h1 className="text-3xl font-bold text-gray-800">Générateur de Recette IA</h1>
      </div>
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Ingrédient */}
          <div>
            <Label className="text-lg font-semibold">Ajouter un ingrédient</Label>
            <div className="flex gap-2 mt-2">
              <Input
                list="ings"
                value={selectedIngredient}
                onChange={e => setSelectedIngredient(e.target.value)}
                placeholder="Ingrédient"
                className="flex-1"
              />
              <datalist id="ings">{ingredients.map(i => <option key={i.id} value={i.name} />)}</datalist>
              <Button onClick={addIngredient} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Ajouter
              </Button>
            </div>
          </div>
          {/* Restriction */}
          <div>
            <Label className="text-lg font-semibold">Ajouter une restriction</Label>
            <div className="flex gap-2 mt-2">
              <Input
                list="ress"
                value={selectedRestriction}
                onChange={e => setSelectedRestriction(e.target.value)}
                placeholder="Restriction"
                className="flex-1"
              />
              <datalist id="ress">{restrictions.map(r => <option key={r.id} value={r.name} />)}</datalist>
              <Button onClick={addRestriction} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded">
                Ajouter
              </Button>
            </div>
          </div>
          {/* Listes sélectionnées */}
          <div className="grid md:grid-cols-2 gap-4">
            {usedIngredients.length > 0 && (
              <div>
                <Label className="font-semibold">Ingrédients</Label>
                {usedIngredients.map(i => (
                  <div key={i} className="flex justify-between bg-green-100 p-2 rounded mt-2">
                    <span>{i}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeIngredient(i)}><X /></Button>
                  </div>
                ))}
              </div>
            )}
            {usedRestrictions.length > 0 && (
              <div>
                <Label className="font-semibold">Restrictions</Label>
                {usedRestrictions.map(r => (
                  <div key={r} className="flex justify-between bg-yellow-100 p-2 rounded mt-2">
                    <span>{r}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeRestriction(r)}><X /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Boutons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || !usedIngredients.length}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-3 rounded-lg"
            >
              {loading ? <><Loader2 className="animate-spin mr-2" />Chargement…</> : 'Générer recette'}
            </Button>
            <Button onClick={clearAll} variant="outline" className="px-4 py-2">
              Tout effacer
            </Button>
          </div>
        </div>

        {/* Sidebar détails des recettes */}
        <div className="space-y-4">
          {savedRecipes.map(recipe => {
            const isOpen = !!expanded[recipe.id];
            const ingNames = mapIdsToNames(recipe.ingredientsLinkIds, ingredients);
            const resNames = mapIdsToNames(recipe.restrictionsIds, restrictions);
            return (
              <Card key={recipe.id} className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => {
                    setExpanded(prev => ({ ...prev, [recipe.id]: !isOpen }));
                  }}>
                    <h3 className="font-semibold">{recipe.name}</h3>
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </div>
                  {isOpen && (
                    <div className="mt-2 text-xs text-gray-700 space-y-1">
                      <p className="text-gray-600">{recipe.description}</p>
                      <div>⏱️ Prépa : {recipe.prepTime} min</div>
                      <div>🔥 Cuisson : {recipe.cookTime} min</div>
                      <div>💪 Difficulté : {recipe.difficulty}</div>
                      {resNames.length > 0 && <div>🚫 Restrictions : {resNames.join(', ')}</div>}
                      {ingNames.length > 0 && <div>📝 Ingrédients : {ingNames.join(', ')}</div>}
                      {recipe.nutritionAnalysis && <div>👩‍🍳 Analyse : {recipe.nutritionAnalysis}</div>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Affichage de la recette générée */}
      {displayRecipe && (
        <Card className="mt-6 shadow-lg">
          <CardContent className="p-6 whitespace-pre-wrap font-mono">
            {displayRecipe}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
