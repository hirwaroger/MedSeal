use candid::{CandidType, Deserialize};

#[derive(Clone, Debug, CandidType, Deserialize)]
pub enum UserRole {
    Doctor,
    Patient,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub license_number: String,
    pub user_principal: String,
    pub created_at: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Medicine {
    pub id: String,
    pub name: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: String,
    pub side_effects: String,
    pub guide_text: String,
    pub guide_source: String,
    pub created_by: String,
    pub created_at: u64,
    pub is_active: bool,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PrescriptionMedicine {
    pub medicine_id: String,
    pub custom_dosage: Option<String>,
    pub custom_instructions: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
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
    pub patient_principal: Option<String>,
}

// Request structures
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct RegisterUserRequest {
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub license_number: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct RegisterUserWithPrincipalRequest {
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub license_number: String,
    pub user_principal: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct CreateMedicineRequest {
    pub name: String,
    pub dosage: String,
    pub frequency: String,
    pub duration: String,
    pub side_effects: String,
    pub guide_text: String,
    pub guide_source: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct CreatePrescriptionRequest {
    pub patient_name: String,
    pub patient_contact: String,
    pub medicines: Vec<PrescriptionMedicine>,
    pub additional_notes: String,
}

// Result types
pub type Result<T> = std::result::Result<T, String>;

// Chat-related types
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct GeneralChatContext {
    pub user_type: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PrescriptionChatContext {
    pub user_type: String,
    pub prescription_data: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct MedicineChatContext {
    pub user_type: String,
    pub medicine_data: String,
}