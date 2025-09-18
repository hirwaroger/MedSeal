use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage;
use crate::shared::utils;

#[ic_cdk::update]
pub fn submit_ngo_verification_request(request: SubmitVerificationRequest) -> Result<String> {
    let caller_principal = caller().to_string();
    
    // Get the NGO user
    if let Some(user) = storage::get_user_by_principal(&caller_principal) {
        match user.role {
            UserRole::NGO => {
                // Check if user already has a pending or approved verification
                if let Some(existing_request) = &user.verification_request {
                    match existing_request.status {
                        VerificationStatus::Pending => {
                            return Err("You already have a pending verification request".to_string());
                        },
                        VerificationStatus::Approved => {
                            return Err("You are already verified".to_string());
                        },
                        _ => {
                            // Allow resubmission if rejected
                        }
                    }
                }
                
                let verification_id = utils::generate_id();
                let current_time = utils::get_current_timestamp();
                
                let verification_request = VerificationRequest {
                    id: verification_id.clone(),
                    requester_id: user.id.clone(),
                    verification_type: VerificationType::NGO,
                    institution_name: request.institution_name,
                    institution_website: request.institution_website,
                    license_authority: request.license_authority,
                    license_authority_website: request.license_authority_website,
                    medical_license_number: request.medical_license_number, // For NGO this is registration number
                    additional_documents: request.additional_documents,
                    submitted_at: current_time,
                    processed_at: None,
                    processed_by: None,
                    admin_notes: None,
                    status: VerificationStatus::Pending,
                };
                
                // Store the verification request
                storage::store_verification_request(&verification_request);
                
                // Update user with verification request and status
                let mut updated_user = user;
                updated_user.verification_status = VerificationStatus::Pending;
                updated_user.verification_request = Some(verification_request);
                storage::update_user(&updated_user);
                
                Ok(format!("NGO verification request submitted successfully with ID: {}", verification_id))
            },
            _ => Err("Only NGOs can submit NGO verification requests".to_string()),
        }
    } else {
        Err("User not found".to_string())
    }
}
