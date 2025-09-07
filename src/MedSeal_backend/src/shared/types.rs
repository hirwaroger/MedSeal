use candid::{CandidType, Deserialize};

#[derive(Clone, Debug, CandidType, Deserialize)]
pub enum UserRole {
    Doctor,
    Patient,
    Admin,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub enum VerificationStatus {
    Pending,
    Approved,
    Rejected,
    NotRequired,
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
    pub verification_status: VerificationStatus,
    pub verification_request: Option<VerificationRequest>,
    pub last_active: Option<u64>,
    pub total_prescriptions: u64,
    pub total_medicines: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct VerificationRequest {
    pub id: String,
    pub doctor_id: String,
    pub institution_name: String,
    pub institution_website: String,
    pub license_authority: String,
    pub license_authority_website: String,
    pub medical_license_number: String,
    pub additional_documents: Vec<String>,
    pub submitted_at: u64,
    pub processed_at: Option<u64>,
    pub processed_by: Option<String>,
    pub admin_notes: Option<String>,
    pub status: VerificationStatus,
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
    pub description: String,
    pub created_at: u64,
    pub created_by: String,
    pub doctor_id: String,
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
    pub patient_name: String,
    pub patient_contact: String,
    pub patient_principal: Option<String>,
    pub medicines: Vec<PrescriptionMedicine>,
    pub additional_notes: String,
    pub created_at: u64,
    pub accessed_at: Option<u64>,
    pub doctor_id: String,
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

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SubmitVerificationRequest {
    pub institution_name: String,
    pub institution_website: String,
    pub license_authority: String,
    pub license_authority_website: String,
    pub medical_license_number: String,
    pub additional_documents: Vec<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ProcessVerificationRequest {
    pub verification_id: String,
    pub status: VerificationStatus,
    pub admin_notes: Vec<String>,
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

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct VerificationStatusInfo {
    pub doctor_id: String,
    pub doctor_name: String,
    pub verification_status: VerificationStatus,
    pub verification_request: Option<VerificationRequest>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PrincipalEntry {
    pub principal_ent: String,
    pub user_id: String,
    pub email: String,
}