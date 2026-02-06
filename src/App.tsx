import { useState } from "react";
import OcrUpload from "./components/OcrUpload";
import RecipeList from "./components/RecipeList";
import RecipeDetail from "./components/RecipeDetail";
import type { View } from "./types";
import "./App.css";

function App() {
  const [view, setView] = useState<View>("scan");
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRecipeSaved() {
    setRefreshKey((k) => k + 1);
    setView("recipes");
  }

  function handleSelectRecipe(id: number) {
    setSelectedRecipeId(id);
    setView("detail");
  }

  function handleBack() {
    setView("recipes");
    setSelectedRecipeId(null);
  }

  function handleDeleted() {
    setRefreshKey((k) => k + 1);
    setView("recipes");
    setSelectedRecipeId(null);
  }

  return (
    <div className="app">
      <nav className="nav-bar">
        <button
          className={view === "scan" ? "nav-active" : ""}
          onClick={() => setView("scan")}
        >
          Scan Recipe
        </button>
        <button
          className={view === "recipes" || view === "detail" ? "nav-active" : ""}
          onClick={() => {
            setView("recipes");
            setSelectedRecipeId(null);
          }}
        >
          My Recipes
        </button>
      </nav>

      <main className="container">
        {view === "scan" && <OcrUpload onRecipeSaved={handleRecipeSaved} />}
        {view === "recipes" && (
          <RecipeList
            onSelectRecipe={handleSelectRecipe}
            refreshKey={refreshKey}
          />
        )}
        {view === "detail" && selectedRecipeId !== null && (
          <RecipeDetail
            recipeId={selectedRecipeId}
            onBack={handleBack}
            onDeleted={handleDeleted}
          />
        )}
      </main>
    </div>
  );
}

export default App;
