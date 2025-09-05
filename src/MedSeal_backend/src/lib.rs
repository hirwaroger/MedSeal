use candid::{CandidType, Deserialize};
use ic_cdk::api::time;
use std::collections::HashMap;
use std::cell::RefCell;

// Module declarations
pub mod shared;
pub mod doctor;
pub mod patient;
pub mod admin;
pub mod ai;

// Re-export commonly used types
pub use shared::types::*;
pub use shared::storage::*;
pub use shared::utils::*;

// ICRC standards support for NFID
#[derive(CandidType, Deserialize, Eq, PartialEq, Debug)]
pub struct SupportedStandard {
    pub url: String,
    pub name: String,
}

#[ic_cdk::query]
fn icrc10_supported_standards() -> Vec<SupportedStandard> {
    vec![
        SupportedStandard {
            url: "https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-10/ICRC-10.md".to_string(),
            name: "ICRC-10".to_string(),
        },
        SupportedStandard {
            url: "https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_28_trusted_origins.md".to_string(),
            name: "ICRC-28".to_string(),
        },
    ]
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Icrc28TrustedOriginsResponse {
    pub trusted_origins: Vec<String>
}

#[ic_cdk::update]
fn icrc28_trusted_origins() -> Icrc28TrustedOriginsResponse {
    let trusted_origins = vec![
        String::from("https://your-frontend-canister-id.icp0.io"),
        String::from("https://your-frontend-canister-id.raw.icp0.io"),
        String::from("https://your-frontend-canister-id.ic0.app"),
        String::from("https://your-frontend-canister-id.raw.ic0.app"),
        String::from("https://your-frontend-canister-id.icp0.icp-api.io"),
        String::from("https://your-frontend-canister-id.icp-api.io"),
        String::from("http://localhost:3000"), // For local development
        String::from("http://127.0.0.1:3000"), // For local development
    ];
    
    Icrc28TrustedOriginsResponse { trusted_origins }
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// Re-export functions from modules
pub use shared::auth::*;
pub use doctor::medicines::*;
pub use doctor::prescriptions::*;
pub use patient::prescriptions::*;
pub use admin::users::*;
pub use admin::verification::*;
pub use ai::chat::*;