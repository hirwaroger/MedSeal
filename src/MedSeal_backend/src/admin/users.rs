use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use candid::{CandidType, Deserialize};

// Helper function to verify admin role
fn verify_admin() -> Result<User> {
    let caller_principal = caller().to_string();
    
    match storage::get_user_by_principal(&caller_principal) {
        Some(user) => {
            match user.role {
                UserRole::Admin => Ok(user),
                _ => Err("Admin access required".to_string()),
            }
        },
        None => Err("User not found".to_string()),
    }
}

#[ic_cdk::query]
pub fn get_all_doctors() -> Result<Vec<User>> {
    verify_admin()?;
    Ok(storage::get_all_doctors())
}

#[ic_cdk::query]
pub fn get_all_patients() -> Result<Vec<User>> {
    verify_admin()?;
    Ok(storage::get_all_patients())
}

#[ic_cdk::query]
pub fn get_user_stats(user_id: String) -> Result<UserStats> {
    verify_admin()?;
    
    let user = storage::get_user(&user_id)
        .ok_or("User not found".to_string())?;
    
    let prescription_count = storage::get_doctor_prescriptions(&user_id).len() as u64;
    let medicine_count = storage::get_doctor_medicines(&user_id).len() as u64;
    
    Ok(UserStats {
        user_id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status,
        last_active: user.last_active,
        total_prescriptions: prescription_count,
        total_medicines: medicine_count,
        created_at: user.created_at,
    })
}

#[ic_cdk::query]
pub fn get_system_overview() -> Result<SystemOverview> {
    verify_admin()?;
    
    let all_doctors = storage::get_all_doctors();
    let all_patients = storage::get_all_patients();
    let pending_verifications = storage::get_pending_verification_requests();
    
    let verified_doctors = all_doctors.iter()
        .filter(|d| matches!(d.verification_status, VerificationStatus::Approved))
        .count() as u64;
    
    let unverified_doctors = all_doctors.iter()
        .filter(|d| matches!(d.verification_status, VerificationStatus::Pending))
        .count() as u64;
    
    let total_prescriptions = storage::get_all_medicines().len() as u64; // Simplified
    let total_medicines = storage::get_all_medicines().len() as u64;
    
    Ok(SystemOverview {
        total_doctors: all_doctors.len() as u64,
        total_patients: all_patients.len() as u64,
        verified_doctors,
        unverified_doctors,
        pending_verifications: pending_verifications.len() as u64,
        total_prescriptions,
        total_medicines,
    })
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct UserStats {
    pub user_id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    pub verification_status: VerificationStatus,
    pub last_active: Option<u64>,
    pub total_prescriptions: u64,
    pub total_medicines: u64,
    pub created_at: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SystemOverview {
    pub total_doctors: u64,
    pub total_patients: u64,
    pub verified_doctors: u64,
    pub unverified_doctors: u64,
    pub pending_verifications: u64,
    pub total_prescriptions: u64,
    pub total_medicines: u64,
}