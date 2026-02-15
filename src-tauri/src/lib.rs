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
