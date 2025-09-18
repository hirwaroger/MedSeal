use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage;
use crate::shared::utils;

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
        verification_type: VerificationType::Doctor, // Set default verification type
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

#[ic_cdk::query]
pub fn get_all_verification_requests() -> Result<Vec<VerificationRequest>> {
    let caller_principal = caller().to_string();
    
    // Verify admin access
    if let Some(user) = storage::get_user_by_principal(&caller_principal) {
        match user.role {
            UserRole::Admin => {
                Ok(storage::get_all_verification_requests())
            },
            _ => Err("Access denied. Admin privileges required.".to_string()),
        }
    } else {
        Err("User not found".to_string())
    }
}

#[ic_cdk::query]
pub fn get_pending_verification_requests() -> Result<Vec<VerificationRequest>> {
    let caller_principal = caller().to_string();
    
    // Verify admin access
    if let Some(user) = storage::get_user_by_principal(&caller_principal) {
        match user.role {
            UserRole::Admin => {
                let all_requests = storage::get_all_verification_requests();
                let pending_requests: Vec<VerificationRequest> = all_requests
                    .into_iter()
                    .filter(|req| matches!(req.status, VerificationStatus::Pending))
                    .collect();
                Ok(pending_requests)
            },
            _ => Err("Access denied. Admin privileges required.".to_string()),
        }
    } else {
        Err("User not found".to_string())
    }
}

#[ic_cdk::query]
pub fn get_doctor_verification_requests() -> Result<Vec<VerificationRequest>> {
    let caller_principal = caller().to_string();
    
    // Verify admin access
    if let Some(user) = storage::get_user_by_principal(&caller_principal) {
        match user.role {
            UserRole::Admin => {
                let all_requests = storage::get_all_verification_requests();
                let doctor_requests: Vec<VerificationRequest> = all_requests
                    .into_iter()
                    .filter(|req| matches!(req.verification_type, VerificationType::Doctor))
                    .collect();
                Ok(doctor_requests)
            },
            _ => Err("Access denied. Admin privileges required.".to_string()),
        }
    } else {
        Err("User not found".to_string())
    }
}

#[ic_cdk::query]
pub fn get_ngo_verification_requests() -> Result<Vec<VerificationRequest>> {
    let caller_principal = caller().to_string();
    
    // Verify admin access
    if let Some(user) = storage::get_user_by_principal(&caller_principal) {
        match user.role {
            UserRole::Admin => {
                let all_requests = storage::get_all_verification_requests();
                let ngo_requests: Vec<VerificationRequest> = all_requests
                    .into_iter()
                    .filter(|req| matches!(req.verification_type, VerificationType::NGO))
                    .collect();
                Ok(ngo_requests)
            },
            _ => Err("Access denied. Admin privileges required.".to_string()),
        }
    } else {
        Err("User not found".to_string())
    }
}

#[ic_cdk::update]
pub fn process_verification_request(request: ProcessVerificationRequest) -> Result<String> {
    let caller_principal = caller().to_string();
    
    // Verify admin access
    if let Some(admin_user) = storage::get_user_by_principal(&caller_principal) {
        match admin_user.role {
            UserRole::Admin => {
                let current_time = utils::get_current_timestamp();
                
                // Get the verification request
                if let Some(mut verification_request) = storage::get_verification_request(&request.verification_id) {
                    // Update verification request
                    verification_request.status = request.status.clone();
                    verification_request.processed_at = Some(current_time);
                    verification_request.processed_by = Some(admin_user.id.clone());
                    verification_request.admin_notes = Some(request.admin_notes.join(", "));
                    
                    // Save updated verification request
                    storage::update_verification_request(&verification_request);
                    
                    // Update user's verification status based on request type
                    if let Some(mut user) = storage::get_user(&verification_request.requester_id) {
                        user.verification_status = request.status.clone();
                        user.verification_request = Some(verification_request.clone());
                        storage::update_user(&user);
                    }
                    
                    let status_msg = match request.status {
                        VerificationStatus::Approved => "approved",
                        VerificationStatus::Rejected => "rejected",
                        _ => "processed",
                    };
                    
                    Ok(format!("Verification request {}", status_msg))
                } else {
                    Err("Verification request not found".to_string())
                }
            },
            _ => Err("Access denied. Admin privileges required.".to_string()),
        }
    } else {
        Err("Admin user not found".to_string())
    }
}

#[ic_cdk::query]
pub fn get_verification_request(verification_id: String) -> Result<VerificationRequest> {
    let caller_principal = caller().to_string();
    
    // Verify admin access or owner access
    if let Some(user) = storage::get_user_by_principal(&caller_principal) {
        if let Some(verification_request) = storage::get_verification_request(&verification_id) {
            match user.role {
                UserRole::Admin => Ok(verification_request),
                UserRole::Doctor | UserRole::NGO => {
                    // Allow users to view their own verification requests
                    if verification_request.requester_id == user.id {
                        Ok(verification_request)
                    } else {
                        Err("Access denied".to_string())
                    }
                },
                _ => Err("Access denied".to_string()),
            }
        } else {
            Err("Verification request not found".to_string())
        }
    } else {
        Err("User not found".to_string())
    }
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