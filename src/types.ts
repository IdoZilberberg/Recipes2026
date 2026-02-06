export interface Recipe {
  id: number;
  title: string;
  ingredients: string;
  instructions: string;
  source_image_path: string | null;
  raw_ocr_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeInput {
  title: string;
  ingredients: string;
  instructions: string;
  source_image_path: string | null;
  raw_ocr_text: string | null;
}

export type View = "scan" | "recipes" | "detail";
