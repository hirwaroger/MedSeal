use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;

#[ic_cdk::update]
pub fn register_user(request: RegisterUserRequest) -> Result<User> {
    let caller_principal = caller().to_string();

    if storage::principal_has_account(&caller_principal) {
        return Err("Principal already has an account".to_string());
    }

    // Basic email validation
    if !utils::validate_email(&request.email) {
        return Err("Invalid email address".to_string());
    }

    // Check if this is first admin creation
    let verification_status = match request.role {
        UserRole::Admin => {
            if storage::admin_exists() {
                return Err("Admin already exists".to_string());
            }
            storage::set_admin_exists(true);
            VerificationStatus::Approved
        },
        UserRole::Doctor => VerificationStatus::Pending,
        UserRole::Patient => VerificationStatus::NotRequired,
    };

    let user = User {
        id: utils::generate_user_id(),
        name: request.name,
        email: request.email,
        role: request.role,
        license_number: request.license_number,
        user_principal: caller_principal.clone(),
        created_at: utils::get_current_timestamp(),
        verification_status,
        verification_request: None,
        last_active: Some(utils::get_current_timestamp()),
        total_prescriptions: 0,
        total_medicines: 0,
    };

    storage::store_user(user.clone());
    Ok(user)
}

#[ic_cdk::update]
pub fn register_user_with_principal(request: RegisterUserWithPrincipalRequest) -> Result<User> {
    if storage::principal_has_account(&request.user_principal) {
        return Err("Principal already has an account".to_string());
    }

    if !utils::validate_email(&request.email) {
        return Err("Invalid email address".to_string());
    }

    // Check if this is first admin creation
    let verification_status = match request.role {
        UserRole::Admin => {
            if storage::admin_exists() {
                return Err("Admin already exists".to_string());
            }
            storage::set_admin_exists(true);
            VerificationStatus::Approved
        },
        UserRole::Doctor => VerificationStatus::Pending,
        UserRole::Patient => VerificationStatus::NotRequired,
    };

    let user = User {
        id: utils::generate_user_id(),
        name: request.name,
        email: request.email,
        role: request.role,
        license_number: request.license_number,
        user_principal: request.user_principal.clone(),
        created_at: utils::get_current_timestamp(),
        verification_status,
        verification_request: None,
        last_active: Some(utils::get_current_timestamp()),
        total_prescriptions: 0,
        total_medicines: 0,
    };

    storage::store_user(user.clone());
    Ok(user)
}

#[ic_cdk::update]
pub fn register_user_simple(name: String, email: String, role: UserRole, license_number: String) -> Result<User> {
    let request = RegisterUserRequest { name, email, role, license_number };
    register_user(request)
}

#[ic_cdk::query]
pub fn get_user(user_id: String) -> Option<User> {
    storage::get_user(&user_id)
}

#[ic_cdk::query]
pub fn get_user_by_principal(principal: String) -> Result<User> {
    match storage::get_user_by_principal(&principal) {
        Some(user) => Ok(user),
        None => Err("User not found for this principal".to_string()),
    }
}

#[ic_cdk::query]
pub fn get_user_by_principal_detailed(principal: String) -> Result<User> {
    match storage::get_user_by_principal(&principal) {
        Some(user) => Ok(user),
        None => Err(format!("No user found for principal: {}", principal)),
    }
}

#[ic_cdk::query]
pub fn principal_has_account(principal: String) -> bool {
    storage::principal_has_account(&principal)
}

#[ic_cdk::query]
pub fn list_user_principals() -> Vec<PrincipalEntry> {
    storage::list_user_principals()
}

#[ic_cdk::query]
pub fn authenticate_user(email: String, license_number: String) -> Result<User> {
    let users = storage::list_user_principals();

    for entry in users.iter() {
        let user_id = &entry.user_id;
        let user_email = &entry.email;

        if user_email == &email {
            if let Some(user) = storage::get_user(user_id) {
                if user.license_number == license_number {
                    return Ok(user);
                }
            }
        }
    }

    Err("Invalid credentials".to_string())
}

// Debug functions
#[ic_cdk::query]
pub fn get_current_caller() -> String {
    caller().to_string()
}

#[ic_cdk::query]
pub fn get_principal_mapping_debug() -> Vec<(String, String)> {
    storage::list_user_principals().into_iter().map(|e| (e.principal_ent, e.user_id)).collect()
}

#[ic_cdk::query]
pub fn debug_all_users() -> Vec<PrincipalEntry> {
    storage::list_user_principals()
}

// Utility functions re-exported
#[ic_cdk::query]
pub fn generate_user_id() -> String {
    utils::generate_user_id()
}

#[ic_cdk::query]
pub fn test_backend_connection() -> String {
    "Backend connection successful".to_string()
}

#[ic_cdk::query]
pub fn admin_exists() -> bool {
    storage::admin_exists()
}