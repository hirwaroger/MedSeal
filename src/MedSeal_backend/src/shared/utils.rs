use ic_cdk::api::{caller, time};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

thread_local! {
    static RNG_COUNTER: std::cell::Cell<u64> = std::cell::Cell::new(0);
}

/// Returns current canister time in nanoseconds (u64)
pub fn get_current_timestamp() -> u64 {
    time()
}

/// Lightweight, deterministic-ish unique id generator (u64)
/// Combines nanoseconds timestamp, caller principal text, and a local counter.
pub fn generate_random_id() -> u64 {
    let ts = time();
    let caller_txt = caller().to_text();

    let mut hash = ts;
    for b in caller_txt.as_bytes() {
        // FNV-1a style mixing
        hash = hash.wrapping_mul(1099511628211).wrapping_add(*b as u64);
    }

    let counter = RNG_COUNTER.with(|c| {
        let v = c.get().wrapping_add(1);
        c.set(v);
        v
    });

    hash ^ counter
}

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
    generate_id("prescription")
}

pub fn generate_prescription_code() -> String {
    let timestamp = get_current_timestamp();
    let random = timestamp % 999999;
    format!("RX{:06}", random)
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

pub fn validate_email(email: &str) -> bool {
    email.contains('@') && email.contains('.')
}

pub fn validate_user_role(role: &str) -> bool {
    matches!(role.to_lowercase().as_str(), "doctor" | "patient")
}