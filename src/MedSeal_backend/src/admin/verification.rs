use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;
use candid::{CandidType};

// Helper function to verify admin role
fn verify_admin() -> Result<User> {
    let caller_principal = caller().to_string();
    
    match storage::get_user_by_principal(&caller_principal) {
        Some(user) => {
            match user.role {
                UserRole::Admin => Ok(user),
                _ => Err("Admin access required".to_string()),
            }
        },
        None => Err("User not found".to_string()),
    }
}

// Helper function to verify doctor role
fn verify_doctor() -> Result<User> {
    let caller_principal = caller().to_string();
    
    match storage::get_user_by_principal(&caller_principal) {
        Some(user) => {
            match user.role {
                UserRole::Doctor => Ok(user),
                _ => Err("Doctor access required".to_string()),
            }
        },
        None => Err("User not found".to_string()),
    }
}

#[ic_cdk::update]
pub fn submit_verification_request(request: SubmitVerificationRequest) -> Result<String> {
    let doctor = verify_doctor()?;
    
    // Check if doctor already has a pending or approved verification
    if let Some(existing_request) = &doctor.verification_request {
        match existing_request.status {
            VerificationStatus::Pending => {
                return Err("You already have a pending verification request".to_string());
            },
            VerificationStatus::Approved => {
                return Err("You are already verified".to_string());
            },
            _ => {}
        }
    }
    
    let verification_id = utils::generate_id("verify");
    let verification_request = VerificationRequest {
        id: verification_id.clone(),
        doctor_id: doctor.id.clone(),
        institution_name: request.institution_name,
        institution_website: request.institution_website,
        license_authority: request.license_authority,
        license_authority_website: request.license_authority_website,
        medical_license_number: request.medical_license_number,
        additional_documents: request.additional_documents,
        submitted_at: utils::get_current_timestamp(),
        processed_at: None,
        processed_by: None,
        admin_notes: None,
        status: VerificationStatus::Pending,
    };
    
    // Store the verification request
    storage::store_verification_request(verification_request.clone());
    
    // Update user's verification status and request
    if let Some(mut user) = storage::get_user(&doctor.id) {
        user.verification_status = VerificationStatus::Pending;
        user.verification_request = Some(verification_request);
        storage::store_user(user);
    }
    
    Ok(verification_id)
}

#[ic_cdk::query]
pub fn get_all_verification_requests() -> Result<Vec<VerificationRequest>> {
    let _admin = verify_admin()?;
    Ok(storage::get_all_verification_requests())
}

#[ic_cdk::query]
pub fn get_pending_verification_requests() -> Result<Vec<VerificationRequest>> {
    let _admin = verify_admin()?;
    Ok(storage::get_pending_verification_requests())
}

#[ic_cdk::query]
pub fn get_verification_request(request_id: String) -> Result<VerificationRequest> {
    let _admin = verify_admin()?;
    
    storage::get_verification_request(&request_id)
        .ok_or("Verification request not found".to_string())
}

#[ic_cdk::update]
pub fn process_verification_request(request: ProcessVerificationRequest) -> Result<String> {
    let _admin = verify_admin()?;
    
    let mut verification_request = storage::get_verification_request(&request.verification_id)
        .ok_or("Verification request not found".to_string())?;
    
    // Update verification request
    verification_request.status = request.status.clone();
    verification_request.processed_at = Some(utils::get_current_timestamp());
    verification_request.processed_by = Some(_admin.id.clone());
    verification_request.admin_notes = request.admin_notes;
    
    // Store updated request
    storage::update_verification_request(&request.verification_id, verification_request.clone());
    
    // Update user's verification status
    storage::update_user_verification_status(&verification_request.doctor_id, request.status.clone());
    
    // Update the user's verification request field
    if let Some(mut user) = storage::get_user(&verification_request.doctor_id) {
        user.verification_request = Some(verification_request);
        storage::store_user(user);
    }
    
    let status_msg = match request.status {
        VerificationStatus::Approved => "approved",
        VerificationStatus::Rejected => "rejected",
        _ => "processed",
    };
    
    Ok(format!("Verification request {}", status_msg))
}

#[ic_cdk::query]
pub fn get_doctor_verification_status(doctor_id: String) -> Result<VerificationStatusInfo> {
    let _admin = verify_admin()?;
    
    let user = storage::get_user(&doctor_id)
        .ok_or("Doctor not found".to_string())?;
    
    if !matches!(user.role, UserRole::Doctor) {
        return Err("User is not a doctor".to_string());
    }
    
    Ok(VerificationStatusInfo {
        doctor_id: user.id,
        doctor_name: user.name,
        verification_status: user.verification_status,
        verification_request: user.verification_request,
    })
}