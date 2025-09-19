use candid::{CandidType, Deserialize};

// Module declarations
pub mod doctor;
pub mod patient;
pub mod shared;
pub mod ai;
pub mod ngo;
pub mod admin;

// Export service modules
pub use shared::auth::*;
pub use admin::*;
pub use doctor::verification::*; // Add this export
pub use patient::prescriptions::*; // Add this export
pub use ngo::*;
pub use ai::*;

// Avoid ambiguous glob re-exports; export doctor prescription functions explicitly
pub use doctor::prescriptions::{
    create_prescription,
    get_prescriptions_by_doctor, // Updated to match renamed function
    // other doctor::prescriptions exports if needed
};

// If needed, explicitly export medicine functions
pub use doctor::medicines::{
    add_medicine,
    get_all_medicines,
    get_medicine,
    get_doctor_medicines,
    toggle_medicine_status,
};

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