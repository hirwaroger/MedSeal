use std::collections::HashMap;
use std::cell::RefCell;
use crate::shared::types::*;

thread_local! {
    // User storage
    static USERS: RefCell<HashMap<String, User>> = RefCell::new(HashMap::new());
    static PRINCIPAL_TO_USER: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new());
    
    // Medicine storage
    static MEDICINES: RefCell<HashMap<String, Medicine>> = RefCell::new(HashMap::new());
    
    // Prescription storage
    static PRESCRIPTIONS: RefCell<HashMap<String, Prescription>> = RefCell::new(HashMap::new());
    static PRESCRIPTION_CODES: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new());
}

// User storage functions
pub fn store_user(user: User) {
    USERS.with(|users| {
        users.borrow_mut().insert(user.id.clone(), user.clone());
    });
    
    PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow_mut().insert(user.user_principal.clone(), user.id.clone());
    });
}

pub fn get_user(user_id: &str) -> Option<User> {
    USERS.with(|users| {
        users.borrow().get(user_id).cloned()
    })
}

pub fn get_user_by_principal(principal: &str) -> Option<User> {
    PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().get(principal).and_then(|user_id| {
            USERS.with(|users| {
                users.borrow().get(user_id).cloned()
            })
        })
    })
}

pub fn principal_has_account(principal: &str) -> bool {
    PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().contains_key(principal)
    })
}

pub fn list_user_principals() -> Vec<(String, String, String)> {
    USERS.with(|users| {
        users.borrow().values().map(|user| {
            (user.user_principal.clone(), user.id.clone(), user.email.clone())
        }).collect()
    })
}

// Medicine storage functions
pub fn store_medicine(medicine: Medicine) {
    MEDICINES.with(|medicines| {
        medicines.borrow_mut().insert(medicine.id.clone(), medicine);
    });
}

pub fn get_medicine(medicine_id: &str) -> Option<Medicine> {
    MEDICINES.with(|medicines| {
        medicines.borrow().get(medicine_id).cloned()
    })
}

pub fn get_doctor_medicines(doctor_id: &str) -> Vec<Medicine> {
    MEDICINES.with(|medicines| {
        medicines.borrow().values()
            .filter(|medicine| medicine.created_by == doctor_id)
            .cloned()
            .collect()
    })
}

pub fn get_all_medicines() -> Vec<Medicine> {
    MEDICINES.with(|medicines| {
        medicines.borrow().values().cloned().collect()
    })
}

pub fn update_medicine_in_storage(medicine_id: &str, updated_medicine: Medicine) -> bool {
    MEDICINES.with(|medicines| {
        let mut medicines_map = medicines.borrow_mut();
        if medicines_map.contains_key(medicine_id) {
            medicines_map.insert(medicine_id.to_string(), updated_medicine);
            true
        } else {
            false
        }
    })
}

// Prescription storage functions
pub fn store_prescription(prescription: Prescription) {
    let prescription_id = prescription.id.clone();
    let prescription_code = prescription.prescription_code.clone();
    
    PRESCRIPTIONS.with(|prescriptions| {
        prescriptions.borrow_mut().insert(prescription_id.clone(), prescription);
    });
    
    PRESCRIPTION_CODES.with(|codes| {
        codes.borrow_mut().insert(prescription_code, prescription_id);
    });
}

pub fn get_prescription_by_code(code: &str) -> Option<Prescription> {
    PRESCRIPTION_CODES.with(|codes| {
        codes.borrow().get(code).and_then(|prescription_id| {
            PRESCRIPTIONS.with(|prescriptions| {
                prescriptions.borrow().get(prescription_id).cloned()
            })
        })
    })
}

pub fn get_prescription(prescription_id: &str) -> Option<Prescription> {
    PRESCRIPTIONS.with(|prescriptions| {
        prescriptions.borrow().get(prescription_id).cloned()
    })
}

pub fn get_doctor_prescriptions(doctor_id: &str) -> Vec<Prescription> {
    PRESCRIPTIONS.with(|prescriptions| {
        prescriptions.borrow().values()
            .filter(|prescription| prescription.doctor_id == doctor_id)
            .cloned()
            .collect()
    })
}

pub fn update_prescription_access(prescription_id: &str, accessed_at: u64, patient_principal: Option<String>) -> bool {
    PRESCRIPTIONS.with(|prescriptions| {
        let mut prescriptions_map = prescriptions.borrow_mut();
        if let Some(mut prescription) = prescriptions_map.get(prescription_id).cloned() {
            prescription.accessed_at = Some(accessed_at);
            if let Some(principal) = patient_principal {
                prescription.patient_principal = Some(principal);
            }
            prescriptions_map.insert(prescription_id.to_string(), prescription);
            true
        } else {
            false
        }
    })
}