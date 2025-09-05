use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;

#[ic_cdk::update]
pub fn create_prescription(request: CreatePrescriptionRequest) -> Result<String> {
    let caller_principal = caller().to_string();

    // Verify caller is a doctor
    let user = match storage::get_user_by_principal(&caller_principal) {
        Some(user) => user,
        None => return Err("User not found".to_string()),
    };

    match user.role {
        UserRole::Doctor => {},
        _ => return Err("Only doctors can create prescriptions".to_string()),
    }

    // Validate that all medicines exist
    for prescription_medicine in &request.medicines {
        if storage::get_medicine(&prescription_medicine.medicine_id).is_none() {
            return Err(format!("Medicine with ID {} not found", prescription_medicine.medicine_id));
        }
    }

    let prescription_code = utils::generate_prescription_code();
    let prescription = Prescription {
        id: utils::generate_prescription_id(),
        prescription_code: prescription_code.clone(),
        doctor_id: user.id,
        patient_name: request.patient_name,
        patient_contact: request.patient_contact,
        medicines: request.medicines,
        additional_notes: request.additional_notes,
        created_at: utils::get_current_timestamp(),
        accessed_at: None,
        patient_principal: None,
    };

    storage::store_prescription(prescription);
    Ok(prescription_code)
}

#[ic_cdk::query]
pub fn get_doctor_prescriptions(doctor_id: String) -> Vec<Prescription> {
    storage::get_doctor_prescriptions(&doctor_id)
}

#[ic_cdk::query]
pub fn debug_get_prescription_with_medicines(prescription_code: String) -> Result<String> {
    match storage::get_prescription_by_code(&prescription_code) {
        Some(prescription) => {
            let mut result = format!("Prescription ID: {}\n", prescription.id);
            result.push_str(&format!("Doctor ID: {}\n", prescription.doctor_id));
            result.push_str(&format!("Patient: {}\n", prescription.patient_name));
            result.push_str(&format!("Contact: {}\n", prescription.patient_contact));
            result.push_str(&format!("Created: {}\n", prescription.created_at));
            result.push_str(&format!("Notes: {}\n", prescription.additional_notes));
            result.push_str("Medicines:\n");

            for med in prescription.medicines {
                if let Some(medicine) = storage::get_medicine(&med.medicine_id) {
                    result.push_str(&format!("- {} ({})\n", medicine.name, medicine.dosage));
                    if let Some(custom_dosage) = med.custom_dosage {
                        result.push_str(&format!("  Custom Dosage: {}\n", custom_dosage));
                    }
                    if !med.custom_instructions.is_empty() {
                        result.push_str(&format!("  Instructions: {}\n", med.custom_instructions));
                    }
                } else {
                    result.push_str(&format!("- Medicine ID {} (not found)\n", med.medicine_id));
                }
            }

            Ok(result)
        },
        None => Err("Prescription not found".to_string()),
    }
}