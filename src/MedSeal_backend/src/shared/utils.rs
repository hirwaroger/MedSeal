use ic_cdk::api::time;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

pub fn generate_id(prefix: &str) -> String {
    let timestamp = time();
    let caller = ic_cdk::caller().to_string();
    
    let mut hasher = DefaultHasher::new();
    timestamp.hash(&mut hasher);
    caller.hash(&mut hasher);
    let hash = hasher.finish();
    
    format!("{}_{}", prefix, hash)
}

pub fn generate_user_id() -> String {
    generate_id("user")
}

pub fn generate_medicine_id() -> String {
    generate_id("med")
}

pub fn generate_prescription_id() -> String {
    generate_id("presc")
}

pub fn generate_prescription_code() -> String {
    let timestamp = time();
    let caller = ic_cdk::caller().to_string();
    
    let mut hasher = DefaultHasher::new();
    timestamp.hash(&mut hasher);
    caller.hash(&mut hasher);
    let hash = hasher.finish();
    
    // Generate a 8-character alphanumeric code
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut code = String::new();
    let mut temp_hash = hash;
    
    for _ in 0..8 {
        let index = (temp_hash % chars.len() as u64) as usize;
        code.push(chars.chars().nth(index).unwrap());
        temp_hash /= chars.len() as u64;
    }
    
    code
}

pub fn generate_verification_hash() -> String {
    let timestamp = time();
    let caller = ic_cdk::caller().to_string();

    let mut hasher = DefaultHasher::new();
    timestamp.hash(&mut hasher);
    caller.hash(&mut hasher);
    "verification".hash(&mut hasher);
    let hash = hasher.finish();

    format!("verifhash{}", hash % 10000000) // Generate hash like verifhash7654653
}

pub fn get_current_timestamp() -> u64 {
    time()
}

pub fn validate_email(email: &str) -> bool {
    email.contains('@') && email.contains('.')
}

pub fn validate_user_role(role: &str) -> bool {
    matches!(role.to_lowercase().as_str(), "doctor" | "patient")
}