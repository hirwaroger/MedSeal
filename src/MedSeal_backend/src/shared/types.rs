use candid::{CandidType, Deserialize};

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
pub enum UserRole {
    Doctor,
    Patient,
    Admin,
    NGO,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq)]
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

#[derive(Clone, Debug, CandidType, Deserialize)]
pub enum CaseStatus {
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Funded,
    Closed,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub enum CaseUrgency {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PatientCase {
    pub id: String,
    pub patient_id: String,
    pub patient_name: String,
    pub patient_contact: String,
    pub case_title: String,
    pub case_description: String,
    pub medical_condition: String,
    pub required_amount: u64,
    pub supporting_documents: Vec<String>,
    pub urgency_level: CaseUrgency,
    pub status: CaseStatus,
    pub created_at: u64,
    pub reviewed_at: Option<u64>,
    pub reviewed_by: Option<String>,
    pub admin_notes: Option<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ContributionPool {
    pub id: String,
    pub case_id: String,
    pub ngo_id: String,
    pub ngo_name: String,
    pub target_amount: u64,
    pub current_amount: u64,
    pub contributors_count: u64,
    pub pool_title: String,
    pub pool_description: String,
    pub created_at: u64,
    pub deadline: Option<u64>,
    pub is_active: bool,
    pub is_completed: bool,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Contribution {
    pub id: String,
    pub pool_id: String,
    pub contributor_principal: String,
    pub amount: u64,
    pub message: Option<String>,
    pub contributed_at: u64,
    pub is_anonymous: bool,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SubmitCaseRequest {
    pub case_title: String,
    pub case_description: String,
    pub medical_condition: String,
    pub required_amount: u64,
    pub supporting_documents: Vec<String>,
    pub urgency_level: CaseUrgency,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct CreatePoolRequest {
    pub case_id: String,
    pub target_amount: u64,
    pub pool_title: String,
    pub pool_description: String,
    pub deadline_days: Option<u64>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ContributeRequest {
    pub pool_id: String,
    pub amount: u64,
    pub message: Option<String>,
    pub is_anonymous: bool,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ProcessCaseRequest {
    pub case_id: String,
    pub status: CaseStatus,
    pub admin_notes: Option<String>,
}