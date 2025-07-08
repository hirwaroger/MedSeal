use candid::{CandidType, Deserialize};
use ic_cdk::api::time;
use std::collections::HashMap;
use std::cell::RefCell;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum UserRole {
    Doctor,
    Patient,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub license_number: String, // Changed from Option<String> to String
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Medicine {
    pub id: String,
    pub name: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: String,
    pub side_effects: String,
    pub guide_text: String, // Changed from Option<String> to String
    pub guide_source: String, // Changed from Option<String> to String
    pub created_by: String,
    pub created_at: u64,
    pub is_active: bool, // New field to track if medicine is active
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PrescriptionMedicine {
    pub medicine_id: String,
    pub custom_dosage: Option<String>,
    pub custom_instructions: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Prescription {
    pub id: String,
    pub prescription_code: String,
    pub doctor_id: String,
    pub patient_name: String,
    pub patient_contact: String,
    pub medicines: Vec<PrescriptionMedicine>,
    pub additional_notes: String,
    pub created_at: u64,
    pub accessed_at: Option<u64>,
}

#[derive(CandidType, Deserialize)]
pub struct RegisterUserRequest {
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub license_number: String, // Changed from Option<String> to String
}

#[derive(CandidType, Deserialize, Debug)]
pub struct CreateMedicineRequest {
    pub name: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: String,
    pub side_effects: String,
    pub guide_text: String, // Changed to required
    pub guide_source: String, // Changed to required
}

#[derive(CandidType, Deserialize, Debug)]
pub struct CreatePrescriptionRequest {
    pub patient_name: String,
    pub patient_contact: String,
    pub medicines: Vec<PrescriptionMedicine>,
    pub additional_notes: String,
}

type Result<T> = std::result::Result<T, String>;

// Add a mapping from principal to user ID
thread_local! {
    static USERS: RefCell<HashMap<String, User>> = RefCell::new(HashMap::new());
    static MEDICINES: RefCell<HashMap<String, Medicine>> = RefCell::new(HashMap::new());
    static PRESCRIPTIONS: RefCell<HashMap<String, Prescription>> = RefCell::new(HashMap::new());
    static USER_EMAILS: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new()); // email -> user_id
    static PRINCIPAL_TO_USER: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new()); // principal -> user_id
}

#[ic_cdk::update]
fn register_user(request: RegisterUserRequest) -> Result<User> {
    let user_id = generate_user_id();
    let caller_principal = ic_cdk::caller().to_string();
    
    // Check if email already exists
    let email_exists = USER_EMAILS.with(|emails| {
        emails.borrow().contains_key(&request.email)
    });
    
    if email_exists {
        return Err("Email already registered".to_string());
    }
    
    // Validate doctor license number - check if role is Doctor and license_number is provided
    if matches!(request.role, UserRole::Doctor) {
        if request.license_number.trim().is_empty() {
            return Err("License number is required for doctors".to_string());
        }
    }
    
    let user = User {
        id: user_id.clone(),
        name: request.name,
        email: request.email.clone(),
        role: request.role,
        license_number: request.license_number,
        created_at: time(),
    };
    
    USERS.with(|users| {
        users.borrow_mut().insert(user_id.clone(), user.clone());
    });
    
    USER_EMAILS.with(|emails| {
        emails.borrow_mut().insert(request.email, user_id.clone());
    });
    
    // Map the caller's principal to the user ID
    PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow_mut().insert(caller_principal.clone(), user_id.clone());
    });
    
    ic_cdk::println!("Registered user {} with principal {} and user_id {}", user.name, caller_principal, user_id);
    
    Ok(user)
}

#[ic_cdk::query]
fn get_user(user_id: String) -> Option<User> {
    USERS.with(|users| {
        users.borrow().get(&user_id).cloned()
    })
}

#[ic_cdk::query]
fn authenticate_user(email: String, _password: String) -> Result<User> {
    ic_cdk::println!("Authenticating user with email: {}", email);
    
    // In a real implementation, you'd hash and verify the password
    let user_id = USER_EMAILS.with(|emails| {
        emails.borrow().get(&email).cloned()
    });
    
    ic_cdk::println!("Found user_id for email {}: {:?}", email, user_id);
    
    match user_id {
        Some(id) => {
            USERS.with(|users| {
                let user = users.borrow().get(&id).cloned();
                ic_cdk::println!("Retrieved user: {:?}", user);
                
                match user {
                    Some(u) => {
                        // Also ensure the principal mapping exists for future operations
                        let caller_principal = ic_cdk::caller().to_string();
                        PRINCIPAL_TO_USER.with(|mapping| {
                            mapping.borrow_mut().insert(caller_principal.clone(), id.clone());
                        });
                        ic_cdk::println!("Updated principal mapping for login: {} -> {}", caller_principal, id);
                        
                        Ok(u)
                    },
                    None => {
                        ic_cdk::println!("User not found in USERS map for id: {}", id);
                        Err("User not found".to_string())
                    }
                }
            })
        },
        None => {
            ic_cdk::println!("Email not found in USER_EMAILS map");
            Err("Invalid credentials".to_string())
        }
    }
}

#[ic_cdk::update]
fn add_medicine(request: CreateMedicineRequest) -> Result<Medicine> {
    let caller_principal = ic_cdk::caller().to_string();
    
    // Get the user ID associated with this principal
    let doctor_user_id = PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().get(&caller_principal).cloned()
    });
    
    let doctor_id = match doctor_user_id {
        Some(user_id) => user_id,
        None => {
            ic_cdk::println!("No user ID found for principal: {}", caller_principal);
            return Err("User not found. Please register first.".to_string());
        }
    };
    
    let medicine_id = generate_id();
    
    // Debug logging
    ic_cdk::println!("Adding medicine for doctor: {} (principal: {})", doctor_id, caller_principal);
    ic_cdk::println!("Medicine data: {:?}", request);
    
    let medicine = Medicine {
        id: medicine_id.clone(),
        name: request.name,
        dosage: request.dosage,
        frequency: request.frequency,
        duration: request.duration,
        side_effects: request.side_effects,
        guide_text: request.guide_text, // Direct assignment since both are String
        guide_source: request.guide_source, // Direct assignment since both are String
        created_by: doctor_id.clone(),
        created_at: time(),
        is_active: true,
    };
    
    MEDICINES.with(|medicines| {
        medicines.borrow_mut().insert(medicine_id.clone(), medicine.clone());
        ic_cdk::println!("Medicine stored with ID: {}", medicine_id);
        ic_cdk::println!("Total medicines count: {}", medicines.borrow().len());
    });
    
    Ok(medicine)
}

// Add function to toggle medicine status
#[ic_cdk::update]
fn toggle_medicine_status(medicine_id: String) -> Result<Medicine> {
    let caller_principal = ic_cdk::caller().to_string();
    
    // Get the user ID associated with this principal
    let doctor_user_id = PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().get(&caller_principal).cloned()
    });
    
    let doctor_id = match doctor_user_id {
        Some(user_id) => user_id,
        None => {
            return Err("User not found. Please register first.".to_string());
        }
    };
    
    MEDICINES.with(|medicines| {
        let mut medicines_map = medicines.borrow_mut();
        if let Some(medicine) = medicines_map.get_mut(&medicine_id) {
            if medicine.created_by != doctor_id {
                return Err("Unauthorized to modify this medicine".to_string());
            }
            
            medicine.is_active = !medicine.is_active;
            ic_cdk::println!("Medicine '{}' status changed to: {}", medicine.name, medicine.is_active);
            
            Ok(medicine.clone())
        } else {
            Err("Medicine not found".to_string())
        }
    })
}

#[ic_cdk::query]
fn get_doctor_medicines(doctor_id: String) -> Vec<Medicine> {
    ic_cdk::println!("Getting medicines for doctor: {}", doctor_id);
    
    let medicines = MEDICINES.with(|medicines| {
        let all_medicines: Vec<Medicine> = medicines.borrow().values().cloned().collect();
        ic_cdk::println!("Total medicines in storage: {}", all_medicines.len());
        
        // Debug: print all medicines and their creators
        for medicine in &all_medicines {
            ic_cdk::println!("Medicine '{}' created by: '{}'", medicine.name, medicine.created_by);
        }
        
        let filtered_medicines: Vec<Medicine> = all_medicines
            .into_iter()
            .filter(|medicine| {
                let matches = medicine.created_by == doctor_id;
                ic_cdk::println!("Medicine '{}' matches doctor '{}': {}", medicine.name, doctor_id, matches);
                matches
            })
            .collect();
        
        ic_cdk::println!("Filtered medicines count: {}", filtered_medicines.len());
        filtered_medicines
    });
    
    medicines
}

// Add a new method to get all medicines for debugging
#[ic_cdk::query]
fn get_all_medicines_debug() -> Vec<Medicine> {
    MEDICINES.with(|medicines| {
        medicines.borrow().values().cloned().collect()
    })
}

// Add a method to get the current caller for debugging
#[ic_cdk::query]
fn get_current_caller() -> String {
    ic_cdk::caller().to_string()
}

#[ic_cdk::query]
fn get_medicine(medicine_id: String) -> Option<Medicine> {
    MEDICINES.with(|medicines| {
        medicines.borrow().get(&medicine_id).cloned()
    })
}

#[ic_cdk::update]
fn update_medicine(medicine_id: String, request: CreateMedicineRequest) -> Result<Medicine> {
    let caller_principal = ic_cdk::caller().to_string();
    
    // Get the user ID associated with this principal
    let doctor_user_id = PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().get(&caller_principal).cloned()
    });
    
    let doctor_id = match doctor_user_id {
        Some(user_id) => user_id,
        None => {
            return Err("User not found. Please register first.".to_string());
        }
    };
    
    MEDICINES.with(|medicines| {
        let mut medicines_map = medicines.borrow_mut();
        if let Some(medicine) = medicines_map.get_mut(&medicine_id) {
            if medicine.created_by != doctor_id {
                return Err("Unauthorized to update this medicine".to_string());
            }
            
            medicine.name = request.name;
            medicine.dosage = request.dosage;
            medicine.frequency = request.frequency;
            medicine.duration = request.duration;
            medicine.side_effects = request.side_effects;
            medicine.guide_text = request.guide_text; // Direct assignment since both are String
            medicine.guide_source = request.guide_source; // Direct assignment since both are String
            
            Ok(medicine.clone())
        } else {
            Err("Medicine not found".to_string())
        }
    })
}

// Replace PDF function with text function
#[ic_cdk::query]
fn get_medicine_guide_text(medicine_id: String) -> Option<String> {
    MEDICINES.with(|medicines| {
        medicines.borrow().get(&medicine_id)
            .map(|medicine| medicine.guide_text.clone()) // Changed from .and_then() to .map() since guide_text is now String
    })
}

#[ic_cdk::update]
fn create_prescription(request: CreatePrescriptionRequest) -> Result<String> {
    let caller_principal = ic_cdk::caller().to_string();
    
    // Get the user ID associated with this principal
    let doctor_user_id = PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().get(&caller_principal).cloned()
    });
    
    let doctor_id = match doctor_user_id {
        Some(user_id) => user_id,
        None => {
            return Err("User not found. Please register first.".to_string());
        }
    };
    
    let prescription_id = generate_prescription_id();
    let prescription_code = generate_prescription_code();
    
    let prescription = Prescription {
        id: prescription_id.clone(),
        prescription_code: prescription_code.clone(),
        doctor_id,
        patient_name: request.patient_name,
        patient_contact: request.patient_contact,
        medicines: request.medicines,
        additional_notes: request.additional_notes,
        created_at: time(),
        accessed_at: None,
    };
    
    PRESCRIPTIONS.with(|prescriptions| {
        prescriptions.borrow_mut().insert(prescription_id.clone(), prescription);
    });
    
    Ok(format!("{}-{}", prescription_id, prescription_code))
}

#[ic_cdk::query]
fn get_prescription(prescription_id: String, code: String) -> Result<Prescription> {
    ic_cdk::println!("Getting prescription with ID: {} and code: {}", prescription_id, code);
    
    PRESCRIPTIONS.with(|prescriptions| {
        let mut prescriptions_map = prescriptions.borrow_mut();
        
        // Debug: print all prescriptions
        ic_cdk::println!("Total prescriptions in storage: {}", prescriptions_map.len());
        for (id, prescription) in prescriptions_map.iter() {
            ic_cdk::println!("Prescription ID: {}, Code: {}, Patient: {}", id, prescription.prescription_code, prescription.patient_name);
        }
        
        if let Some(prescription) = prescriptions_map.get_mut(&prescription_id) {
            ic_cdk::println!("Found prescription, checking code: {} vs {}", prescription.prescription_code, code);
            if prescription.prescription_code == code {
                // Only mark as accessed when retrieved by patient, not when created
                if prescription.accessed_at.is_none() {
                    prescription.accessed_at = Some(time());
                    ic_cdk::println!("Prescription marked as accessed for the first time at: {}", time());
                } else {
                    ic_cdk::println!("Prescription was already accessed before at: {:?}", prescription.accessed_at);
                }
                
                // Ensure medicines data is valid
                ic_cdk::println!("Prescription has {} medicines", prescription.medicines.len());
                for (i, med) in prescription.medicines.iter().enumerate() {
                    ic_cdk::println!("Medicine {}: ID={}, Instructions={}", i, med.medicine_id, med.custom_instructions);
                }
                
                Ok(prescription.clone())
            } else {
                ic_cdk::println!("Invalid prescription code");
                Err("Invalid prescription code".to_string())
            }
        } else {
            ic_cdk::println!("Prescription not found");
            Err("Prescription not found".to_string())
        }
    })
}

// Add a debug method to check prescription by ID only
#[ic_cdk::query]
fn debug_get_prescription_by_id(prescription_id: String) -> Option<Prescription> {
    PRESCRIPTIONS.with(|prescriptions| {
        prescriptions.borrow().get(&prescription_id).cloned()
    })
}

#[ic_cdk::query]
fn get_doctor_prescriptions(doctor_id: String) -> Vec<Prescription> {
    ic_cdk::println!("Getting prescriptions for doctor: {}", doctor_id);
    PRESCRIPTIONS.with(|prescriptions| {
        let filtered_prescriptions: Vec<Prescription> = prescriptions.borrow().values()
            .filter(|prescription| prescription.doctor_id == doctor_id)
            .cloned()
            .collect();
        
        ic_cdk::println!("Found {} prescriptions for doctor {}", filtered_prescriptions.len(), doctor_id);
        filtered_prescriptions
    })
}

#[ic_cdk::query]
fn generate_user_id() -> String {
    format!("user_{}", time())
}

fn generate_id() -> String {
    format!("med_{}", time())
}

fn generate_prescription_id() -> String {
    // Use a simpler format that doesn't cause BigInt issues
    let timestamp = time();
    format!("{:06}", (timestamp % 1000000))
}

fn generate_prescription_code() -> String {
    // Use a simpler format that doesn't cause BigInt issues
    let timestamp = time();
    format!("{:06}", ((timestamp * 13) % 1000000))
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// Add debug method to check principal mapping
#[ic_cdk::query]
fn get_principal_mapping_debug() -> Vec<(String, String)> {
    PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().iter().map(|(k, v)| (k.clone(), v.clone())).collect()
    })
}

