use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Recipe {
    pub id: i64,
    pub title: String,
    pub ingredients: String,
    pub instructions: String,
    pub source_image_path: Option<String>,
    pub raw_ocr_text: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct RecipeInput {
    pub title: String,
    pub ingredients: String,
    pub instructions: String,
    pub source_image_path: Option<String>,
    pub raw_ocr_text: Option<String>,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

pub fn init_db(db_path: &Path) -> Result<Connection, String> {
    let conn = Connection::open(db_path).map_err(|e| format!("Failed to open database: {e}"))?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            ingredients TEXT NOT NULL DEFAULT '',
            instructions TEXT NOT NULL DEFAULT '',
            source_image_path TEXT,
            raw_ocr_text TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );"
    ).map_err(|e| format!("Failed to create table: {e}"))?;

    Ok(conn)
}

pub fn insert_recipe(conn: &Connection, input: &RecipeInput) -> Result<Recipe, String> {
    conn.execute(
        "INSERT INTO recipes (title, ingredients, instructions, source_image_path, raw_ocr_text)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            input.title,
            input.ingredients,
            input.instructions,
            input.source_image_path,
            input.raw_ocr_text,
        ],
    ).map_err(|e| format!("Failed to insert recipe: {e}"))?;

    let id = conn.last_insert_rowid();
    get_recipe_by_id(conn, id)
}

pub fn get_recipe_by_id(conn: &Connection, id: i64) -> Result<Recipe, String> {
    conn.query_row(
        "SELECT id, title, ingredients, instructions, source_image_path, raw_ocr_text, created_at, updated_at
         FROM recipes WHERE id = ?1",
        params![id],
        |row| {
            Ok(Recipe {
                id: row.get(0)?,
                title: row.get(1)?,
                ingredients: row.get(2)?,
                instructions: row.get(3)?,
                source_image_path: row.get(4)?,
                raw_ocr_text: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    ).map_err(|e| format!("Recipe not found: {e}"))
}

pub fn get_all_recipes(conn: &Connection) -> Result<Vec<Recipe>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, title, ingredients, instructions, source_image_path, raw_ocr_text, created_at, updated_at
         FROM recipes ORDER BY updated_at DESC"
    ).map_err(|e| format!("Failed to prepare query: {e}"))?;

    let recipes = stmt.query_map([], |row| {
        Ok(Recipe {
            id: row.get(0)?,
            title: row.get(1)?,
            ingredients: row.get(2)?,
            instructions: row.get(3)?,
            source_image_path: row.get(4)?,
            raw_ocr_text: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }).map_err(|e| format!("Failed to query recipes: {e}"))?;

    recipes.collect::<Result<Vec<_>, _>>().map_err(|e| format!("Failed to collect recipes: {e}"))
}

pub fn update_recipe(conn: &Connection, id: i64, input: &RecipeInput) -> Result<Recipe, String> {
    let affected = conn.execute(
        "UPDATE recipes SET title = ?1, ingredients = ?2, instructions = ?3,
         source_image_path = ?4, raw_ocr_text = ?5, updated_at = datetime('now')
         WHERE id = ?6",
        params![
            input.title,
            input.ingredients,
            input.instructions,
            input.source_image_path,
            input.raw_ocr_text,
            id,
        ],
    ).map_err(|e| format!("Failed to update recipe: {e}"))?;

    if affected == 0 {
        return Err(format!("Recipe with id {id} not found"));
    }

    get_recipe_by_id(conn, id)
}

pub fn delete_recipe(conn: &Connection, id: i64) -> Result<(), String> {
    let affected = conn.execute("DELETE FROM recipes WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete recipe: {e}"))?;

    if affected == 0 {
        return Err(format!("Recipe with id {id} not found"));
    }

    Ok(())
}
