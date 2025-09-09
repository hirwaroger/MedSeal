use ic_cdk::api::caller;
use crate::shared::types::*;
use crate::shared::storage as storage;
use crate::shared::utils as utils;

// Helper function to verify patient role
fn verify_patient() -> Result<User> {
    let caller_principal = caller().to_string();
    
    match storage::get_user_by_principal(&caller_principal) {
        Some(user) => {
            match user.role {
                UserRole::Patient => Ok(user),
                _ => Err("Only patients can submit cases".to_string()),
            }
        },
        None => Err("User not found".to_string()),
    }
}

// Helper function to verify NGO role
fn verify_ngo() -> Result<User> {
    let caller_principal = caller().to_string();
    
    match storage::get_user_by_principal(&caller_principal) {
        Some(user) => {
            match user.role {
                UserRole::NGO => {
                    if user.verification_status != VerificationStatus::Approved {
                        return Err("NGO must be verified to create contribution pools".to_string());
                    }
                    Ok(user)
                }
                _ => Err("Only NGOs can create contribution pools".to_string()),
            }
        },
        None => Err("User not found".to_string()),
    }
}

// Helper function to verify admin role
fn verify_admin() -> Result<User> {
    let caller_principal = caller().to_string();
    
    match storage::get_user_by_principal(&caller_principal) {
        Some(user) => {
            match user.role {
                UserRole::Admin => Ok(user),
                _ => Err("Only admins can process cases".to_string()),
            }
        },
        None => Err("User not found".to_string()),
    }
}

#[ic_cdk::update]
pub fn submit_patient_case(request: SubmitCaseRequest) -> Result<String> {
    let patient = verify_patient()?;
    
    let case_id = utils::generate_id("case");
    let patient_case = PatientCase {
        id: case_id.clone(),
        patient_id: patient.id.clone(),
        patient_name: patient.name.clone(),
        patient_contact: patient.email.clone(),
        case_title: request.case_title,
        case_description: request.case_description,
        medical_condition: request.medical_condition,
        required_amount: request.required_amount,
        supporting_documents: request.supporting_documents,
        urgency_level: request.urgency_level,
        status: CaseStatus::Pending,
        created_at: utils::get_current_timestamp(),
        reviewed_at: None,
        reviewed_by: None,
        admin_notes: None,
    };
    
    storage::store_patient_case(patient_case);
    Ok(case_id)
}

#[ic_cdk::query]
pub fn get_all_patient_cases() -> Result<Vec<PatientCase>> {
    let _admin = verify_admin()?;
    Ok(storage::get_all_patient_cases())
}

#[ic_cdk::query]
pub fn get_pending_patient_cases() -> Result<Vec<PatientCase>> {
    let _admin = verify_admin()?;
    Ok(storage::get_patient_cases_by_status(CaseStatus::Pending))
}

#[ic_cdk::query]
pub fn get_approved_patient_cases() -> Result<Vec<PatientCase>> {
    // NGOs can view approved cases to create pools
    let caller_principal = caller().to_string();
    let user = storage::get_user_by_principal(&caller_principal)
        .ok_or("User not found".to_string())?;
    
    match user.role {
        UserRole::NGO | UserRole::Admin => {
            Ok(storage::get_patient_cases_by_status(CaseStatus::Approved))
        }
        _ => Err("Only NGOs and admins can view approved cases".to_string()),
    }
}

#[ic_cdk::query]
pub fn get_patient_case(case_id: String) -> Result<PatientCase> {
    let caller_principal = caller().to_string();
    let user = storage::get_user_by_principal(&caller_principal)
        .ok_or("User not found".to_string())?;
    
    let case = storage::get_patient_case(&case_id)
        .ok_or("Case not found".to_string())?;
    
    // Patients can view their own cases, NGOs and admins can view approved cases
    match user.role {
        UserRole::Admin => Ok(case),
        UserRole::Patient => {
            if case.patient_id == user.id {
                Ok(case)
            } else {
                Err("You can only view your own cases".to_string())
            }
        }
        UserRole::NGO => {
            if matches!(case.status, CaseStatus::Approved | CaseStatus::Funded) {
                Ok(case)
            } else {
                Err("NGOs can only view approved cases".to_string())
            }
        }
        _ => Err("Access denied".to_string()),
    }
}

#[ic_cdk::update]
pub fn process_patient_case(request: ProcessCaseRequest) -> Result<String> {
    let admin = verify_admin()?;
    
    let mut case = storage::get_patient_case(&request.case_id)
        .ok_or("Case not found".to_string())?;
    
    case.status = request.status.clone();
    case.reviewed_at = Some(utils::get_current_timestamp());
    case.reviewed_by = Some(admin.id);
    case.admin_notes = request.admin_notes;
    
    storage::update_patient_case(&request.case_id, case);
    
    let status_msg = match request.status {
        CaseStatus::Approved => "approved",
        CaseStatus::Rejected => "rejected",
        _ => "processed",
    };
    
    Ok(format!("Case {}", status_msg))
}

#[ic_cdk::update]
pub fn create_contribution_pool(request: CreatePoolRequest) -> Result<String> {
    let ngo = verify_ngo()?;
    
    // Verify the case exists and is approved
    let case = storage::get_patient_case(&request.case_id)
        .ok_or("Case not found".to_string())?;
    
    if !matches!(case.status, CaseStatus::Approved) {
        return Err("Can only create pools for approved cases".to_string());
    }
    
    // Check if a pool already exists for this case
    if storage::get_pool_by_case_id(&request.case_id).is_some() {
        return Err("A contribution pool already exists for this case".to_string());
    }
    
    let pool_id = utils::generate_id("pool");
    let deadline = request.deadline_days.map(|days| {
        utils::get_current_timestamp() + (days * 24 * 60 * 60 * 1000000000) // Convert days to nanoseconds
    });
    
    let pool = ContributionPool {
        id: pool_id.clone(),
        case_id: request.case_id,
        ngo_id: ngo.id.clone(),
        ngo_name: ngo.name.clone(),
        target_amount: request.target_amount,
        current_amount: 0,
        contributors_count: 0,
        pool_title: request.pool_title,
        pool_description: request.pool_description,
        created_at: utils::get_current_timestamp(),
        deadline,
        is_active: true,
        is_completed: false,
    };
    
    storage::store_contribution_pool(pool);
    Ok(pool_id)
}

#[ic_cdk::query]
pub fn get_contribution_pools() -> Result<Vec<ContributionPool>> {
    Ok(storage::get_all_contribution_pools())
}

#[ic_cdk::query]
pub fn get_active_contribution_pools() -> Result<Vec<ContributionPool>> {
    Ok(storage::get_active_contribution_pools())
}

#[ic_cdk::query]
pub fn get_ngo_contribution_pools(ngo_id: String) -> Result<Vec<ContributionPool>> {
    let caller_principal = caller().to_string();
    let user = storage::get_user_by_principal(&caller_principal)
        .ok_or("User not found".to_string())?;
    
    match user.role {
        UserRole::NGO => {
            if user.id != ngo_id {
                return Err("You can only view your own pools".to_string());
            }
            Ok(storage::get_contribution_pools_by_ngo(&ngo_id))
        }
        UserRole::Admin => Ok(storage::get_contribution_pools_by_ngo(&ngo_id)),
        _ => Err("Access denied".to_string()),
    }
}

#[ic_cdk::query]
pub fn get_contribution_pool(pool_id: String) -> Result<ContributionPool> {
    storage::get_contribution_pool(&pool_id)
        .ok_or("Pool not found".to_string())
}

#[ic_cdk::update]
pub fn contribute_to_pool(request: ContributeRequest) -> Result<String> {
    let caller_principal = caller().to_string();
    
    let mut pool = storage::get_contribution_pool(&request.pool_id)
        .ok_or("Pool not found".to_string())?;
    
    if !pool.is_active {
        return Err("Pool is not active".to_string());
    }
    
    if pool.is_completed {
        return Err("Pool is already completed".to_string());
    }
    
    // Check deadline
    if let Some(deadline) = pool.deadline {
        if utils::get_current_timestamp() > deadline {
            return Err("Pool deadline has passed".to_string());
        }
    }
    
    let contribution_id = utils::generate_id("contrib");
    let contribution = Contribution {
        id: contribution_id.clone(),
        pool_id: request.pool_id,
        contributor_principal: caller_principal,
        amount: request.amount,
        message: request.message,
        contributed_at: utils::get_current_timestamp(),
        is_anonymous: request.is_anonymous,
    };
    
    // Update pool statistics
    pool.current_amount += request.amount;
    pool.contributors_count += 1;
    
    // Check if pool is completed
    if pool.current_amount >= pool.target_amount {
        pool.is_completed = true;
        
        // Update case status to funded
        if let Some(mut case) = storage::get_patient_case(&pool.case_id) {
            case.status = CaseStatus::Funded;
            storage::update_patient_case(&pool.case_id, case);
        }
    }
    
    storage::store_contribution(contribution);
    let pool_id_clone = pool.id.clone();
    storage::update_contribution_pool(&pool_id_clone, pool);
    
    Ok(contribution_id)
}

#[ic_cdk::query]
pub fn get_pool_contributions(pool_id: String) -> Result<Vec<Contribution>> {
    Ok(storage::get_contributions_by_pool(&pool_id))
}

#[ic_cdk::query]
pub fn get_user_contributions() -> Result<Vec<Contribution>> {
    let caller_principal = caller().to_string();
    Ok(storage::get_contributions_by_user(&caller_principal))
}

#[ic_cdk::query]
pub fn get_my_patient_cases() -> Result<Vec<PatientCase>> {
    let caller_principal = caller().to_string();
    
    let user = storage::get_user_by_principal(&caller_principal)
        .ok_or("User not found".to_string())?;
    
    match user.role {
        UserRole::Patient => {
            Ok(storage::get_patient_cases_by_patient(&user.id))
        }
        UserRole::Admin => {
            Ok(storage::get_all_patient_cases())
        }
        _ => Err("Access denied".to_string()),
    }
}