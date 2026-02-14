use tauri_plugin_sql::{Migration, MigrationKind};

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
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:opengnothia.db", migrations)
                .build(),
        )
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
