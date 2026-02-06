import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { RecipeInput } from "../types";

interface OcrUploadProps {
  onRecipeSaved: () => void;
}

function OcrUpload({ onRecipeSaved }: OcrUploadProps) {
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);

  async function selectImage() {
    const file = await open({
      multiple: false,
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "bmp", "tiff", "tif", "webp"],
        },
      ],
    });
    if (file) {
      setImagePath(file);
      setError("");
      setOcrText("");
    }
  }

  async function runOcr() {
    if (!imagePath) return;
    setLoading(true);
    setError("");
    try {
      const text: string = await invoke("ocr_image", {
        imagePath,
        lang: "heb",
      });
      setOcrText(text);
      setOcrStatus(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function checkOcr() {
    try {
      const langs: string[] = await invoke("check_ocr_status", {
        lang: "heb",
      });
      setOcrStatus(
        `Tesseract OK. Available languages: ${langs.join(", ")}`
      );
      setError("");
    } catch (e) {
      setError(String(e));
      setOcrStatus(null);
    }
  }

  async function saveRecipe() {
    if (!title.trim()) {
      setError("Recipe title is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const recipe: RecipeInput = {
        title: title.trim(),
        ingredients: ingredients.trim(),
        instructions: instructions.trim(),
        source_image_path: imagePath,
        raw_ocr_text: ocrText || null,
      };
      await invoke("save_recipe", { recipe });
      // Reset form
      setImagePath(null);
      setOcrText("");
      setTitle("");
      setIngredients("");
      setInstructions("");
      onRecipeSaved();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function applyOcrToFields() {
    if (!ocrText) return;
    // Put the full OCR text into instructions; user can rearrange
    if (!title) setTitle("Scanned Recipe");
    if (!instructions) setInstructions(ocrText);
  }

  return (
    <div className="ocr-upload">
      <h2>Scan a Recipe</h2>
      <p className="ocr-hint">
        Upload a photo of a handwritten or printed Hebrew recipe and extract its text using OCR.
      </p>

      <div className="ocr-actions">
        <button onClick={selectImage}>
          {imagePath ? "Change Image" : "Select Image"}
        </button>
        <button onClick={checkOcr} className="secondary">
          Check Tesseract
        </button>
      </div>

      {ocrStatus && <p className="ocr-status">{ocrStatus}</p>}

      {imagePath && (
        <div className="ocr-image-info">
          <p className="file-path">{imagePath}</p>
          <button onClick={runOcr} disabled={loading}>
            {loading ? "Running OCR..." : "Extract Hebrew Text"}
          </button>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      {ocrText && (
        <div className="ocr-result">
          <h3>Extracted Text</h3>
          <textarea
            className="ocr-text rtl"
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            rows={8}
          />
          <button onClick={applyOcrToFields} className="secondary">
            Fill Recipe Fields from OCR
          </button>
        </div>
      )}

      <div className="recipe-form">
        <h3>Recipe Details</h3>
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe title..."
          />
        </label>
        <label>
          Ingredients
          <textarea
            className="rtl"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Ingredients..."
            rows={5}
          />
        </label>
        <label>
          Instructions
          <textarea
            className="rtl"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions..."
            rows={8}
          />
        </label>
        <button onClick={saveRecipe} disabled={loading || !title.trim()}>
          {loading ? "Saving..." : "Save Recipe"}
        </button>
      </div>
    </div>
  );
}

export default OcrUpload;
