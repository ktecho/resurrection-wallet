use base64::{engine::general_purpose, Engine as _};
use image::codecs::jpeg::JpegEncoder;
use image::{DynamicImage, GrayImage, ImageBuffer, Rgba};
use nokhwa::utils::{RequestedFormat, RequestedFormatType, Resolution};
use nokhwa::{nokhwa_initialize, pixel_format::RgbAFormat, query, utils::ApiBackend};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Emitter;
use tauri_plugin_log::{Target, TargetKind};

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
        println!("Permission to use the camera: {}", granted);
    });

    let cameras = query(ApiBackend::Auto).map_err(|e| e.to_string())?;
    let first_camera = cameras.first().ok_or("No camera found")?;

    let format = RequestedFormat::new::<RgbAFormat>(RequestedFormatType::HighestResolution(
        Resolution::new(640, 480),
    ));

//  let format = RequestedFormat::new::<RgbAFormat>(RequestedFormatType::AbsoluteHighestResolution);

    let mut camera =
        nokhwa::Camera::new(first_camera.index().clone(), format).map_err(|e| e.to_string())?;

    camera.open_stream().map_err(|e| e.to_string())?;

    let decoder = bardecoder::default_decoder();
    let mut buffer = Vec::new();

    let mut frame_count = 0;

    while CAMERA_RUNNING.load(Ordering::SeqCst) {
        let frame = camera.frame().map_err(|e| e.to_string())?;
        let image = frame
            .decode_image::<RgbAFormat>()
            .map_err(|e| e.to_string())?;

        // Convertir la imagen a escala de grises
        let gray_image: GrayImage = DynamicImage::ImageRgba8(image.clone()).into_luma8();

        // Convertir la imagen en escala de grises de vuelta a RGBA
        let width = gray_image.width();
        let height = gray_image.height();
        let rgba_image: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(width, height, |x, y| {
                let gray = gray_image.get_pixel(x, y).0[0];
                Rgba([gray, gray, gray, 255])
            });

        println!(
            "Image from camera {}x{} {}",
            image.width(),
            image.height(),
            image.len()
        );

        let results = decoder.decode(&rgba_image);
        for result in results {
            if let Ok(content) = result {
                println!("     ----- Decode QR !!!!!!!!!! {}", content);

                app.emit("qr-detected", content)
                    .map_err(|e| e.to_string())?;

                CAMERA_RUNNING.store(false, Ordering::SeqCst);
            }
        }

        // Emitir 50% of images to the front-end
        if frame_count % 2 == 0 {
            // Convert to JPEG
            buffer.clear();
            let mut encoder = JpegEncoder::new_with_quality(&mut buffer, 25);
            encoder
                .encode(
                    image.as_raw(),
                    image.width(),
                    image.height(),
                    image::ColorType::Rgba8,
                )
                .map_err(|e| e.to_string())?;

            println!("     ----- Emitting camera-frame to front-end !!!!!!!!!!");
            app.emit("camera-frame", general_purpose::STANDARD.encode(&buffer))
                .map_err(|e| e.to_string())?;
        }

        frame_count += 1;

        std::thread::sleep(std::time::Duration::from_millis(100));
    }

    camera.stop_stream().map_err(|e| e.to_string())?;

    Ok("Camera stopped".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
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
