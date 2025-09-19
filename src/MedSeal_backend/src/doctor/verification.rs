use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;

#[ic_cdk::update]
pub fn submit_verification_request(request: SubmitVerificationRequest) -> Result<String> {
    let caller_principal = caller().to_string();
    
    // Get the user
    let user = match storage::get_user_by_principal(&caller_principal) {
        Some(user) => user,
        None => return Err("User not found".to_string()),
    };
    
    // Only doctors and NGOs can submit verification requests
    if !matches!(user.role, UserRole::Doctor | UserRole::NGO) {
        return Err("Only doctors and NGOs can submit verification requests".to_string());
    }
    
    let request_id = format!("verification_{}", utils::generate_random_id());
    let current_time = utils::get_current_timestamp();
    
    let verification_request = VerificationRequest {
        id: request_id.clone(),
        doctor_id: user.id,
        institution_name: request.institution_name,
        institution_website: request.institution_website,
        license_authority: request.license_authority,
        license_authority_website: request.license_authority_website,
        medical_license_number: request.medical_license_number,
        additional_documents: request.additional_documents,
        submitted_at: current_time,
        processed_at: None,
        processed_by: None,
        admin_notes: None,
        status: VerificationStatus::Pending,
    };
    
    storage::store_verification_request(verification_request);
    Ok(request_id)
}
