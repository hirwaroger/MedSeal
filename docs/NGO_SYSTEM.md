# NGO Case Adoption and Donor Verification System

This document outlines the new NGO (Non-Governmental Organization) features added to MedSeal, including case adoption, donor verification, and donation processing.

## System Overview

### Admin System
- **Initial Admin Creation**: First admin is created as super admin with all permissions
- **Admin Management**: Admins can create other admins with specific permissions
- **Permission-based Access**: Different admin roles (ManageNGOs, ManageUsers, etc.)

### NGO Registration & Verification
- **NGO Registration**: Organizations can register with required documentation
- **Multi-step Verification**: Admin-controlled verification process
- **API Key Generation**: Verified NGOs receive API keys for donation collection

### Case Adoption System
- **Case Browsing**: NGOs can browse open patient cases
- **Case Adoption**: Verified NGOs can adopt cases with funding commitments
- **Timeline Management**: Set adoption timelines and track progress

### Donor Management & Verification
- **Donor Registration**: Secure donor registration with email verification
- **Identity Verification**: Admin-controlled full verification process
- **Anonymous Donations**: Option for anonymous donations

## API Usage Examples

### 1. Create Initial Admin (First Time Setup)

```bash
# Create the first super admin (only works if no admin exists)
dfx canister call MedSeal_backend create_initial_admin '("admin@medseal.health", "System Administrator")'
```

### 2. NGO Registration

```bash
# NGO registers on the platform
dfx canister call MedSeal_backend register_ngo '(record {
  name = "Global Health Initiative";
  email = "contact@globalhealth.org";
  description = "Providing healthcare access to underserved communities worldwide";
  website = "https://globalhealth.org";
  registration_number = "NGO-2024-001";
  country = "Rwanda";
  focus_areas = vec { "Emergency Care"; "Chronic Diseases"; "Pediatric Medicine" };
  webhook_url = opt "https://globalhealth.org/medseal-webhook";
})'
```

### 3. Admin Verifies NGO

```bash
# Admin approves NGO after verification process
dfx canister call MedSeal_backend verify_ngo '(record {
  ngo_id = "ngo_1234567890";
  status = variant { Verified };
  verification_notes = "All documentation verified. Organization approved.";
})'
```

### 4. Create Patient Case

```bash
# Patient creates a medical case needing funding
dfx canister call MedSeal_backend create_patient_case '(record {
  patient_name = "John Doe";
  patient_contact = "john.doe@email.com";
  disease_description = "Chronic kidney disease requiring urgent dialysis treatment";
  medical_evidence = blob "medical_document_hash";
  funding_needed = 50000; // Amount in smallest currency unit
  urgency_level = variant { Critical };
  location = "Kigali, Rwanda";
  medical_documents = vec { blob "scan1"; blob "scan2" };
})'
```

### 5. NGO Adopts Case

```bash
# NGO adopts a patient case
dfx canister call MedSeal_backend adopt_case '(record {
  case_id = "case_1234567890";
  funding_commitment = 50000;
  adoption_reason = "Matches our focus on kidney disease treatment in Rwanda";
  timeline_days = 30;
})'
```

### 6. Donor Registration

```bash
# Donor registers to make donations
dfx canister call MedSeal_backend register_donor '(record {
  name = "Jane Smith";
  email = "jane.smith@email.com";
  is_anonymous = false;
})'
```

### 7. Process Donation

```bash
# Process a donation from donor to case
dfx canister call MedSeal_backend process_donation '(record {
  donor_id = "donor_1234567890";
  case_id = "case_1234567890";
  amount = 10000;
  notes = opt "Happy to help with medical treatment";
})'
```

## Query Functions

### List Available Cases for Adoption

```bash
# List all open cases
dfx canister call MedSeal_backend list_open_cases '(null)'

# Filter by urgency
dfx canister call MedSeal_backend list_open_cases '(opt variant { Critical })'

# Search cases by location and criteria
dfx canister call MedSeal_backend search_cases '(opt "Rwanda", opt variant { High }, opt 25000)'
```

### NGO Management Queries

```bash
# Get NGO information
dfx canister call MedSeal_backend get_ngo '("ngo_1234567890")'

# List all NGOs by status
dfx canister call MedSeal_backend list_ngos '(opt variant { Verified })'

# Get NGO's adopted cases
dfx canister call MedSeal_backend get_ngo_adoptions '("ngo_1234567890")'
```

### Donation Tracking

```bash
# Get donation receipt
dfx canister call MedSeal_backend get_donation_receipt '("donation_1234567890")'

# Get all donations by a donor
dfx canister call MedSeal_backend get_donor_donations '("donor_1234567890")'

# Get all donations received by an NGO
dfx canister call MedSeal_backend get_ngo_donations '("ngo_1234567890")'
```

## Permission System

### Admin Permissions

- **ManageNGOs**: Verify/reject NGO applications, suspend NGOs
- **ManageUsers**: Create/manage admin accounts
- **ManageSystem**: System-wide configuration changes
- **ViewReports**: Access to analytics and reports
- **ManageCases**: Verify patient cases, update case status
- **ManageDonations**: Verify donors, process donations

### NGO Verification Statuses

- **Pending**: Initial registration, awaiting review
- **UnderReview**: Admin is reviewing application
- **Verified**: Approved and can adopt cases
- **Rejected**: Application denied
- **Suspended**: Temporarily suspended from platform

### Case Statuses

- **Open**: Available for NGO adoption
- **UnderReview**: Being evaluated for verification
- **Adopted**: Taken by an NGO for funding
- **FundingComplete**: Required funding raised
- **Completed**: Case successfully resolved
- **Cancelled**: Case cancelled by patient
- **Expired**: Case deadline passed

## Security Features

### NGO Verification
- Multi-step verification process
- Document validation requirements
- Background checks by admins
- Continuous monitoring of activities

### Donor Protection
- Identity verification system
- Secure transaction processing
- Receipt generation for all donations
- Anonymous donation options

### Transparency
- Immutable donation records
- Public case adoption tracking
- Transparent fund utilization
- Audit trails for all transactions

## Integration with Existing System

The new NGO system integrates seamlessly with existing MedSeal features:

- **AI Assistant**: Enhanced with NGO-specific guidance
- **Prescription System**: Medical documentation for cases
- **User Management**: Extended with admin and NGO roles
- **Blockchain Security**: All transactions recorded immutably

## Deployment Notes

After deploying with the new NGO features:

1. Create initial admin account
2. Set up NGO verification workflows
3. Configure donation processing
4. Test case adoption flow
5. Verify donor registration process

## Future Enhancements

- **Multi-currency Support**: Accept donations in various cryptocurrencies
- **Impact Tracking**: Detailed outcome tracking for adopted cases
- **NGO Ratings**: Community-driven NGO performance ratings
- **Automated Matching**: AI-powered case-NGO matching system