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
  const [searchName, setSearchName] = useState('');
  const [filterIngredients, setFilterIngredients] = useState<string[]>([]);
  const [filterRestrictions, setFilterRestrictions] = useState<string[]>([]);

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

    {/* Barre de recherche & filtres */}
    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6 space-y-4">
      <h2 className="text-lg font-semibold text-orange-700">🔎 Rechercher une recette</h2>

    {/* Recherche par nom */}
      <input
        type="text"
        placeholder="Rechercher par nom"
        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        onChange={e => setSearchName(e.target.value.toLowerCase())}
      />

    {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
      {/* Ingrédients */}
        <div className="flex-1">
          <label className="block mb-1 text-sm font-medium text-gray-700">Ingrédients</label>
          <div className="flex flex-wrap gap-2">
            {ingredients.map(ing => (
              <button
                key={ing.id}
                onClick={() =>
                  setFilterIngredients(prev =>
                    prev.includes(ing.id)
                      ? prev.filter(i => i !== ing.id)
                      : [...prev, ing.id]
                  )
                }
                className={`px-3 py-1 rounded-full border ${
                  filterIngredients.includes(ing.id)
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-800 border-gray-300'
                }`}
              >
                {ing.name}
              </button>
            ))}
          </div>
        </div>

      {/* Restrictions */}
        <div className="flex-1 md:ml-5">
          <label className="block mb-1 text-sm font-medium text-gray-700">Restrictions</label>
          <div className="flex flex-wrap gap-2">
            {restrictions.map(r => (
              <button
                key={r.id}
                onClick={() =>
                  setFilterRestrictions(prev =>
                    prev.includes(r.id)
                      ? prev.filter(i => i !== r.id)
                      : [...prev, r.id]
                  )
                }
                className={`px-3 py-1 rounded-full border ${
                  filterRestrictions.includes(r.id)
                    ? 'bg-yellow-600 text-white border-yellow-600'
                    : 'bg-white text-gray-800 border-gray-300'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

      <div className="space-y-4">
      {savedRecipes
        .filter(recipe => recipe.name.toLowerCase().includes(searchName))
        .filter(recipe => {
          const match = filterIngredients.length === 0 || filterIngredients.every(id => recipe.ingredientsLinkIds?.includes(id));
          return match;
        })                     
        .filter(recipe =>
          filterRestrictions.length === 0 ||
          recipe.restrictionsIds.some(id => filterRestrictions.includes(id))
        )        
        .map(recipe => {
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
                  <div className="mt-2 text-sm text-gray-700 space-y-2">
                    <p className="text-gray-600 whitespace-pre-line">{recipe.description || 'Aucune description fournie.'}</p>
                    
                    <div>⏱️ <strong>Préparation</strong> : {recipe.prepTime != null ? `${recipe.prepTime} min` : 'Non spécifié'}</div>
                    <div>🔥 <strong>Cuisson</strong> : {recipe.cookTime != null ? `${recipe.cookTime} min` : 'Non spécifiée'}</div>
                    <div>💪 <strong>Difficulté</strong> : {recipe.difficulty || 'Non spécifiée'}</div>
                    <div>🍽️ <strong>Portions</strong> : {recipe.servings != null ? `${recipe.servings} personne${recipe.servings > 1 ? 's' : ''}` : 'Non spécifiées'}</div>
                    <div>
                      🚫 <strong>Restrictions</strong> : {resNames.length > 0 ? resNames.join(', ') : 'Aucune'}
                    </div>
                    <div>
                      📝 <strong>Ingrédients</strong> : {ingNames.length > 0 ? ingNames.join(', ') : 'Non spécifiés'}
                    </div>
                    <div>
                      👩‍🍳 <strong>Analyse nutritionnelle</strong> : {recipe.nutritionAnalysis || 'Non fournie'}
                    </div>
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
