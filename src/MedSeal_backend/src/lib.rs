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
    pub license_number: Option<String>,
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
    pub guide_ipfs_hash: Option<String>,
    pub created_by: String,
    pub created_at: u64,
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
    pub license_number: Option<String>,
}

#[derive(CandidType, Deserialize)]
pub struct CreateMedicineRequest {
    pub name: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: String,
    pub side_effects: String,
    pub guide_ipfs_hash: Option<String>,
}

#[derive(CandidType, Deserialize)]
pub struct CreatePrescriptionRequest {
    pub patient_name: String,
    pub patient_contact: String,
    pub medicines: Vec<PrescriptionMedicine>,
    pub additional_notes: String,
}

type Result<T> = std::result::Result<T, String>;

thread_local! {
    static USERS: RefCell<HashMap<String, User>> = RefCell::new(HashMap::new());
    static MEDICINES: RefCell<HashMap<String, Medicine>> = RefCell::new(HashMap::new());
    static PRESCRIPTIONS: RefCell<HashMap<String, Prescription>> = RefCell::new(HashMap::new());
    static USER_EMAILS: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new()); // email -> user_id
}

#[ic_cdk::update]
fn register_user(request: RegisterUserRequest) -> Result<User> {
    let user_id = generate_user_id();
    
    // Check if email already exists
    let email_exists = USER_EMAILS.with(|emails| {
        emails.borrow().contains_key(&request.email)
    });
    
    if email_exists {
        return Err("Email already registered".to_string());
    }
    
    // Validate doctor license number
    if matches!(request.role, UserRole::Doctor) && request.license_number.is_none() {
        return Err("License number required for doctors".to_string());
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
        emails.borrow_mut().insert(request.email, user_id);
    });
    
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
    // In a real implementation, you'd hash and verify the password
    let user_id = USER_EMAILS.with(|emails| {
        emails.borrow().get(&email).cloned()
    });
    
    match user_id {
        Some(id) => {
            USERS.with(|users| {
                users.borrow().get(&id).cloned()
                    .ok_or_else(|| "User not found".to_string())
            })
        },
        None => Err("Invalid credentials".to_string())
    }
}

#[ic_cdk::update]
fn add_medicine(request: CreateMedicineRequest) -> Result<Medicine> {
    let caller = ic_cdk::caller().to_string();
    let medicine_id = generate_id();
    
    let medicine = Medicine {
        id: medicine_id.clone(),
        name: request.name,
        dosage: request.dosage,
        frequency: request.frequency,
        duration: request.duration,
        side_effects: request.side_effects,
        guide_ipfs_hash: request.guide_ipfs_hash,
        created_by: caller,
        created_at: time(),
    };
    
    MEDICINES.with(|medicines| {
        medicines.borrow_mut().insert(medicine_id, medicine.clone());
    });
    
    Ok(medicine)
}

#[ic_cdk::query]
fn get_doctor_medicines(doctor_id: String) -> Vec<Medicine> {
    MEDICINES.with(|medicines| {
        medicines.borrow().values()
            .filter(|medicine| medicine.created_by == doctor_id)
            .cloned()
            .collect()
    })
}

#[ic_cdk::query]
fn get_medicine(medicine_id: String) -> Option<Medicine> {
    MEDICINES.with(|medicines| {
        medicines.borrow().get(&medicine_id).cloned()
    })
}

#[ic_cdk::update]
fn update_medicine(medicine_id: String, request: CreateMedicineRequest) -> Result<Medicine> {
    let caller = ic_cdk::caller().to_string();
    
    MEDICINES.with(|medicines| {
        let mut medicines_map = medicines.borrow_mut();
        if let Some(medicine) = medicines_map.get_mut(&medicine_id) {
            if medicine.created_by != caller {
                return Err("Unauthorized to update this medicine".to_string());
            }
            
            medicine.name = request.name;
            medicine.dosage = request.dosage;
            medicine.frequency = request.frequency;
            medicine.duration = request.duration;
            medicine.side_effects = request.side_effects;
            medicine.guide_ipfs_hash = request.guide_ipfs_hash;
            
            Ok(medicine.clone())
        } else {
            Err("Medicine not found".to_string())
        }
    })
}

#[ic_cdk::update]
fn create_prescription(request: CreatePrescriptionRequest) -> Result<String> {
    let doctor_id = ic_cdk::caller().to_string();
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
    PRESCRIPTIONS.with(|prescriptions| {
        let mut prescriptions_map = prescriptions.borrow_mut();
        if let Some(prescription) = prescriptions_map.get_mut(&prescription_id) {
            if prescription.prescription_code == code {
                prescription.accessed_at = Some(time());
                Ok(prescription.clone())
            } else {
                Err("Invalid prescription code".to_string())
            }
        } else {
            Err("Prescription not found".to_string())
        }
    })
}

#[ic_cdk::query]
fn get_doctor_prescriptions(doctor_id: String) -> Vec<Prescription> {
    PRESCRIPTIONS.with(|prescriptions| {
        prescriptions.borrow().values()
            .filter(|prescription| prescription.doctor_id == doctor_id)
            .cloned()
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
    format!("{:06}", (time() % 1000000))
}

fn generate_prescription_code() -> String {
    format!("{:06}", ((time() * 7) % 1000000))
}

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
