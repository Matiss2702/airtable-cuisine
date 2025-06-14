'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

export default function RecipesList() {
  const [ingredients, setIngredients] = useState<{ id: string; name: string }[]>([]);
  const [restrictions, setRestrictions] = useState<{ id: string; name: string }[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [expanded, setExpanded] = useState<ExpandedMap>({});

  useEffect(() => {
    fetch('/api/ingredients').then(r => r.json()).then(setIngredients);
    fetch('/api/restrictions').then(r => r.json()).then(setRestrictions);
    fetch('/api/get-recipes').then(r => r.json()).then(setSavedRecipes);
  }, []);

  const mapIdsToNames = (ids: string[], list: { id: string; name: string }[]) =>
    ids.map(id => list.find(item => item.id === id)?.name).filter(Boolean) as string[];

  return (
    <main className="p-6 max-w-4xl mx-auto bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-orange-700">📚 Toutes les Recettes</h1>

      <Button asChild className="mb-6 bg-orange-500 hover:bg-orange-600 text-white">
        <a href="/recipes/generate">➕ Créer une nouvelle recette</a>
      </Button>

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
                    <div>🍽️ Portions : {recipe.servings}</div>
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
    </main>
  );
}
