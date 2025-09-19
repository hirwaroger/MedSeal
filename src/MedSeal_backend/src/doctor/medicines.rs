use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;
use ic_cdk::api::caller;

#[ic_cdk::update]
pub fn add_medicine(request: CreateMedicineRequest) -> Result<Medicine> {
    let caller_principal = caller().to_string();

    // Verify caller is a doctor
    let user = match storage::get_user_by_principal(&caller_principal) {
        Some(user) => user,
        None => return Err("User not found".to_string()),
    };

    match user.role {
        UserRole::Doctor => {},
        _ => return Err("Only doctors can add medicines".to_string()),
    }

    let medicine_id = utils::generate_medicine_id();
    let medicine = Medicine {
        id: medicine_id.clone(),
        name: request.name.clone(),
        dosage: request.dosage.clone(),
        frequency: request.frequency.clone(),
        duration: request.duration.clone(),
        side_effects: request.side_effects.clone(),
        guide_text: request.guide_text.clone(),
        guide_source: request.guide_source.clone(),
        description: request.guide_text.clone(), // simple description source
        created_at: utils::get_current_timestamp(),
        created_by: user.id.clone(),
        doctor_id: user.id.clone(),
        is_active: true,
    };

    storage::store_medicine(medicine.clone());
    Ok(medicine)
}

#[ic_cdk::query]
pub fn get_all_medicines() -> Vec<Medicine> {
    storage::get_all_medicines()
}

#[ic_cdk::query]
pub fn get_medicine(medicine_id: String) -> Option<Medicine> {
    storage::get_medicine(&medicine_id)
}

#[ic_cdk::query]
pub fn get_doctor_medicines(doctor_id: String) -> Vec<Medicine> {
    storage::get_doctor_medicines(&doctor_id)
}

#[ic_cdk::query]
pub fn get_doctor_prescriptions(doctor_id: String) -> Vec<Prescription> {
    storage::get_doctor_prescriptions(&doctor_id)
}

#[ic_cdk::query]
pub fn get_medicine_guide_text(medicine_id: String) -> Option<String> {
    storage::get_medicine(&medicine_id).map(|medicine| medicine.guide_text)
}

#[ic_cdk::update]
pub fn update_medicine(medicine_id: String, request: CreateMedicineRequest) -> Result<Medicine> {
    let caller_principal = caller().to_string();

    // Verify caller is a doctor
    let user = match storage::get_user_by_principal(&caller_principal) {
        Some(user) => user,
        None => return Err("User not found".to_string()),
    };

    match user.role {
        UserRole::Doctor => {},
        _ => return Err("Only doctors can update medicines".to_string()),
    }

    // Get existing medicine
    let existing_medicine = match storage::get_medicine(&medicine_id) {
        Some(medicine) => medicine,
        None => return Err("Medicine not found".to_string()),
    };

    // Verify the doctor owns this medicine
    if existing_medicine.created_by != user.id {
        return Err("You can only update your own medicines".to_string());
    }

    let updated_medicine = Medicine {
        id: existing_medicine.id.clone(),
        name: request.name.clone(),
        dosage: request.dosage.clone(),
        frequency: request.frequency.clone(),
        duration: request.duration.clone(),
        side_effects: request.side_effects.clone(),
        guide_text: request.guide_text.clone(),
        guide_source: request.guide_source.clone(),
        description: existing_medicine.description.clone(),
        created_at: existing_medicine.created_at,
        created_by: existing_medicine.created_by.clone(),
        doctor_id: existing_medicine.doctor_id.clone(),
        is_active: existing_medicine.is_active,
    };

    if storage::update_medicine_in_storage(&medicine_id, updated_medicine.clone()) {
        Ok(updated_medicine)
    } else {
        Err("Failed to update medicine".to_string())
    }
}

#[ic_cdk::update]
pub fn toggle_medicine_status(medicine_id: String) -> Result<Medicine> {
    let caller_principal = caller().to_string();

    // Verify caller is a doctor
    let user = match storage::get_user_by_principal(&caller_principal) {
        Some(user) => user,
        None => return Err("User not found".to_string()),
    };

    match user.role {
        UserRole::Doctor => {},
        _ => return Err("Only doctors can toggle medicine status".to_string()),
    }

    // Get existing medicine
    let mut existing_medicine = match storage::get_medicine(&medicine_id) {
        Some(medicine) => medicine,
        None => return Err("Medicine not found".to_string()),
    };

    // Verify the doctor owns this medicine
    if existing_medicine.created_by != user.id {
        return Err("You can only toggle your own medicines".to_string());
    }

    // Toggle status
    existing_medicine.is_active = !existing_medicine.is_active;

    if storage::update_medicine_in_storage(&medicine_id, existing_medicine.clone()) {
        Ok(existing_medicine)
    } else {
        Err("Failed to toggle medicine status".to_string())
    }
}