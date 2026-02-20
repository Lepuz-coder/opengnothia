use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg(target_os = "macos")]
mod biometric {
    use objc2::runtime::Bool;
    use objc2_foundation::{NSError, NSString};
    use objc2_local_authentication::{LAContext, LAPolicy};

    pub fn can_evaluate() -> bool {
        let context = unsafe { LAContext::new() };
        unsafe {
            context
                .canEvaluatePolicy_error(LAPolicy::DeviceOwnerAuthenticationWithBiometrics)
                .is_ok()
        }
    }

    pub fn authenticate(reason: &str) -> Result<(), String> {
        let context = unsafe { LAContext::new() };
        if unsafe {
            context
                .canEvaluatePolicy_error(LAPolicy::DeviceOwnerAuthenticationWithBiometrics)
                .is_err()
        } {
            return Err("Biometric authentication not available".into());
        }

        let reason_ns = NSString::from_str(reason);
        let (tx, rx) = std::sync::mpsc::channel();
        let block =
            block2::RcBlock::new(move |success: Bool, _error: *mut NSError| {
                let _ = tx.send(success.as_bool());
            });
        unsafe {
            context.evaluatePolicy_localizedReason_reply(
                LAPolicy::DeviceOwnerAuthenticationWithBiometrics,
                &reason_ns,
                &block,
            );
        }
        match rx.recv() {
            Ok(true) => Ok(()),
            Ok(false) => Err("Authentication failed".into()),
            Err(_) => Err("Authentication cancelled".into()),
        }
    }
}

#[tauri::command]
fn biometric_authenticate(reason: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        biometric::authenticate(&reason)
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("Biometric authentication not supported on this platform".into())
    }
}

#[tauri::command]
fn biometric_available() -> bool {
    #[cfg(target_os = "macos")]
    {
        biometric::can_evaluate()
    }
    #[cfg(not(target_os = "macos"))]
    {
        false
    }
}

// ── Audio recording ──────────────────────────────────────────────────────────

mod recording {
    use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::Mutex;

    static AUDIO_BUFFER: Mutex<Vec<f32>> = Mutex::new(Vec::new());
    static RECORDING_META: Mutex<Option<(u32, u16)>> = Mutex::new(None);
    static SHOULD_STOP: AtomicBool = AtomicBool::new(false);
    static THREAD_HANDLE: Mutex<Option<std::thread::JoinHandle<Result<(), String>>>> =
        Mutex::new(None);

    pub fn start() -> Result<(), String> {
        let mut thread_guard = THREAD_HANDLE.lock().map_err(|e| e.to_string())?;
        if thread_guard.is_some() {
            return Err("Already recording".into());
        }

        AUDIO_BUFFER.lock().map_err(|e| e.to_string())?.clear();
        *RECORDING_META.lock().map_err(|e| e.to_string())? = None;
        SHOULD_STOP.store(false, Ordering::SeqCst);

        let (ready_tx, ready_rx) = std::sync::mpsc::channel::<Result<(), String>>();

        let handle = std::thread::spawn(move || -> Result<(), String> {
            let host = cpal::default_host();
            let device = host
                .default_input_device()
                .ok_or("No input device available")?;
            let config = device
                .default_input_config()
                .map_err(|e| format!("Input config error: {e}"))?;

            let sample_rate = config.sample_rate().0;
            let channels = config.channels();
            let sample_format = config.sample_format();
            let stream_config: cpal::StreamConfig = config.into();

            *RECORDING_META.lock().unwrap() = Some((sample_rate, channels));

            let stream = match sample_format {
                cpal::SampleFormat::F32 => device.build_input_stream(
                    &stream_config,
                    |data: &[f32], _: &cpal::InputCallbackInfo| {
                        if let Ok(mut buf) = AUDIO_BUFFER.lock() {
                            buf.extend_from_slice(data);
                        }
                    },
                    |e| eprintln!("Audio stream error: {e}"),
                    None,
                ),
                cpal::SampleFormat::I16 => device.build_input_stream(
                    &stream_config,
                    |data: &[i16], _: &cpal::InputCallbackInfo| {
                        if let Ok(mut buf) = AUDIO_BUFFER.lock() {
                            buf.extend(data.iter().map(|&s| s as f32 / i16::MAX as f32));
                        }
                    },
                    |e| eprintln!("Audio stream error: {e}"),
                    None,
                ),
                cpal::SampleFormat::I32 => device.build_input_stream(
                    &stream_config,
                    |data: &[i32], _: &cpal::InputCallbackInfo| {
                        if let Ok(mut buf) = AUDIO_BUFFER.lock() {
                            buf.extend(data.iter().map(|&s| s as f32 / i32::MAX as f32));
                        }
                    },
                    |e| eprintln!("Audio stream error: {e}"),
                    None,
                ),
                _ => {
                    let _ = ready_tx.send(Err("Unsupported sample format".into()));
                    return Err("Unsupported sample format".into());
                }
            }
            .map_err(|e| {
                let msg = format!("Failed to build stream: {e}");
                let _ = ready_tx.send(Err(msg.clone()));
                msg
            })?;

            stream.play().map_err(|e| {
                let msg = format!("Failed to start stream: {e}");
                let _ = ready_tx.send(Err(msg.clone()));
                msg
            })?;

            let _ = ready_tx.send(Ok(()));

            while !SHOULD_STOP.load(Ordering::SeqCst) {
                std::thread::sleep(std::time::Duration::from_millis(50));
            }

            drop(stream);
            Ok(())
        });

        match ready_rx.recv() {
            Ok(Ok(())) => {
                *thread_guard = Some(handle);
                Ok(())
            }
            Ok(Err(e)) => Err(e),
            Err(_) => Err("Recording thread failed to start".into()),
        }
    }

    pub fn stop() -> Result<String, String> {
        SHOULD_STOP.store(true, Ordering::SeqCst);

        if let Ok(mut thread_guard) = THREAD_HANDLE.lock() {
            if let Some(handle) = thread_guard.take() {
                let _ = handle.join().map_err(|_| "Recording thread panicked".to_string())?;
            }
        }

        let samples = AUDIO_BUFFER.lock().map_err(|e| e.to_string())?;
        let meta = RECORDING_META.lock().map_err(|e| e.to_string())?;
        let (sample_rate, channels) = meta.ok_or("No recording metadata")?;

        if samples.is_empty() {
            return Err("No audio recorded".into());
        }

        let spec = hound::WavSpec {
            channels,
            sample_rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let mut wav_buffer = Vec::new();
        {
            let cursor = std::io::Cursor::new(&mut wav_buffer);
            let mut writer =
                hound::WavWriter::new(cursor, spec).map_err(|e| format!("WAV error: {e}"))?;
            for &sample in samples.iter() {
                let clamped =
                    (sample * i16::MAX as f32).clamp(i16::MIN as f32, i16::MAX as f32) as i16;
                writer
                    .write_sample(clamped)
                    .map_err(|e| format!("WAV write error: {e}"))?;
            }
            writer
                .finalize()
                .map_err(|e| format!("WAV finalize error: {e}"))?;
        }

        use base64::Engine;
        Ok(base64::engine::general_purpose::STANDARD.encode(&wav_buffer))
    }
}

#[tauri::command]
fn start_recording() -> Result<(), String> {
    recording::start()
}

#[tauri::command]
fn stop_recording() -> Result<String, String> {
    recording::stop()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add therapist_notes to sessions",
            sql: include_str!("../migrations/002_add_therapist_notes.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add patient_notes table",
            sql: include_str!("../migrations/003_add_patient_notes.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add summary_narrative to sessions",
            sql: include_str!("../migrations/004_add_summary_narrative.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "add token_usage table",
            sql: include_str!("../migrations/005_add_token_usage.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "add age, gender, occupation to user_profile",
            sql: include_str!("../migrations/006_add_profile_fields.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "add dreams table",
            sql: include_str!("../migrations/007_add_dreams.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "add ai_analysis to journal_entries",
            sql: include_str!("../migrations/008_add_journal_analysis.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "add date column to dreams",
            sql: include_str!("../migrations/009_add_dream_date.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 10,
            description: "add mood_entries table",
            sql: include_str!("../migrations/010_add_mood_entries.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 11,
            description: "add weekly_summaries table",
            sql: include_str!("../migrations/011_add_weekly_summaries.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 12,
            description: "add insight_groups and insights tables",
            sql: include_str!("../migrations/012_add_insights.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:opengnothia.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            biometric_authenticate,
            biometric_available,
            start_recording,
            stop_recording
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
