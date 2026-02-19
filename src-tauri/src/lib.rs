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
            biometric_available
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
