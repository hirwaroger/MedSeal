use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;

#[ic_cdk::update]
pub fn get_prescription(prescription_id: String, verification_code: String) -> Result<Prescription> {
    let caller_principal = caller().to_string();
    
    // Try to find prescription by the combined code format first
    let combined_code = format!("{}-{}", prescription_id, verification_code);
    
    let prescription = if let Some(prescription) = storage::get_prescription_by_code(&combined_code) {
        prescription
    } else if let Some(prescription) = storage::get_prescription(&prescription_id) {
        // Verify the verification code matches
        if prescription.prescription_code != verification_code {
            return Err("Invalid prescription code".to_string());
        }
        prescription
    } else {
        return Err("Prescription not found".to_string());
    };

    // Update access time and patient principal
    let current_time = utils::get_current_timestamp();
    
    // Update storage record
    if !storage::update_prescription_access(&prescription.id, current_time, Some(caller_principal)) {
        return Err("Failed to update prescription access".to_string());
    }

    // Return updated record
    if let Some(updated) = storage::get_prescription(&prescription.id) {
        Ok(updated)
    } else {
        Err("Failed to retrieve updated prescription".to_string())
    }
}

#[ic_cdk::query]
pub fn get_prescription_by_code(prescription_code: String) -> Option<Prescription> {
    storage::get_prescription_by_code(&prescription_code)
}

// Keep the old function for compatibility during transition
#[ic_cdk::query]
pub fn get_prescription_legacy(prescription_code: String, patient_contact: String) -> Result<Prescription> {
    match storage::get_prescription_by_code(&prescription_code) {
        Some(prescription) => {
            // Verify patient contact matches
            if prescription.patient_contact != patient_contact {
                return Err("Invalid prescription code or patient contact".to_string());
            }
            Ok(prescription)
        },
        None => Err("Prescription not found".to_string()),
    }
}