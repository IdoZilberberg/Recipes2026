import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Recipe, RecipeInput } from "../types";

interface RecipeDetailProps {
  recipeId: number;
  onBack: () => void;
  onDeleted: () => void;
}

function RecipeDetail({ recipeId, onBack, onDeleted }: RecipeDetailProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  async function loadRecipe() {
    setLoading(true);
    setError("");
    try {
      const data: Recipe = await invoke("get_recipe", { id: recipeId });
      setRecipe(data);
      setTitle(data.title);
      setIngredients(data.ingredients);
      setInstructions(data.instructions);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const input: RecipeInput = {
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        source_image_path: recipe?.source_image_path ?? null,
        raw_ocr_text: recipe?.raw_ocr_text ?? null,
      };
      const updated: Recipe = await invoke("update_recipe", {
        id: recipeId,
        recipe: input,
      });
      setRecipe(updated);
      setEditing(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await invoke("delete_recipe", { id: recipeId });
      onDeleted();
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  if (loading && !recipe) return <p>Loading...</p>;
  if (error && !recipe) return <p className="error-msg">{error}</p>;
  if (!recipe) return null;

  return (
    <div className="recipe-detail">
      <div className="detail-header">
        <button onClick={onBack} className="secondary">
          &larr; Back
        </button>
        <div className="detail-actions">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={loading}>
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTitle(recipe.title);
                  setIngredients(recipe.ingredients);
                  setInstructions(recipe.instructions);
                }}
                className="secondary"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}>Edit</button>
              <button onClick={handleDelete} className="danger">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {editing ? (
        <div className="recipe-form">
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Ingredients
            <textarea
              className="rtl"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={6}
            />
          </label>
          <label>
            Instructions
            <textarea
              className="rtl"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={10}
            />
          </label>
        </div>
      ) : (
        <div className="recipe-view">
          <h2>{recipe.title}</h2>

          {recipe.ingredients && (
            <section>
              <h3>Ingredients</h3>
              <pre className="recipe-text rtl">{recipe.ingredients}</pre>
            </section>
          )}

          {recipe.instructions && (
            <section>
              <h3>Instructions</h3>
              <pre className="recipe-text rtl">{recipe.instructions}</pre>
            </section>
          )}

          {recipe.raw_ocr_text && (
            <section>
              <h3>Original OCR Text</h3>
              <pre className="recipe-text rtl ocr-raw">{recipe.raw_ocr_text}</pre>
            </section>
          )}

          {recipe.source_image_path && (
            <p className="file-path">
              Source: {recipe.source_image_path}
            </p>
          )}

          <p className="recipe-date">
            Created: {new Date(recipe.created_at + "Z").toLocaleString()}
            {recipe.updated_at !== recipe.created_at && (
              <> | Updated: {new Date(recipe.updated_at + "Z").toLocaleString()}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

export default RecipeDetail;
