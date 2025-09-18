use candid::{CandidType, Deserialize};

// Module declarations
mod doctor;
mod patient; 
mod ngo;
mod admin;
mod ai;
mod shared;

// Export service modules
pub use shared::auth::*;
pub use admin::*;
pub use doctor::*;
pub use patient::*;
pub use ngo::*;
pub use ai::*;

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

// Doctor verification
#[ic_cdk::update]
fn submit_doctor_verification_request(request: shared::types::SubmitVerificationRequest) -> shared::types::Result<String> {
    doctor::submit_doctor_verification_request(request)
}

// NGO verification  
#[ic_cdk::update]
fn submit_ngo_verification_request(request: shared::types::SubmitVerificationRequest) -> shared::types::Result<String> {
    ngo::submit_ngo_verification_request(request)
}

// Legacy verification endpoint (for backward compatibility)
#[ic_cdk::update]
fn submit_verification_request(request: shared::types::SubmitVerificationRequest) -> shared::types::Result<String> {
    use ic_cdk::api::caller;
    let caller_principal = caller().to_string();
    
    if let Some(user) = shared::storage::get_user_by_principal(&caller_principal) {
        match user.role {
            shared::types::UserRole::Doctor => doctor::submit_doctor_verification_request(request),
            shared::types::UserRole::NGO => ngo::submit_ngo_verification_request(request),
            _ => Err("Invalid user role for verification request".to_string()),
        }
    } else {
        Err("User not found".to_string())
    }
}

// Admin verification endpoints
#[ic_cdk::query]
fn get_all_verification_requests() -> shared::types::Result<Vec<shared::types::VerificationRequest>> {
    admin::verification::get_all_verification_requests()
}

#[ic_cdk::query]
fn get_doctor_verification_requests() -> shared::types::Result<Vec<shared::types::VerificationRequest>> {
    admin::verification::get_doctor_verification_requests()
}

#[ic_cdk::query]
fn get_ngo_verification_requests() -> shared::types::Result<Vec<shared::types::VerificationRequest>> {
    admin::verification::get_ngo_verification_requests()
}

#[ic_cdk::query]
fn get_pending_verification_requests() -> shared::types::Result<Vec<shared::types::VerificationRequest>> {
    admin::verification::get_pending_verification_requests()
}

#[ic_cdk::update]
fn process_verification_request(request: shared::types::ProcessVerificationRequest) -> shared::types::Result<String> {
    admin::verification::process_verification_request(request)
}

#[ic_cdk::query]
fn get_verification_request(verification_id: String) -> shared::types::Result<shared::types::VerificationRequest> {
    admin::verification::get_verification_request(verification_id)
}