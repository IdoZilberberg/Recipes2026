use std::process::Command;

/// Run Tesseract OCR on an image file and return the extracted Hebrew text.
///
/// Requires `tesseract` CLI to be installed on the system with Hebrew language data:
///   - macOS:   `brew install tesseract tesseract-lang`
///   - Ubuntu:  `sudo apt install tesseract-ocr tesseract-ocr-heb`
///   - Windows: Install from https://github.com/UB-Mannheim/tesseract/wiki and add to PATH
pub fn run_ocr(image_path: &str, lang: &str) -> Result<String, String> {
    // Verify the image file exists
    if !std::path::Path::new(image_path).exists() {
        return Err(format!("Image file not found: {image_path}"));
    }

    // Run tesseract: `tesseract <input> stdout -l heb`
    // Using stdout as output so tesseract writes to stdout instead of a file
    let output = Command::new("tesseract")
        .arg(image_path)
        .arg("stdout")
        .arg("-l")
        .arg(lang)
        .arg("--psm")
        .arg("6") // Assume a single uniform block of text
        .output()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "Tesseract is not installed or not found in PATH. \
                 Please install it:\n\
                 - macOS: brew install tesseract tesseract-lang\n\
                 - Ubuntu: sudo apt install tesseract-ocr tesseract-ocr-heb\n\
                 - Windows: https://github.com/UB-Mannheim/tesseract/wiki"
                    .to_string()
            } else {
                format!("Failed to run tesseract: {e}")
            }
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Tesseract failed: {stderr}"));
    }

    let text = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if text.is_empty() {
        return Err("OCR produced no text. The image may be blank or unreadable.".to_string());
    }

    Ok(text)
}

/// Check whether Tesseract is installed and a given language is available.
pub fn check_tesseract(lang: &str) -> Result<Vec<String>, String> {
    let output = Command::new("tesseract")
        .arg("--list-langs")
        .output()
        .map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                "Tesseract is not installed".to_string()
            } else {
                format!("Failed to check tesseract: {e}")
            }
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let langs: Vec<String> = stdout
        .lines()
        .skip(1) // First line is the data path header
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();

    if !langs.iter().any(|l| l == lang) {
        return Err(format!(
            "Tesseract language '{lang}' is not installed. Available languages: {}.\n\
             Install Hebrew: sudo apt install tesseract-ocr-heb (Ubuntu) or brew install tesseract-lang (macOS)",
            langs.join(", ")
        ));
    }

    Ok(langs)
}
