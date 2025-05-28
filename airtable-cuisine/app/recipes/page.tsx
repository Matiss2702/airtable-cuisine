'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function RecipesPage() {
  const [ingredients, setIngredients] = useState<{ id: string; name: string }[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [usedIngredients, setUsedIngredients] = useState<string[]>(() =>
    typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('usedIngredients') || '[]') : []
  );
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/ingredients')
      .then((res) => res.json())
      .then((data) => setIngredients(data))
      .catch((err) => console.error('Erreur chargement ingrédients:', err));
  }, []);

  const addIngredient = () => {
    if (selectedIngredient && !usedIngredients.includes(selectedIngredient)) {
      const updated = [...usedIngredients, selectedIngredient];
      setUsedIngredients(updated);
      localStorage.setItem('usedIngredients', JSON.stringify(updated));
      setSelectedIngredient('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    const stored = JSON.parse(localStorage.getItem('usedIngredients') || '[]');

    const prompt = ` En Français. Je veux faire une recette avec ces ingrédients : ${stored.join(
      ', '
    )}. Donne-moi une recette avec les quantités en grammes, les étapes et les temps de cuisson.`;

    try {
      const res = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'llama3',
          options: { temperature: 0.7 },
        }),
      });

      const data = await res.json();
      setResponse(data.message?.content || 'No response generated');
    } catch (err) {
      setResponse('Erreur lors de la génération de la réponse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Générateur de recette IA</h1>
      <Card>
        <CardContent className="space-y-4 mt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ingredient">Ajouter un ingrédient</Label>
              <Input
                id="ingredient"
                list="ingredients"
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                placeholder="Tapez ou sélectionnez un ingrédient"
              />
              <datalist id="ingredients">
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.name} />
                ))}
              </datalist>
              <Button type="button" onClick={addIngredient}>
                Ajouter
              </Button>
            </div>

            {usedIngredients.length > 0 && (
              <div>
                <Label>Ingrédients sélectionnés :</Label>
                <ul className="mt-2 list-disc list-inside text-sm">
                  {usedIngredients.map((ing, idx) => (
                    <li key={idx}>{ing}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Chargement...' : 'Générer une recette'}
            </Button>
          </form>

          {response && (
            <div className="mt-6 border rounded-md p-4 bg-muted">
              <Label>Recette générée :</Label>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{response}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
