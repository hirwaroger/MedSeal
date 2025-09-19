use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;

/// Create a new prescription (doctor only)
#[ic_cdk::update]
pub fn create_prescription(request: CreatePrescriptionRequest) -> Result<String> {
    let caller_principal = caller().to_string();

    // Validate user is a doctor
    let user = match storage::get_user_by_principal(&caller_principal) {
        Some(u) => u,
        None => return Err("User not found".to_string()),
    };
    
    if !matches!(user.role, UserRole::Doctor) {
        return Err("Only doctors can create prescriptions".to_string());
    }
    
    let prescription_id = format!("prescription_{}", utils::generate_random_id());
    let prescription_code = format!("RX{}", utils::generate_random_id() % 1_000_000);
    let current_time = utils::get_current_timestamp();
    
    let prescription = Prescription {
        id: prescription_id.clone(),
        prescription_code: prescription_code.clone(),
        patient_name: request.patient_name,
        patient_contact: request.patient_contact,
        patient_principal: None,
        medicines: request.medicines,
        additional_notes: request.additional_notes,
        created_at: current_time,
        accessed_at: None,
        doctor_id: user.id,
    };
    
    storage::store_prescription(prescription);
    Ok(prescription_code)
}

/// Query prescriptions belonging to a doctor
#[ic_cdk::query]
pub fn get_prescriptions_by_doctor(doctor_id: String) -> Vec<Prescription> {
    storage::get_doctor_prescriptions(&doctor_id)
}