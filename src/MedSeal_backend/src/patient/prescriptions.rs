use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;

#[ic_cdk::query]
pub fn get_prescription(prescription_code: String, patient_contact: String) -> Result<Prescription> {
    match storage::get_prescription_by_code(&prescription_code) {
        Some(mut prescription) => {
            // Verify patient contact matches
            if prescription.patient_contact != patient_contact {
                return Err("Invalid prescription code or patient contact".to_string());
            }

            // Update access time and patient principal (this should ideally be an update call)
            let caller_principal = caller().to_string();
            let current_time = utils::get_current_timestamp();

            // Update storage record
            storage::update_prescription_access(&prescription.id, current_time, Some(caller_principal.clone()));

            // Return updated record
            if let Some(updated) = storage::get_prescription(&prescription.id) {
                Ok(updated)
            } else {
                Err("Failed to update prescription access".to_string())
            }
        },
        None => Err("Prescription not found".to_string()),
    }
}