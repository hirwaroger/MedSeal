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
    
    // Verification storage
    static VERIFICATION_REQUESTS: RefCell<HashMap<String, VerificationRequest>> = RefCell::new(HashMap::new());
    
    // Admin settings
    static ADMIN_EXISTS: RefCell<bool> = RefCell::new(false);

    // Patient Case storage
    static PATIENT_CASES: RefCell<HashMap<String, PatientCase>> = RefCell::new(HashMap::new());
    
    // Contribution storage
    static CONTRIBUTION_POOLS: RefCell<HashMap<String, ContributionPool>> = RefCell::new(HashMap::new());
    static CONTRIBUTIONS: RefCell<HashMap<String, Contribution>> = RefCell::new(HashMap::new());
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

pub fn list_user_principals() -> Vec<crate::shared::types::PrincipalEntry> {
    PRINCIPAL_TO_USER.with(|principal_to_user| {
        USERS.with(|users| {
            let principal_map = principal_to_user.borrow();
            let users_map = users.borrow();
            
            principal_map.iter()
                .filter_map(|(principal, user_id)| {
                    users_map.get(user_id).map(|user| {
                        crate::shared::types::PrincipalEntry {
                            principal_ent: principal.clone(),
                            user_id: user_id.clone(),
                            email: user.email.clone(),
                        }
                    })
                })
                .collect()
        })
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
        medicines.borrow()
            .values()
            .filter(|medicine| medicine.doctor_id == doctor_id)
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
        prescriptions.borrow()
            .values()
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

// Admin functions
pub fn admin_exists() -> bool {
    ADMIN_EXISTS.with(|exists| *exists.borrow())
}

pub fn set_admin_exists(exists: bool) {
    ADMIN_EXISTS.with(|admin_flag| {
        *admin_flag.borrow_mut() = exists;
    });
}

pub fn get_all_doctors() -> Vec<User> {
    USERS.with(|users| {
        users.borrow().values()
            .filter(|user| matches!(user.role, UserRole::Doctor))
            .cloned()
            .collect()
    })
}

pub fn get_all_patients() -> Vec<User> {
    USERS.with(|users| {
        users.borrow().values()
            .filter(|user| matches!(user.role, UserRole::Patient))
            .cloned()
            .collect()
    })
}

pub fn update_user_activity(user_id: &str, timestamp: u64) -> bool {
    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        if let Some(mut user) = users_map.get(user_id).cloned() {
            user.last_active = Some(timestamp);
            users_map.insert(user_id.to_string(), user);
            true
        } else {
            false
        }
    })
}

pub fn update_user_stats(user_id: &str, prescription_count: u64, medicine_count: u64) -> bool {
    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        if let Some(mut user) = users_map.get(user_id).cloned() {
            user.total_prescriptions = prescription_count;
            user.total_medicines = medicine_count;
            users_map.insert(user_id.to_string(), user);
            true
        } else {
            false
        }
    })
}

// Verification request functions
pub fn store_verification_request(request: VerificationRequest) {
    VERIFICATION_REQUESTS.with(|requests| {
        requests.borrow_mut().insert(request.id.clone(), request);
    });
}

pub fn get_verification_request(request_id: &str) -> Option<VerificationRequest> {
    VERIFICATION_REQUESTS.with(|requests| {
        requests.borrow().get(request_id).cloned()
    })
}

pub fn get_all_verification_requests() -> Vec<VerificationRequest> {
    VERIFICATION_REQUESTS.with(|requests| {
        requests.borrow().values().cloned().collect()
    })
}

pub fn get_pending_verification_requests() -> Vec<VerificationRequest> {
    VERIFICATION_REQUESTS.with(|requests| {
        requests.borrow().values()
            .filter(|req| matches!(req.status, VerificationStatus::Pending))
            .cloned()
            .collect()
    })
}

pub fn update_verification_request(request_id: &str, updated_request: VerificationRequest) -> bool {
    VERIFICATION_REQUESTS.with(|requests| {
        let mut requests_map = requests.borrow_mut();
        if requests_map.contains_key(request_id) {
            requests_map.insert(request_id.to_string(), updated_request);
            true
        } else {
            false
        }
    })
}

pub fn update_user_verification_status(user_id: &str, status: VerificationStatus) -> bool {
    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        if let Some(mut user) = users_map.get(user_id).cloned() {
            user.verification_status = status;
            users_map.insert(user_id.to_string(), user);
            true
        } else {
            false
        }
    })
}

// Patient Case functions
pub fn store_patient_case(case: PatientCase) {
    PATIENT_CASES.with(|cases| {
        cases.borrow_mut().insert(case.id.clone(), case);
    });
}

pub fn get_patient_case(case_id: &str) -> Option<PatientCase> {
    PATIENT_CASES.with(|cases| {
        cases.borrow().get(case_id).cloned()
    })
}

pub fn update_patient_case(case_id: &str, case: PatientCase) {
    PATIENT_CASES.with(|cases| {
        cases.borrow_mut().insert(case_id.to_string(), case);
    });
}

pub fn get_all_patient_cases() -> Vec<PatientCase> {
    PATIENT_CASES.with(|cases| {
        cases.borrow().values().cloned().collect()
    })
}

pub fn get_patient_cases_by_status(status: CaseStatus) -> Vec<PatientCase> {
    PATIENT_CASES.with(|cases| {
        cases.borrow()
            .values()
            .filter(|case| std::mem::discriminant(&case.status) == std::mem::discriminant(&status))
            .cloned()
            .collect()
    })
}

// Contribution Pool functions
pub fn store_contribution_pool(pool: ContributionPool) {
    CONTRIBUTION_POOLS.with(|pools| {
        pools.borrow_mut().insert(pool.id.clone(), pool);
    });
}

pub fn get_contribution_pool(pool_id: &str) -> Option<ContributionPool> {
    CONTRIBUTION_POOLS.with(|pools| {
        pools.borrow().get(pool_id).cloned()
    })
}

pub fn update_contribution_pool(pool_id: &str, pool: ContributionPool) {
    CONTRIBUTION_POOLS.with(|pools| {
        pools.borrow_mut().insert(pool_id.to_string(), pool);
    });
}

pub fn get_all_contribution_pools() -> Vec<ContributionPool> {
    CONTRIBUTION_POOLS.with(|pools| {
        pools.borrow().values().cloned().collect()
    })
}

pub fn get_active_contribution_pools() -> Vec<ContributionPool> {
    CONTRIBUTION_POOLS.with(|pools| {
        pools.borrow()
            .values()
            .filter(|pool| pool.is_active && !pool.is_completed)
            .cloned()
            .collect()
    })
}

pub fn get_contribution_pools_by_ngo(ngo_id: &str) -> Vec<ContributionPool> {
    CONTRIBUTION_POOLS.with(|pools| {
        pools.borrow()
            .values()
            .filter(|pool| pool.ngo_id == ngo_id)
            .cloned()
            .collect()
    })
}

pub fn get_pool_by_case_id(case_id: &str) -> Option<ContributionPool> {
    CONTRIBUTION_POOLS.with(|pools| {
        pools.borrow()
            .values()
            .find(|pool| pool.case_id == case_id)
            .cloned()
    })
}

// Contribution functions
pub fn store_contribution(contribution: Contribution) {
    CONTRIBUTIONS.with(|contributions| {
        contributions.borrow_mut().insert(contribution.id.clone(), contribution);
    });
}

pub fn get_contributions_by_pool(pool_id: &str) -> Vec<Contribution> {
    CONTRIBUTIONS.with(|contributions| {
        contributions.borrow()
            .values()
            .filter(|contrib| contrib.pool_id == pool_id)
            .cloned()
            .collect()
    })
}

pub fn get_contributions_by_user(user_principal: &str) -> Vec<Contribution> {
    CONTRIBUTIONS.with(|contributions| {
        contributions.borrow()
            .values()
            .filter(|contrib| contrib.contributor_principal == user_principal)
            .cloned()
            .collect()
    })
}