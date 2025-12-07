use std::{
    collections::HashMap,
    sync::Arc,
    time::Duration,
};

use anyhow::Result;
use futures_util::TryStreamExt;
use log::{debug, info, warn};
use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;
use tokio_util::io::StreamReader;

use crate::DesktopRuntime;

#[derive(Deserialize)]
struct EventEnvelope {
    #[serde(rename = "type")]
    event_type: String,
    #[serde(default)]
    properties: Value,
}

#[derive(Clone, Debug, PartialEq)]
pub enum ActivityPhase {
    Idle,
    Busy,
    Cooldown,
}

pub fn spawn_session_activity_tracker(
    app: AppHandle,
    runtime: DesktopRuntime,
) -> tauri::async_runtime::JoinHandle<()> {
    tauri::async_runtime::spawn(async move {
        let client = Client::builder()
            .timeout(Duration::from_secs(24 * 60 * 60))
            .tcp_keepalive(Some(Duration::from_secs(30)))
            .build()
            .expect("failed to build reqwest client");

        let mut shutdown_rx = runtime.subscribe_shutdown();
        let phases = Arc::new(Mutex::new(HashMap::<String, ActivityPhase>::new()));
        let cooldowns = Arc::new(Mutex::new(HashMap::<String, tauri::async_runtime::JoinHandle<()>>::new()));

        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    info!("[desktop:activity] Shutdown received, stopping SSE listener");
                    break;
                }
                _ = async {
                    // Reset stale phases to idle before connecting so UI doesn't stay stuck on "working" after wake.
                    reset_and_emit_all_phases(&app, phases.clone(), cooldowns.clone()).await;

                    if let Err(err) = run_once(&app, &runtime, &client, phases.clone(), cooldowns.clone()).await {
                        warn!("[desktop:activity] SSE loop error: {err:?}");
                    }
                    tokio::time::sleep(Duration::from_secs(2)).await;
                } => {}
            }
        }
    })
}

async fn run_once(
    app: &AppHandle,
    runtime: &DesktopRuntime,
    client: &Client,
    phases: Arc<Mutex<HashMap<String, ActivityPhase>>>,
    cooldowns: Arc<Mutex<HashMap<String, tauri::async_runtime::JoinHandle<()>>>>,
) -> Result<()> {
    let opencode = runtime.opencode_manager();

    let port = match opencode.current_port() {
        Some(port) => port,
        None => {
            warn!("[desktop:activity] OpenCode port unavailable; will retry");
            tokio::time::sleep(Duration::from_secs(2)).await;
            return Ok(());
        }
    };

    let prefix = opencode.api_prefix();
    let mut url = format!("http://127.0.0.1:{port}{}/event", prefix);

    if let Some(dir) = opencode.get_working_directory().to_str().map(|s| s.to_string()) {
        let mut parsed = reqwest::Url::parse(&url)?;
        parsed
            .query_pairs_mut()
            .append_pair("directory", &dir);
        url = parsed.to_string();
    }

    debug!("[desktop:activity] Connecting SSE for activity phases: {url}");

    let response = client
        .get(&url)
        .header("accept", "text/event-stream")
        .header("accept-encoding", "identity")
        .send()
        .await?;

    debug!(
        "[desktop:activity] SSE response status={} headers={:?}",
        response.status(),
        response.headers()
    );

    if !response.status().is_success() {
        warn!(
            "[desktop:activity] SSE connect failed with status {}",
            response.status()
        );
        tokio::time::sleep(Duration::from_secs(2)).await;
        return Ok(());
    }

    use tokio::io::AsyncBufReadExt;

    let stream = response
        .bytes_stream()
        .map_err(|err| std::io::Error::new(std::io::ErrorKind::Other, err));
    let mut reader = StreamReader::new(stream);
    let mut buf = Vec::new();
    let mut data_lines: Vec<String> = Vec::new();

    loop {
        buf.clear();
        let bytes_read = match reader.read_until(b'\n', &mut buf).await {
            Ok(n) => n,
            Err(err) => {
                warn!("[desktop:activity] Read error in SSE stream: {err:?}");
                return Err(err.into());
            }
        };
        if bytes_read == 0 {
            break;
        }

        let line = match std::str::from_utf8(&buf) {
            Ok(s) => s.trim_end_matches(&['\r', '\n'][..]).to_string(),
            Err(err) => {
                warn!("[desktop:activity] Non-UTF8 SSE chunk: {err}");
                continue;
            }
        };

        if line.is_empty() {
            if data_lines.is_empty() {
                continue;
            }
            let raw = data_lines.join("\n");
            data_lines.clear();

            match serde_json::from_str::<EventEnvelope>(&raw) {
                Ok(event) => handle_event(app, event, phases.clone(), cooldowns.clone()).await,
                Err(err) => {
                    warn!("[desktop:activity] Failed to parse SSE data: {err}; raw={raw}");
                }
            }
            continue;
        }

        if let Some(rest) = line.strip_prefix("data:") {
            data_lines.push(rest.trim_start().to_string());
        }
    }

    Ok(())
}

async fn handle_event(
    app: &AppHandle,
    event: EventEnvelope,
    phases: Arc<Mutex<HashMap<String, ActivityPhase>>>,
    cooldowns: Arc<Mutex<HashMap<String, tauri::async_runtime::JoinHandle<()>>>>,
) {
    match event.event_type.as_str() {
        "session.status" => {
            let session_id = event
                .properties
                .get("sessionID")
                .and_then(Value::as_str)
                .map(|s| s.to_string());
            let status = event
                .properties
                .get("status")
                .and_then(|s| s.get("type"))
                .and_then(Value::as_str);

            if let (Some(id), Some(status_type)) = (session_id, status) {
                let phase = if status_type == "busy" || status_type == "retry" {
                    ActivityPhase::Busy
                } else {
                    ActivityPhase::Idle
                };
                set_phase(app, &id, phase, phases.clone(), cooldowns.clone()).await;
            }
        }
        "message.updated" => {
            if let Some(info) = event.properties.get("info") {
                let role = info.get("role").and_then(Value::as_str).unwrap_or_default();
                if role != "assistant" {
                    return;
                }

                let finish = info.get("finish").and_then(Value::as_str);
                if finish != Some("stop") {
                    return;
                }

                let session_id = info
                    .get("sessionID")
                    .and_then(Value::as_str)
                    .map(|s| s.to_string());

                if let Some(id) = session_id {
                    // If current phase is busy, move to cooldown for 2s then idle
                    let current = { phases.lock().await.get(&id).cloned() };
                    if matches!(current, Some(ActivityPhase::Busy)) {
                        set_phase(app, &id, ActivityPhase::Cooldown, phases.clone(), cooldowns.clone()).await;

                        let app_clone = app.clone();
                        let phases_clone = phases.clone();
                        let cooldowns_clone = cooldowns.clone();
                        let id_clone = id.clone();
                        let handle = tauri::async_runtime::spawn(async move {
                            tokio::time::sleep(Duration::from_secs(2)).await;
                            let current = { phases_clone.lock().await.get(&id_clone).cloned() };
                            if matches!(current, Some(ActivityPhase::Cooldown)) {
                                set_phase(&app_clone, &id_clone, ActivityPhase::Idle, phases_clone, cooldowns_clone).await;
                            }
                        });

                        // Store cooldown handle to cancel if phase changes earlier
                        let mut cd = cooldowns.lock().await;
                        if let Some(prev) = cd.remove(&id) {
                            prev.abort();
                        }
                        cd.insert(id, handle);
                    }
                }
            }
        }
        _ => {}
    }
}

async fn set_phase(
    app: &AppHandle,
    session_id: &str,
    phase: ActivityPhase,
    phases: Arc<Mutex<HashMap<String, ActivityPhase>>>,
    cooldowns: Arc<Mutex<HashMap<String, tauri::async_runtime::JoinHandle<()>>>>,
) {
    {
        let mut map = phases.lock().await;
        let current = map.get(session_id);
        if current == Some(&phase) {
            return;
        }
        map.insert(session_id.to_string(), phase.clone());

        // Cancel cooldown timer when leaving cooldown
        if !matches!(phase, ActivityPhase::Cooldown) {
            if let Some(handle) = cooldowns.lock().await.remove(session_id) {
                handle.abort();
            }
        }
    }

    // Emit to webview so UI stays in sync
    let payload = serde_json::json!({
        "sessionId": session_id,
        "phase": match phase {
            ActivityPhase::Idle => "idle",
            ActivityPhase::Busy => "busy",
            ActivityPhase::Cooldown => "cooldown",
        }
    });

    let _ = app.emit("openchamber:session-activity", payload);
}

async fn reset_and_emit_all_phases(
    app: &AppHandle,
    phases: Arc<Mutex<HashMap<String, ActivityPhase>>>,
    cooldowns: Arc<Mutex<HashMap<String, tauri::async_runtime::JoinHandle<()>>>>,
) {
    // Cancel any cooldown timers and set all phases to idle to avoid stale "busy" after wake.
    {
        let mut cd = cooldowns.lock().await;
        for handle in cd.values() {
            handle.abort();
        }
        cd.clear();
    }

    let snapshot = {
        let mut guard = phases.lock().await;
        for value in guard.values_mut() {
            *value = ActivityPhase::Idle;
        }
        guard.clone()
    };

    if snapshot.is_empty() {
        return;
    }

    for (session_id, phase) in snapshot {
        let payload = serde_json::json!({
            "sessionId": session_id,
            "phase": match phase {
                ActivityPhase::Idle => "idle",
                ActivityPhase::Busy => "busy",
                ActivityPhase::Cooldown => "cooldown",
            }
        });
        let _ = app.emit("openchamber:session-activity", payload);
    }
}
