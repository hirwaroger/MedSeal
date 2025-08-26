use candid::{CandidType, Deserialize};
use ic_cdk::api::time;
use std::collections::HashMap;
use std::cell::RefCell;

// ICRC standards support for NFID
#[derive(CandidType, Deserialize, Eq, PartialEq, Debug)]
pub struct SupportedStandard {
    pub url: String,
    pub name: String,
}

#[ic_cdk::query]
fn icrc10_supported_standards() -> Vec<SupportedStandard> {
    vec![
        SupportedStandard {
            url: "https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-10/ICRC-10.md".to_string(),
            name: "ICRC-10".to_string(),
        },
        SupportedStandard {
            url: "https://github.com/dfinity/wg-identity-authentication/blob/main/topics/icrc_28_trusted_origins.md".to_string(),
            name: "ICRC-28".to_string(),
        },
    ]
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Icrc28TrustedOriginsResponse {
    pub trusted_origins: Vec<String>
}

#[ic_cdk::update]
fn icrc28_trusted_origins() -> Icrc28TrustedOriginsResponse {
    let trusted_origins = vec![
        String::from("https://your-frontend-canister-id.icp0.io"),
        String::from("https://your-frontend-canister-id.raw.icp0.io"),
        String::from("https://your-frontend-canister-id.ic0.app"),
        String::from("https://your-frontend-canister-id.raw.ic0.app"),
        String::from("https://your-frontend-canister-id.icp0.icp-api.io"),
        String::from("https://your-frontend-canister-id.icp-api.io"),
        String::from("http://localhost:3000"), // For local development
        String::from("http://127.0.0.1:3000"), // For local development
    ];
    
    Icrc28TrustedOriginsResponse { trusted_origins }
}

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
    pub license_number: String,
    pub user_principal: String, // Renamed from `principal`
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
    pub guide_text: String, // Changed to required
    pub guide_source: String, // Changed to required
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

#[derive(CandidType, Deserialize)]
pub struct RegisterUserWithPrincipalRequest {
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub license_number: String,
    pub user_principal: String, // Renamed from `principal`
}

type Result<T> = std::result::Result<T, String>;

// Add a mapping from principal to user ID
thread_local! {
    static USERS: RefCell<HashMap<String, User>> = RefCell::new(HashMap::new());
    static MEDICINES: RefCell<HashMap<String, Medicine>> = RefCell::new(HashMap::new());
    static PRESCRIPTIONS: RefCell<HashMap<String, Prescription>> = RefCell::new(HashMap::new());
    static USER_EMAILS: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new()); // email -> user_id
    static PRINCIPAL_TO_USER: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new()); // principal -> user_id
    static USER_PRINCIPALS: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new()); // user_id -> principal
}

#[ic_cdk::update]
fn register_user(request: RegisterUserRequest) -> Result<User> {
    let user_id = generate_user_id();
    // Changed to normalize the caller principal
    let caller_principal = ic_cdk::caller().to_string().trim().to_lowercase();
    
    // Check if email already exists
    let email_exists = USER_EMAILS.with(|emails| {
        emails.borrow().contains_key(&request.email)
    });
    
    if email_exists {
        return Err("Email already registered".to_string());
    }
    
    // Validate doctor license number - check if role is Doctor and license_number is provided
    if matches!(request.role, UserRole::Doctor) {
        if request.license_number.trim().is_empty() || request.license_number == "Not Needed" {
            return Err("License number is required for doctors".to_string());
        }
    }
    // For patients, ensure license_number is set to "Not Needed"
    let final_license_number = if matches!(request.role, UserRole::Patient) {
        "Not Needed".to_string()
    } else {
        request.license_number
    };
    
    let user = User {
        id: user_id.clone(),
        name: request.name,
        email: request.email.clone(),
        role: request.role,
        license_number: final_license_number,
        user_principal: caller_principal.clone(),
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

#[ic_cdk::update]
fn register_user_with_principal(request: RegisterUserWithPrincipalRequest) -> Result<User> {
    let user_id = generate_user_id();
    // Normalize the caller principal
    let caller_principal = ic_cdk::caller().to_string().trim().to_lowercase();
    
    // Verify the caller matches the provided principal
    if caller_principal != request.user_principal.trim().to_lowercase() {
        return Err("Principal mismatch".to_string());
    }
    
    // Check if email already exists
    let email_exists = USER_EMAILS.with(|emails| {
        emails.borrow().contains_key(&request.email)
    });
    
    if email_exists {
        return Err("Email already registered".to_string());
    }
    
    // Check if principal already has an account
    let principal_exists = PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().contains_key(&request.user_principal)
    });
    
    if principal_exists {
        return Err("Wallet already has an account".to_string());
    }
    
    // Validate doctor license number - check if role is Doctor and license_number is provided
    if matches!(request.role, UserRole::Doctor) {
        if request.license_number.trim().is_empty() || request.license_number == "Not Needed" {
            return Err("License number is required for doctors".to_string());
        }
    }
    // For patients, ensure license_number is set to "Not Needed"
    let final_license_number = if matches!(request.role, UserRole::Patient) {
        "Not Needed".to_string()
    } else {
        request.license_number
    };
    
    let user = User {
        id: user_id.clone(),
        name: request.name,
        email: request.email.clone(),
        role: request.role,
        license_number: final_license_number,
        user_principal: request.user_principal.clone(),
        created_at: time(),
    };
    
    // Store user data
    USERS.with(|users| {
        users.borrow_mut().insert(user_id.clone(), user.clone());
    });
    
    // Store email mapping
    USER_EMAILS.with(|emails| {
        emails.borrow_mut().insert(request.email, user_id.clone());
    });
    
    // Store principal mappings
    PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow_mut().insert(request.user_principal.clone(), user_id.clone());
    });
    
    USER_PRINCIPALS.with(|mapping| {
        mapping.borrow_mut().insert(user_id.clone(), request.user_principal.clone());
    });
    
    ic_cdk::println!("Registered user {} with principal {} and user_id {}", user.name, request.user_principal, user_id);
    
    Ok(user)
}

// Add a simpler registration function as fallback
#[ic_cdk::update]
fn register_user_simple(name: String, email: String, role: UserRole, license_number: String) -> Result<User> {
    let user_id = generate_user_id();
    // Normalize the caller principal
    let caller_principal = ic_cdk::caller().to_string().trim().to_lowercase();
    
    ic_cdk::println!("Registration attempt - Principal: {}, Email: {}, Role: {:?}", 
                     caller_principal, email, role);
    
    // Check if email already exists
    let email_exists = USER_EMAILS.with(|emails| {
        emails.borrow().contains_key(&email)
    });
    
    if email_exists {
        ic_cdk::println!("Registration failed - Email already exists: {}", email);
        return Err("Email already registered".to_string());
    }
    
    // Check if principal already has an account
    let principal_exists = PRINCIPAL_TO_USER.with(|mapping| {
        let exists = mapping.borrow().contains_key(&caller_principal);
        if exists {
            if let Some(existing_user_id) = mapping.borrow().get(&caller_principal) {
                ic_cdk::println!("Principal {} already mapped to user_id: {}", 
                                caller_principal, existing_user_id);
                
                // Get user details for debugging
                USERS.with(|users| {
                    if let Some(existing_user) = users.borrow().get(existing_user_id) {
                        ic_cdk::println!("Existing user details - Name: {}, Email: {}, Role: {:?}", 
                                        existing_user.name, existing_user.email, existing_user.role);
                    }
                });
            }
        }
        exists
    });
    
    if principal_exists {
        ic_cdk::println!("Registration failed - Principal already has account: {}", caller_principal);
        return Err("Wallet already has an account".to_string());
    }
    
    // Validate doctor license number
    if matches!(role, UserRole::Doctor) {
        if license_number.trim().is_empty() || license_number == "Not Needed" {
            return Err("License number is required for doctors".to_string());
        }
    }
    // For patients, ensure license_number is set to "Not Needed"
    let final_license_number = if matches!(role, UserRole::Patient) {
        "Not Needed".to_string()
    } else {
        license_number
    };
    
    let user = User {
        id: user_id.clone(),
        name: name.clone(),
        email: email.clone(),
        role: role.clone(),
        license_number: final_license_number,
        user_principal: caller_principal.clone(),
        created_at: time(),
    };
    
    // Store user data
    USERS.with(|users| {
        users.borrow_mut().insert(user_id.clone(), user.clone());
    });
    
    // Store email mapping
    USER_EMAILS.with(|emails| {
        emails.borrow_mut().insert(email, user_id.clone());
    });
    
    // Store principal mappings
    PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow_mut().insert(caller_principal.clone(), user_id.clone());
    });
    
    USER_PRINCIPALS.with(|mapping| {
        mapping.borrow_mut().insert(user_id.clone(), caller_principal.clone());
    });
    
    ic_cdk::println!("Successfully registered user {} with principal {} and user_id {}", 
                     name, caller_principal, user_id);
    
    Ok(user)
}

#[ic_cdk::query]
fn get_user(user_id: String) -> Option<User> {
    USERS.with(|users| {
        users.borrow().get(&user_id).cloned()
    })
}

#[ic_cdk::query]
fn get_user_by_principal(user_principal: String) -> Result<User> {
    let normalized = user_principal.trim().to_lowercase();
    ic_cdk::println!("=== USER LOOKUP DEBUG START ===");
    ic_cdk::println!("Looking for user with principal: '{}'", normalized);
    ic_cdk::println!("Principal length: {}", normalized.len());
    
    // First check if principal exists in mapping
    let user_id = PRINCIPAL_TO_USER.with(|mapping| {
        let mappings = mapping.borrow();
        ic_cdk::println!("Total principal mappings in storage: {}", mappings.len());
        
        // Debug all mappings
        for (stored_principal, stored_user_id) in mappings.iter() {
            ic_cdk::println!("Mapping: '{}' -> '{}'", stored_principal, stored_user_id);
            if stored_principal == &normalized {
                ic_cdk::println!("*** EXACT MATCH FOUND! ***");
            }
        }
        
        mappings.get(&normalized).cloned()
    });
    
    match user_id {
        Some(id) => {
            ic_cdk::println!("SUCCESS: Found user_id '{}' for principal '{}'", id, normalized);
            USERS.with(|users| {
                let user = users.borrow().get(&id).cloned();
                match user {
                    Some(u) => {
                        ic_cdk::println!("SUCCESS: Retrieved user data - Name: '{}', Email: '{}', Role: {:?}", 
                                       u.name, u.email, u.role);
                        ic_cdk::println!("=== USER LOOKUP DEBUG END (SUCCESS) ===");
                        Ok(u)
                    },
                    None => {
                        ic_cdk::println!("ERROR: User ID '{}' exists in mapping but not in USERS storage!", id);
                        ic_cdk::println!("=== USER LOOKUP DEBUG END (ERROR) ===");
                        Err("User data corrupted".to_string())
                    }
                }
            })
        },
        None => {
            ic_cdk::println!("FAILURE: Principal '{}' not found in mapping", normalized);
            ic_cdk::println!("=== USER LOOKUP DEBUG END (NOT FOUND) ===");
            Err("User not found".to_string())
        }
    }
}

// Add a function to check if principal exists (for registration)
#[ic_cdk::query]
fn principal_has_account(user_principal: String) -> bool {
    PRINCIPAL_TO_USER.with(|mapping| {
        let exists = mapping.borrow().contains_key(&user_principal);
        ic_cdk::println!("Principal '{}' has account: {}", user_principal, exists);
        exists
    })
}

// Add a more robust user retrieval method
#[ic_cdk::query]
fn get_user_by_principal_detailed(user_principal: String) -> Result<User> {
    let normalized = user_principal.trim().to_lowercase();
    ic_cdk::println!("=== DETAILED USER LOOKUP START ===");
    ic_cdk::println!("Searching for principal: '{}'", normalized);
    
    // Step 1: Check direct principal mapping
    let user_id_from_mapping = PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().get(&normalized).cloned()
    });
    
    if let Some(user_id) = user_id_from_mapping {
        ic_cdk::println!("Found user_id from mapping: '{}'", user_id);
        
        // Step 2: Get user data
        let user = USERS.with(|users| {
            users.borrow().get(&user_id).cloned()
        });
        
        if let Some(u) = user {
            ic_cdk::println!("Successfully retrieved user: '{}'", u.name);
            ic_cdk::println!("=== DETAILED USER LOOKUP END (SUCCESS) ===");
            return Ok(u);
        } else {
            ic_cdk::println!("ERROR: User ID exists in mapping but user data not found!");
        }
    }
    
    // Step 3: Fallback - search through all users by user_principal field
    ic_cdk::println!("Fallback: Searching through all users...");
    let fallback_user = USERS.with(|users| {
        let users_map = users.borrow();
        for (user_id, user) in users_map.iter() {
            if user.user_principal == normalized {
                ic_cdk::println!("Found user through fallback search: '{}' (ID: '{}')", user.name, user_id);
                
                // Fix the mapping
                PRINCIPAL_TO_USER.with(|mapping| {
                    mapping.borrow_mut().insert(normalized.clone(), user_id.clone());
                });
                ic_cdk::println!("Fixed principal mapping for user: '{}'", user.name);
                
                return Some(user.clone());
            }
        }
        None
    });
    
    match fallback_user {
        Some(u) => {
            ic_cdk::println!("=== DETAILED USER LOOKUP END (FALLBACK SUCCESS) ===");
            Ok(u)
        },
        None => {
            ic_cdk::println!("=== DETAILED USER LOOKUP END (NOT FOUND) ===");
            Err("User not found".to_string())
        }
    }
}

// Add function to test if backend is working
#[ic_cdk::query]
fn test_backend_connection() -> String {
    ic_cdk::println!("Backend connection test called");
    "Backend is working!".to_string()
}

// Add a debug function to check all mappings
#[ic_cdk::query]
fn debug_all_users() -> Vec<(String, String, String)> {
    let mut result = Vec::new();
    
    USERS.with(|users| {
        let users_map = users.borrow();
        for (user_id, user) in users_map.iter() {
            let principal = USER_PRINCIPALS.with(|principals| {
                principals.borrow().get(user_id).cloned().unwrap_or_default()
            });
            result.push((user_id.clone(), user.name.clone(), principal));
        }
    });
    
    result
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
                        let caller_principal = ic_cdk::caller().to_string().trim().to_lowercase();
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
    
    // Verify user is a doctor
    let is_doctor = USERS.with(|users| {
        if let Some(user) = users.borrow().get(&doctor_id) {
            matches!(user.role, UserRole::Doctor)
        } else {
            false
        }
    });
    
    if !is_doctor {
        return Err("Only doctors can add medicines".to_string());
    }
    
    let medicine_id = generate_id();
    
    let medicine = Medicine {
        id: medicine_id.clone(),
        name: request.name,
        dosage: request.dosage,
        frequency: request.frequency,
        duration: request.duration,
        side_effects: request.side_effects,
        guide_text: request.guide_text, // Direct assignment since it's required
        guide_source: request.guide_source, // Direct assignment since it's required
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
    
    // Validate that all medicine IDs exist and belong to the doctor
    for medicine_ref in &request.medicines {
        let medicine_exists = MEDICINES.with(|medicines| {
            if let Some(medicine) = medicines.borrow().get(&medicine_ref.medicine_id) {
                medicine.created_by == doctor_id && medicine.is_active
            } else {
                false
            }
        });
        
        if !medicine_exists {
            return Err(format!("Medicine with ID {} not found or not accessible", medicine_ref.medicine_id));
        }
    }
    
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
    
    // Debug: print the created prescription
    ic_cdk::println!("Created prescription: {:?}", prescription);
    
    PRESCRIPTIONS.with(|prescriptions| {
        prescriptions.borrow_mut().insert(prescription_id.clone(), prescription);
    });
    
    Ok(format!("{}-{}", prescription_id, prescription_code))
}

#[ic_cdk::query]
fn get_prescription(prescription_id: String, code: String) -> Result<Prescription> {
    ic_cdk::println!("Getting prescription with ID: {} and code: {}", prescription_id, code);
    
    let caller_principal = ic_cdk::caller().to_string();
    ic_cdk::println!("Caller principal: {}", caller_principal);
    
    PRESCRIPTIONS.with(|prescriptions| {
        let mut prescriptions_map = prescriptions.borrow_mut();
        
        // Debug: print all prescriptions
        ic_cdk::println!("Total prescriptions in storage: {}", prescriptions_map.len());
        for (id, prescription) in prescriptions_map.iter() {
            ic_cdk::println!("Prescription ID: {}, Code: {}, Patient: {}, Medicines: {}", 
                id, prescription.prescription_code, prescription.patient_name, prescription.medicines.len());
            
            // Debug: print medicine IDs in this prescription
            for (i, med) in prescription.medicines.iter().enumerate() {
                ic_cdk::println!("  Medicine {}: ID={}, Custom Dosage={:?}, Instructions={}", 
                    i, med.medicine_id, med.custom_dosage, med.custom_instructions);
            }
        }
        
        if let Some(prescription) = prescriptions_map.get_mut(&prescription_id) {
            ic_cdk::println!("Found prescription, checking code: {} vs {}", prescription.prescription_code, code);
            if prescription.prescription_code == code {
                // Security: Only allow access once per prescription to prevent sharing
                // You could also implement more sophisticated patient verification here
                ic_cdk::println!("Prescription code verified for caller: {}", caller_principal);
                
                // Only mark as accessed when retrieved by patient, not when created
                if prescription.accessed_at.is_none() {
                    prescription.accessed_at = Some(time());
                    ic_cdk::println!("Prescription marked as accessed for the first time at: {}", time());
                } else {
                    ic_cdk::println!("Prescription was already accessed before at: {:?}", prescription.accessed_at);
                }
                
                // Validate that referenced medicines exist and log their details
                for (i, med) in prescription.medicines.iter().enumerate() {
                    let medicine_exists = MEDICINES.with(|medicines| {
                        medicines.borrow().contains_key(&med.medicine_id)
                    });
                    ic_cdk::println!("Medicine {} (ID: {}) exists: {}", i, med.medicine_id, medicine_exists);
                    
                    if medicine_exists {
                        let medicine_details = MEDICINES.with(|medicines| {
                            medicines.borrow().get(&med.medicine_id).cloned()
                        });
                        if let Some(details) = medicine_details {
                            ic_cdk::println!("Medicine {} details: name={}, active={}, guide_text_length={}", 
                                i, details.name, details.is_active, details.guide_text.len());
                        }
                    }
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

// Add a comprehensive debug method for prescriptions with medicine details
#[ic_cdk::query]
fn debug_get_prescription_with_medicines(prescription_id: String) -> Result<String> {
    PRESCRIPTIONS.with(|prescriptions| {
        if let Some(prescription) = prescriptions.borrow().get(&prescription_id) {
            let mut debug_info = format!("Prescription ID: {}\n", prescription.id);
            debug_info.push_str(&format!("Patient: {}\n", prescription.patient_name));
            debug_info.push_str(&format!("Medicines count: {}\n\n", prescription.medicines.len()));
            
            for (i, med) in prescription.medicines.iter().enumerate() {
                debug_info.push_str(&format!("Medicine {}: ID={}\n", i, med.medicine_id));
                
                let medicine_details = MEDICINES.with(|medicines| {
                    medicines.borrow().get(&med.medicine_id).cloned()
                });
                
                if let Some(details) = medicine_details {
                    debug_info.push_str(&format!("  Name: {}\n", details.name));
                    debug_info.push_str(&format!("  Dosage: {}\n", details.dosage));
                    debug_info.push_str(&format!("  Active: {}\n", details.is_active));
                    debug_info.push_str(&format!("  Created by: {}\n", details.created_by));
                } else {
                    debug_info.push_str("  ERROR: Medicine not found!\n");
                }
                debug_info.push_str("\n");
            }
            
            Ok(debug_info)
        } else {
            Err("Prescription not found".to_string())
        }
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

// Add lightweight list for frontend-side principal lookup: (principal, user_id, email)
#[ic_cdk::query]
fn list_user_principals() -> Vec<(String, String, String)> {
    USERS.with(|users| {
        users.borrow()
            .values()
            .map(|u| (u.user_principal.clone(), u.id.clone(), u.email.clone()))
            .collect()
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

// AI Chat structures
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String, // "user" or "assistant"
    pub content: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct GeneralChatContext {
    pub user_type: String, // "doctor" or "patient"
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PrescriptionChatContext {
    pub user_type: String, // "doctor" or "patient"
    pub prescription_data: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct MedicineChatContext {
    pub user_type: String, // "doctor" or "patient"
    pub medicine_data: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ChatContext {
    pub user_type: String, // "doctor" or "patient"
    pub chat_mode: Option<String>, // "general", "prescription", or "medicine"
    pub prescription_data: Option<String>,
    pub medicine_data: Option<String>,
}


// AI Assistant Functions
#[ic_cdk::update]
async fn chat_with_ai(messages: Vec<ChatMessage>, context: ChatContext) -> Result<String> {
    let caller_principal = ic_cdk::caller().to_string();
    
    // Debug logging
    ic_cdk::println!("Chat request from principal: {}", caller_principal);
    ic_cdk::println!("Context: {:?}", context);
    ic_cdk::println!("Messages count: {}", messages.len());
    
    // Get the user ID associated with this principal
    let user_id = PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().get(&caller_principal).cloned()
    });
    
    let _user_id = match user_id {
        Some(id) => {
            ic_cdk::println!("Found user ID: {}", id);
            id
        },
        None => {
            ic_cdk::println!("No user ID found for principal: {}", caller_principal);
            return Err("User not found. Please register first.".to_string());
        }
    };
    
    // Create system prompt based on context
    let system_prompt = create_system_prompt(&context);
    ic_cdk::println!("Generated system prompt length: {}", system_prompt.len());
    
    // Prepare messages for AI
    let mut ai_messages = vec![ChatMessage {
        role: "system".to_string(),
        content: system_prompt,
    }];
    ai_messages.extend(messages);
    
    ic_cdk::println!("Total AI messages: {}", ai_messages.len());
    
    // Convert to ic_llm format
    let ic_messages: Vec<ic_llm::ChatMessage> = ai_messages.iter().map(|msg| {
        match msg.role.as_str() {
            "user" => ic_llm::ChatMessage::User { 
                content: msg.content.clone() 
            },
            "assistant" => ic_llm::ChatMessage::Assistant(
                ic_llm::AssistantMessage {
                    content: Some(msg.content.clone()),
                    tool_calls: vec![],
                }
            ),
            "system" => ic_llm::ChatMessage::System { 
                content: msg.content.clone() 
            },
            _ => ic_llm::ChatMessage::User { 
                content: msg.content.clone() 
            },
        }
    }).collect();
    
    ic_cdk::println!("Converted messages for ic_llm: {}", ic_messages.len());
    
    // Get AI response - ic_llm returns Response directly, not Result
    let response = ic_llm::chat(ic_llm::Model::Llama3_1_8B)
        .with_messages(ic_messages)
        .send()
        .await;
    
    let content = response.message.content.unwrap_or("I apologize, but I couldn't generate a response. Please try again.".to_string());
    ic_cdk::println!("AI response received, length: {}", content.len());
    Ok(content)
}

#[ic_cdk::update]
async fn get_prescription_ai_help(prescription_id: String, code: String, question: String) -> Result<String> {
    // Get prescription data
    let prescription = PRESCRIPTIONS.with(|prescriptions| {
        prescriptions.borrow().get(&prescription_id).cloned()
    });
    
    let prescription = match prescription {
        Some(p) if p.prescription_code == code => p,
        _ => return Err("Invalid prescription or code".to_string()),
    };
    
    // Get medicine details
    let mut medicine_info = String::new();
    for med in &prescription.medicines {
        if let Some(medicine) = MEDICINES.with(|medicines| {
            medicines.borrow().get(&med.medicine_id).cloned()
        }) {
            medicine_info.push_str(&format!(
                "\n- Medicine: {}\n  Dosage: {}\n  Frequency: {}\n  Duration: {}\n  Instructions: {}\n  Side Effects: {}\n  Guide: {}\n",
                medicine.name,
                med.custom_dosage.as_ref().unwrap_or(&medicine.dosage),
                medicine.frequency,
                medicine.duration,
                med.custom_instructions,
                medicine.side_effects,
                medicine.guide_text
            ));
        }
    }
    
    let context = ChatContext {
        user_type: "patient".to_string(),
        chat_mode: Some("prescription".to_string()),
        prescription_data: Some(format!(
            "Patient: {}\nDoctor Notes: {}\nMedicines:{}",
            prescription.patient_name,
            prescription.additional_notes,
            medicine_info
        )),
        medicine_data: None,
    };
    
    let messages = vec![ChatMessage {
        role: "user".to_string(),
        content: question,
    }];
    
    chat_with_ai(messages, context).await
}

#[ic_cdk::update]
async fn get_medicine_ai_help(medicine_query: String) -> Result<String> {
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
    
    // Get doctor's medicines for context
    let medicines = MEDICINES.with(|medicines| {
        let all_medicines: Vec<Medicine> = medicines.borrow().values().cloned().collect();
        all_medicines
            .into_iter()
            .filter(|medicine| medicine.created_by == doctor_id && medicine.is_active)
            .collect::<Vec<Medicine>>()
    });
    
    let medicine_info = medicines.iter()
        .map(|m| format!("{}: {} - {}", m.name, m.dosage, m.side_effects))
        .collect::<Vec<String>>()
        .join("\n");
    
    let context = ChatContext {
        user_type: "doctor".to_string(),
        chat_mode: Some("general".to_string()),
        prescription_data: None,
        medicine_data: Some(medicine_info),
    };
    
    let messages = vec![ChatMessage {
        role: "user".to_string(),
        content: medicine_query,
    }];
    
    chat_with_ai(messages, context).await
}

fn create_system_prompt(context: &ChatContext) -> String {
    let chat_mode = context.chat_mode.as_deref().unwrap_or("general");
    
    match (context.user_type.as_str(), chat_mode) {
        ("doctor", "prescription") => {
            let medicine_context = context.medicine_data.as_ref()
                .map(|data| format!("\n\nDoctor's Medicine Repository (with detailed guides):\n{}", data))
                .unwrap_or_default();
            
            format!(
                "You are MedSeal Health Partner in PRESCRIPTION MODE, an AI medical assistant with access to the doctor's medicine repository and detailed medicine guides. \
                 You can provide specific information about medicines in their database, including dosages, interactions, side effects, and guidance from medicine guides. \
                 Use the detailed medicine information and guides to provide comprehensive, evidence-based answers. \
                 Always remind users that your advice should complement, not replace, professional medical judgment. \
                 Be detailed and reference specific medicine information when available. \
                 Start responses with 'As your MedSeal Health Partner (Prescription Mode),' when appropriate.{}",
                medicine_context
            )
        },
        ("doctor", "medicine") => {
            let medicine_context = context.medicine_data.as_ref()
                .map(|data| format!("\n\nDoctor's Medicine Repository:\n{}", data))
                .unwrap_or_default();
            
            format!(
                "You are MedSeal Health Partner in MEDICINE MODE, an AI medical assistant with access to the doctor's medicine repository. \
                 You can provide detailed information about medicines in their database, including dosages, interactions, and side effects. \
                 Use the medicine information to provide accurate, evidence-based answers about specific medications. \
                 Always remind users that your advice should complement, not replace, professional medical judgment. \
                 Be precise and reference specific medicine information when available. \
                 Start responses with 'As your MedSeal Health Partner (Medicine Mode),' when appropriate.{}",
                medicine_context
            )
        },
        ("doctor", "general") => {
            "You are MedSeal Health Partner in GENERAL MODE, an AI medical assistant providing general medical knowledge and guidance. \
             You provide broad medical knowledge, drug interaction information, clinical best practices, and general medication guidance. \
             You do NOT have access to the doctor's specific medicine repository in this mode. \
             Always remind users that your advice should complement, not replace, professional medical judgment. \
             Be professional and focus on general medical principles. \
             Start responses with 'As your MedSeal Health Partner (General Mode),' when appropriate.".to_string()
        },
        ("patient", "prescription") => {
            let prescription_context = context.prescription_data.as_ref()
                .map(|data| format!("\n\nPatient's Current Prescription (with medicine guides):\n{}", data))
                .unwrap_or_default();
            
            format!(
                "You are MedSeal Health Partner in PRESCRIPTION MODE, an AI assistant with access to the patient's specific prescription data and detailed medicine guides. \
                 You can provide detailed, personalized information about their prescribed medications, including specific dosages, timing, side effects, and guidance from medicine guides. \
                 Use the prescription data and medicine guides to give accurate, personalized advice about their specific medications. \
                 Always emphasize the importance of following doctor's instructions and consulting healthcare providers for concerns. \
                 Be supportive, empathetic, and reference their specific medications when answering questions. \
                 Never provide medical diagnosis or change medication instructions. \
                 Start responses with 'As your MedSeal Health Partner (Prescription Mode),' when appropriate.{}",
                prescription_context
            )
        },
        ("patient", "general") => {
            "You are MedSeal Health Partner in GENERAL MODE, an AI assistant providing general health information and guidance. \
             You provide general health advice, medication safety tips, and basic health information. \
             You do NOT have access to the patient's specific prescription data in this mode. \
             Always emphasize the importance of consulting healthcare professionals for specific medical concerns. \
             Be supportive, empathetic, and use simple language for general health guidance. \
             Never provide medical diagnosis or specific medication advice without prescription data. \
             Start responses with 'As your MedSeal Health Partner (General Mode),' when appropriate.".to_string()
        },
        _ => {
            "You are MedSeal Health Partner, a helpful medical information assistant. \
             Provide accurate, general health information while emphasizing the importance of consulting healthcare professionals. \
             Start responses with 'As your MedSeal Health Partner,' when appropriate.".to_string()
        }
    }
}


// AI Assistant Functions - Specific Context Implementations
#[ic_cdk::update]
async fn chat_general(messages: Vec<ChatMessage>, context: GeneralChatContext) -> Result<String> {
    let chat_context = ChatContext {
        user_type: context.user_type,
        chat_mode: Some("general".to_string()),
        prescription_data: None,
        medicine_data: None,
    };
    
    process_chat(messages, chat_context).await
}

#[ic_cdk::update]
async fn chat_prescription(messages: Vec<ChatMessage>, context: PrescriptionChatContext) -> Result<String> {
    let chat_context = ChatContext {
        user_type: context.user_type,
        chat_mode: Some("prescription".to_string()),
        prescription_data: Some(context.prescription_data),
        medicine_data: None,
    };
    
    process_chat(messages, chat_context).await
}

#[ic_cdk::update]
async fn chat_medicine(messages: Vec<ChatMessage>, context: MedicineChatContext) -> Result<String> {
    let chat_context = ChatContext {
        user_type: context.user_type,
        chat_mode: Some("medicine".to_string()),
        prescription_data: None,
        medicine_data: Some(context.medicine_data),
    };
    
    process_chat(messages, chat_context).await
}

// Common chat processing function
async fn process_chat(messages: Vec<ChatMessage>, context: ChatContext) -> Result<String> {
    let caller_principal = ic_cdk::caller().to_string();
    
    // Debug logging
    ic_cdk::println!("Chat request from principal: {}", caller_principal);
    ic_cdk::println!("Context: {:?}", context);
    ic_cdk::println!("Messages count: {}", messages.len());
    
    // Get the user ID associated with this principal
    let user_id = PRINCIPAL_TO_USER.with(|mapping| {
        mapping.borrow().get(&caller_principal).cloned()
    });
    
    let _user_id = match user_id {
        Some(id) => {
            ic_cdk::println!("Found user ID: {}", id);
            id
        },
        None => {
            ic_cdk::println!("No user ID found for principal: {}", caller_principal);
            return Err("User not found. Please register first.".to_string());
        }
    };
    
    // Create system prompt based on context
    let system_prompt = create_system_prompt(&context);
    ic_cdk::println!("Generated system prompt length: {}", system_prompt.len());
    
    // Prepare messages for AI
    let mut ai_messages = vec![ChatMessage {
        role: "system".to_string(),
        content: system_prompt,
    }];
    ai_messages.extend(messages);
    
    ic_cdk::println!("Total AI messages: {}", ai_messages.len());
    
    // Convert to ic_llm format
    let ic_messages: Vec<ic_llm::ChatMessage> = ai_messages.iter().map(|msg| {
        match msg.role.as_str() {
            "user" => ic_llm::ChatMessage::User { 
                content: msg.content.clone() 
            },
            "assistant" => ic_llm::ChatMessage::Assistant(
                ic_llm::AssistantMessage {
                    content: Some(msg.content.clone()),
                    tool_calls: vec![],
                }
            ),
            "system" => ic_llm::ChatMessage::System { 
                content: msg.content.clone() 
            },
            _ => ic_llm::ChatMessage::User { 
                content: msg.content.clone() 
            },
        }
    }).collect();
    
    ic_cdk::println!("Converted messages for ic_llm: {}", ic_messages.len());
    
    // Get AI response - ic_llm returns Response directly, not Result
    let response = ic_llm::chat(ic_llm::Model::Llama3_1_8B)
        .with_messages(ic_messages)
        .send()
        .await;
    
    let content = response.message.content.unwrap_or("I apologize, but I couldn't generate a response. Please try again.".to_string());
    ic_cdk::println!("AI response received, length: {}", content.len());
    Ok(content)
}