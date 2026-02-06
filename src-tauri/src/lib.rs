mod db;
mod ocr;

use db::{DbState, Recipe, RecipeInput};
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn ocr_image(image_path: String, lang: Option<String>) -> Result<String, String> {
    let lang = lang.unwrap_or_else(|| "heb".to_string());
    ocr::run_ocr(&image_path, &lang)
}

#[tauri::command]
fn check_ocr_status(lang: Option<String>) -> Result<Vec<String>, String> {
    let lang = lang.unwrap_or_else(|| "heb".to_string());
    ocr::check_tesseract(&lang)
}

#[tauri::command]
fn save_recipe(state: tauri::State<DbState>, recipe: RecipeInput) -> Result<Recipe, String> {
    let conn = state.conn.lock().map_err(|e| format!("Lock error: {e}"))?;
    db::insert_recipe(&conn, &recipe)
}

#[tauri::command]
fn get_recipes(state: tauri::State<DbState>) -> Result<Vec<Recipe>, String> {
    let conn = state.conn.lock().map_err(|e| format!("Lock error: {e}"))?;
    db::get_all_recipes(&conn)
}

#[tauri::command]
fn get_recipe(state: tauri::State<DbState>, id: i64) -> Result<Recipe, String> {
    let conn = state.conn.lock().map_err(|e| format!("Lock error: {e}"))?;
    db::get_recipe_by_id(&conn, id)
}

#[tauri::command]
fn update_recipe(state: tauri::State<DbState>, id: i64, recipe: RecipeInput) -> Result<Recipe, String> {
    let conn = state.conn.lock().map_err(|e| format!("Lock error: {e}"))?;
    db::update_recipe(&conn, id, &recipe)
}

#[tauri::command]
fn delete_recipe(state: tauri::State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| format!("Lock error: {e}"))?;
    db::delete_recipe(&conn, id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize database in the app data directory
            let app_data_dir = app.path().app_data_dir().expect("failed to resolve app data dir");
            std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
            let db_path = app_data_dir.join("recipes.db");

            let conn = db::init_db(&db_path)
                .expect("failed to initialize database");

            app.manage(DbState {
                conn: std::sync::Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            ocr_image,
            check_ocr_status,
            save_recipe,
            get_recipes,
            get_recipe,
            update_recipe,
            delete_recipe,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
