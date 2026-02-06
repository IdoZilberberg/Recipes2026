import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Recipe } from "../types";

interface RecipeListProps {
  onSelectRecipe: (id: number) => void;
  refreshKey: number;
}

function RecipeList({ onSelectRecipe, refreshKey }: RecipeListProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRecipes();
  }, [refreshKey]);

  async function loadRecipes() {
    setLoading(true);
    setError("");
    try {
      const data: Recipe[] = await invoke("get_recipes");
      setRecipes(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading recipes...</p>;
  if (error) return <p className="error-msg">{error}</p>;

  if (recipes.length === 0) {
    return (
      <div className="recipe-list-empty">
        <h2>My Recipes</h2>
        <p>No recipes yet. Scan a recipe to get started!</p>
      </div>
    );
  }

  return (
    <div className="recipe-list">
      <h2>My Recipes ({recipes.length})</h2>
      <div className="recipe-cards">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="recipe-card"
            onClick={() => onSelectRecipe(recipe.id)}
          >
            <h3>{recipe.title}</h3>
            <p className="recipe-preview rtl">
              {recipe.ingredients
                ? recipe.ingredients.slice(0, 100) +
                  (recipe.ingredients.length > 100 ? "..." : "")
                : "No ingredients listed"}
            </p>
            <span className="recipe-date">
              {new Date(recipe.created_at + "Z").toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecipeList;
