use base64::{engine::general_purpose, Engine as _};
use image::codecs::jpeg::JpegEncoder;
use nokhwa::pixel_format::RgbFormat;
use nokhwa::utils::{RequestedFormat, RequestedFormatType, Resolution};
use nokhwa::{nokhwa_initialize, pixel_format::RgbAFormat, query, utils::ApiBackend};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Emitter;

static CAMERA_RUNNING: AtomicBool = AtomicBool::new(false);

#[tauri::command]
async fn stop_camera() -> Result<String, String> {
    if CAMERA_RUNNING.load(Ordering::SeqCst) {
        CAMERA_RUNNING.store(false, Ordering::SeqCst);
        Ok("Camera stopped successfully".to_string())
    } else {
        Err("Camera is not running".to_string())
    }
}

#[tauri::command]
async fn start_camera(app: tauri::AppHandle) -> Result<String, String> {
    if CAMERA_RUNNING.load(Ordering::SeqCst) {
        return Err("Camera is already running".to_string());
    }

    CAMERA_RUNNING.store(true, Ordering::SeqCst);

    nokhwa_initialize(|granted| {
        println!("User said {}", granted);
    });

    let cameras = query(ApiBackend::Auto).map_err(|e| e.to_string())?;
    let first_camera = cameras.first().ok_or("No camera found")?;

    let resolution = Resolution::new(640, 480);
    let format =
        RequestedFormat::new::<RgbFormat>(RequestedFormatType::HighestResolution(resolution));
    //let format = RequestedFormat::new::<RgbFormat>(RequestedFormatType::AbsoluteHighestFrameRate);
    let mut camera =
        nokhwa::Camera::new(first_camera.index().clone(), format).map_err(|e| e.to_string())?;

    //camera.set_frame_rate(30).map_err(|e| e.to_string())?;

    camera.open_stream().map_err(|e| e.to_string())?;

    while CAMERA_RUNNING.load(Ordering::SeqCst) {
        let frame = camera.frame().map_err(|e| e.to_string())?;
        let image = frame
            .decode_image::<RgbAFormat>()
            .map_err(|e| e.to_string())?;

        println!(
            "Image from camera {}x{} {}",
            image.width(),
            image.height(),
            image.len()
        );

        let decoder = bardecoder::default_decoder();
        let results = decoder.decode(&image);
        for result in results {
            if let Ok(content) = result {
                println!("     ----- Decode QR !!!!!!!!!! {}", content);
                app.emit("qr-detected", content)
                    .map_err(|e| e.to_string())?;
                CAMERA_RUNNING.store(false, Ordering::SeqCst);
            }
        }

        // Convert to JPEG
        let mut buffer = Vec::new();
        let mut encoder = JpegEncoder::new_with_quality(&mut buffer, 20);
        encoder
            .encode(
                image.as_raw(),
                image.width(),
                image.height(),
                image::ColorType::Rgba8,
            )
            .map_err(|e| e.to_string())?;

        // Convertir JPEG a base64
        let base64 = general_purpose::STANDARD.encode(&buffer);

        // Enviar el frame al frontend
        println!("     ----- Emitting camera-frame to front-end !!!!!!!!!!");
        app.emit("camera-frame", base64)
            .map_err(|e| e.to_string())?;

        //std::thread::sleep(std::time::Duration::from_millis(1));
    }

    camera.stop_stream().map_err(|e| e.to_string())?;

    Ok("Camera stopped".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![start_camera, stop_camera])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
