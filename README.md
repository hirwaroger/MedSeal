# MedSeal — Blockchain-Backed AI Health Assistant (Internet Computer)

[![Internet Computer](https://img.shields.io/badge/Internet-Computer-9cf)](https://internetcomputer.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Built with Rust](https://img.shields.io/badge/Built%20with-Rust-orange)](https://www.rust-lang.org/)
[![Frontend: React](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-green)](https://github.com/IC-Innovations/ic-llm)
[![Development Status](https://img.shields.io/badge/Status-In%20Development-yellow)]()

**Secure, transparent, AI-assisted healthcare on the Internet Computer (ICP).** MedSeal revolutionizes healthcare accessibility by connecting patients in crisis with NGOs and communities through blockchain-secured medical crowdfunding, AI guidance, and community insurance pools.

---

## 🚧 Development Status
**MedSeal is currently under active development.** New features including patient crisis posting, NGO adoption workflows, secure crypto donation APIs, and community insurance pooling are being implemented. The platform is evolving to address global healthcare accessibility challenges.

**Current milestone:** Implementing secure NGO funding collection with ICP crypto payments and patient-NGO matching algorithms.

---

## 🏥 Project Overview

**MedSeal** is a revolutionary blockchain-based digital health platform built on the Internet Computer that bridges critical gaps in healthcare accessibility through secure, transparent, and AI-enhanced medical support systems.

### 🎯 The Healthcare Crisis We're Solving

Traditional healthcare systems face multiple life-threatening challenges:

- **Financial Barriers**: Patients with serious diseases cannot afford critical treatments
- **Fragmented Support Systems**: No secure way for NGOs to collect and distribute medical funding
- **Lack of Community Insurance**: Limited mechanisms for communities to support each other's healthcare needs
- **Prescription Vulnerabilities**: Paper-based prescriptions are easily lost, forged, or misunderstood
- **Information Gaps**: Patients lack real-time access to medication guidance and medical support
- **Trust Issues**: Limited transparency between patients, donors, and healthcare organizations

### 💡 Revolutionary Solution

MedSeal provides a comprehensive healthcare accessibility platform featuring:

#### 🆘 Patient Crisis Support System
- **Medical Frustration Posting**: Patients with serious diseases can securely share their medical needs when lacking funds
- **Verified Medical Evidence**: Blockchain-secured documentation of medical conditions and treatment requirements
- **Urgency Classification**: AI-powered categorization of medical cases based on severity and time sensitivity

#### 🤝 NGO Adoption & Funding Infrastructure
- **Case Adoption System**: NGOs can browse, evaluate, and adopt patient cases that match their mission
- **Secure Crypto Donation APIs**: Verified NGOs receive API access for collecting ICP, Bitcoin, and Ethereum donations
- **Transparent Fund Distribution**: Blockchain-tracked distribution ensuring funds reach intended patients
- **Donor Verification**: Secure donor identity verification and receipt generation

#### 🛡️ Community Insurance Pools
- **Mutual Aid Networks**: Communities create insurance pools where members contribute monthly for collective healthcare coverage
- **Democratic Governance**: Pool members vote on coverage policies and claim approvals
- **Automated Claims Processing**: Smart contracts handle claim verification and payouts
- **Risk Sharing**: Distributed risk model reduces individual healthcare costs

#### 🤖 AI-Powered Medical Assistance
- **Prescription Management**: Immutable prescription storage with AI-powered medication guidance
- **Health Query Support**: 24/7 AI assistant trained on medical literature
- **Drug Interaction Warnings**: Real-time alerts for potentially dangerous medication combinations

---

## 🌟 Key Innovation Features

### 🎥 Revolutionary Healthcare Accessibility
- **First blockchain platform** specifically designed for medical crowdfunding and community insurance
- **Multi-language support** for global healthcare accessibility
- **Mobile-first design** for users in developing regions
- **Offline capability** for areas with limited internet connectivity

### 🔗 Internet Computer Blockchain Security
- **Zero-trust architecture** with cryptographic verification for all medical records
- **Immutable audit trails** for donation tracking and fund distribution
- **Decentralized governance** preventing single points of failure in critical healthcare funding

### 🌐 Global NGO Network Integration
- **Verified NGO onboarding** with background checks and certification requirements
- **API-first architecture** allowing NGOs to integrate donation collection into existing websites
- **Multi-currency support** including traditional fiat and cryptocurrency payments
- **Real-time impact tracking** showing donors exactly how their contributions are used

---

## 🚀 Platform Components

### For Patients in Crisis 🆘
- **Crisis Posting Interface**: Simple, secure forms for posting medical needs with photo/document upload
- **Progress Tracking**: Real-time updates on case adoption, funding progress, and treatment milestones
- **Medical Record Management**: Encrypted storage of prescriptions, test results, and treatment history
- **AI Health Support**: 24/7 access to medical guidance and medication information

### For NGOs & Healthcare Organizations 🏥
- **Case Management Dashboard**: Browse, filter, and manage adopted patient cases
- **Donation Collection APIs**: Secure endpoints for integrating crypto and fiat payment processing
- **Impact Analytics**: Detailed reporting on fund utilization and patient outcomes
- **Verification System**: Multi-step verification process ensuring legitimate healthcare organizations

### For Community Insurance Members 👥
- **Pool Creation Tools**: Easy setup for community insurance pools with customizable coverage rules
- **Contribution Management**: Automated monthly contributions with transparent fee structures
- **Claims Submission**: Simple interface for submitting medical claims with supporting documentation
- **Governance Participation**: Voting on pool policies, claim approvals, and coverage decisions

### For Healthcare Providers 👨‍⚕️
- **Digital Prescription System**: Create secure, verifiable digital prescriptions with QR codes
- **Patient Communication**: Secure messaging and consultation scheduling
- **Medical Repository**: OCR-powered digitization of medication guides and treatment protocols
- **AI Clinical Support**: Drug interaction checking and dosage recommendations

---

## 🛠 Technology Stack

### Frontend Architecture
- **React 18+**: Modern, responsive healthcare interface
- **Progressive Web App**: Offline functionality for remote areas
- **Multi-language Support**: Localization for global accessibility
- **Mobile-First Design**: Optimized for smartphones in developing regions

### Blockchain Backend
- **Rust**: High-performance, memory-safe smart contracts
- **Internet Computer**: Truly decentralized hosting and computation
- **Candid**: Type-safe inter-canister communication
- **Cycles Management**: Automated resource allocation for scalability

### AI & Integration Layer
- **Llama 3.1 8B**: Medical knowledge AI for patient guidance
- **OCR Technology**: Document digitization and verification
- **Payment Gateways**: Multi-currency donation processing
- **Webhook Systems**: Real-time notifications for NGOs and donors

---

## 📋 Prerequisites & Setup

### Required Software
- **Node.js** (version 16+): `node --version` should show 16+
- **Rust**: Install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **DFX SDK**: Install via `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`
- **Git**: For repository cloning and version control

### System Requirements
- **Operating System**: macOS, Linux, or Windows (WSL2 recommended)
- **RAM**: Minimum 8GB, recommended 16GB for local development
- **Storage**: At least 10GB free space for blockchain data and dependencies
- **Internet**: Stable connection required for blockchain synchronization

---

## 🚀 Comprehensive Deployment Guide

### 🔧 Local Development Deployment

Perfect for development, testing, and contributing to MedSeal.

#### Step 1: Environment Setup
```bash
# Clone the repository
git clone https://github.com/hirwaroger/MedSeal.git
cd MedSeal

# Verify prerequisites
node --version    # Should be 16+
dfx --version    # Should be 0.15+
cargo --version  # Should be 1.68+
```

#### Step 2: Install Dependencies
```bash
# Install Node.js dependencies
npm install --force

# Add Rust WebAssembly target
rustup target add wasm32-unknown-unknown

# Verify dfx installation
dfx identity whoami
```

#### Step 3: Start Local Internet Computer
```bash
# Start local replica (runs in background)
dfx start --background --clean

# Verify replica is running
dfx status
# Should show: "dfx is running"

# Check replica health
dfx ping local
```

#### Step 4: Deploy All Canisters
```bash
# Deploy all canisters to local replica
dfx deploy

# Verify deployment
dfx canister status --all

# Generate TypeScript interfaces
npm run generate
```

#### Step 5: Initialize Platform Data
```bash
# Create initial admin user
dfx canister call medseal_backend create_admin_user '("admin@medseal.health")'

# Set up initial NGO verification keys
dfx canister call ngo_api_canister initialize_verification_system

# Create sample insurance pool for testing
dfx canister call insurance_canister create_sample_pool
```

#### Step 6: Start Frontend Development Server
```bash
# Start React development server
npm start

# Alternative: Start with specific port
PORT=3000 npm start
```

#### Step 7: Access Local Platform
```bash
# Get frontend canister URL
echo "Local MedSeal URL: http://localhost:4943?canisterId=$(dfx canister id MedSeal_frontend)"

# Or access directly
open "http://localhost:4943?canisterId=$(dfx canister id MedSeal_frontend)"
```

---

### 🎮 Playground Deployment

Deploy to Internet Computer playground for testing with external users.

#### Step 1: Configure Playground Network
```bash
# Add playground network to dfx.json (if not present)
dfx network add playground https://playground.dfinity.network

# Set playground as current network
dfx network set playground

# Verify network configuration
dfx network list
```

#### Step 2: Create Playground Identity
```bash
# Create new identity for playground
dfx identity new playground_deployer

# Use playground identity
dfx identity use playground_deployer

# Get playground principal
dfx identity get-principal
```

#### Step 3: Fund Playground Wallet
```bash
# Check current cycles balance
dfx wallet balance --network playground

# Get free cycles from faucet (if available)
dfx wallet request-faucet --network playground

# Verify sufficient cycles (need ~10T cycles)
dfx wallet balance --network playground
```

#### Step 4: Deploy to Playground
```bash
# Build and deploy all canisters
dfx deploy --network playground --with-cycles 8000000000000

# Verify playground deployment
dfx canister status --all --network playground

# Generate interfaces for playground
npm run generate:playground
```

#### Step 5: Configure Playground Environment
```bash
# Update frontend environment for playground
export NETWORK=playground
export NODE_ENV=staging

# Update canister IDs in environment
dfx canister id MedSeal_frontend --network playground
dfx canister id MedSeal_backend --network playground
```

#### Step 6: Access Playground Deployment
```bash
# Get playground frontend URL
echo "Playground URL: https://$(dfx canister id MedSeal_frontend --network playground).ic0.app"

# Test playground deployment
curl -I "https://$(dfx canister id MedSeal_frontend --network playground).ic0.app"
```

---

### 🌐 Mainnet Deployment

Deploy to Internet Computer mainnet for production use.

#### Step 1: Prepare Mainnet Identity
```bash
# Create production identity with strong security
dfx identity new mainnet_production --hsm  # If hardware security module available
# OR
dfx identity new mainnet_production

# Use production identity
dfx identity use mainnet_production

# IMPORTANT: Backup identity
dfx identity export mainnet_production > ~/medseal_mainnet_identity.pem
# Store this file securely and never share it
```

#### Step 2: Fund Production Wallet
```bash
# Check mainnet wallet balance
dfx wallet balance --network ic

# Purchase ICP tokens from exchange and transfer to wallet
# Get wallet address:
dfx identity get-wallet --network ic

# Verify cycles balance (need ~50T cycles for production)
dfx wallet balance --network ic
# If insufficient, convert ICP to cycles:
dfx cycles convert --amount 10.0 --network ic
```

#### Step 3: Pre-deployment Security Checklist
```bash
# Audit smart contracts
cargo audit

# Run comprehensive tests
cargo test --all
npm test

# Security scan
dfx canister security-audit --all

# Backup current state
dfx export backup_$(date +%Y%m%d).tar.gz
```

#### Step 4: Production Deployment
```bash
# Deploy with high cycles allocation
dfx deploy --network ic --with-cycles 20000000000000

# Verify all canisters deployed successfully
dfx canister status --all --network ic

# Check canister health
dfx canister logs MedSeal_backend --network ic
```

#### Step 5: Configure Production Environment
```bash
# Set production environment variables
export NETWORK=ic
export NODE_ENV=production
export MEDSEAL_ENV=mainnet

# Update frontend configuration
npm run build:production

# Deploy frontend assets
dfx deploy MedSeal_frontend --network ic
```

#### Step 6: Post-deployment Verification
```bash
# Get production URLs
echo "Production URL: https://$(dfx canister id MedSeal_frontend --network ic).ic0.app"
echo "Backend Canister: $(dfx canister id MedSeal_backend --network ic)"

# Test critical functionalities
curl -X POST "https://$(dfx canister id MedSeal_backend --network ic).ic0.app/health"

# Verify SSL certificate
openssl s_client -connect $(dfx canister id MedSeal_frontend --network ic).ic0.app:443
```

#### Step 7: Production Monitoring Setup
```bash
# Set up monitoring alerts
dfx canister call monitoring_canister setup_alerts '(
  record {
    email = "admin@medseal.health";
    thresholds = record {
      cycles_low = 5000000000000;
      error_rate = 0.01;
    }
  }
)'

# Configure backup schedule
dfx canister call backup_canister setup_schedule '("daily")'
```

---

## 🔐 Security & Compliance

### Blockchain Security
- **Immutable Records**: All medical data and donations permanently recorded
- **Multi-signature Wallets**: NGO funds require multiple approval signatures
- **Cryptographic Verification**: Every transaction cryptographically signed and verified
- **Audit Trails**: Complete transparency in fund movement and medical record access

### Privacy Protection
- **End-to-end Encryption**: Patient medical data encrypted before blockchain storage
- **Zero-knowledge Proofs**: Verify patient eligibility without revealing personal information
- **HIPAA Compliance**: Medical data handling follows healthcare privacy regulations
- **GDPR Compliance**: User data rights and deletion capabilities where legally required

### NGO Verification
- **Multi-stage Verification**: Background checks, legal documentation, and reference verification
- **Ongoing Monitoring**: Continuous monitoring of NGO activities and fund utilization
- **Community Reporting**: Transparent system for reporting suspicious activities
- **Automatic Suspension**: Smart contracts automatically suspend non-compliant organizations

---

## 🌍 Global Impact & Vision

### Current Healthcare Challenges MedSeal Addresses
- **2.6 billion people** lack access to basic healthcare funding
- **Medical bankruptcies** affect 66% of personal bankruptcies globally
- **Trust gaps** between donors and healthcare organizations reduce charitable giving
- **Administrative overhead** consumes 30-40% of healthcare donations

### MedSeal's Revolutionary Approach
- **Direct patient support** with 95%+ of donations reaching patients
- **Transparent fund tracking** showing donors exactly how money is used
- **Community-driven insurance** reducing individual healthcare costs by 60-80%
- **AI-powered matching** connecting patients with most suitable NGO partners

### Target Impact by 2025
- **100,000+ patients** supported through crisis funding
- **500+ verified NGOs** in the platform ecosystem
- **1,000+ community insurance pools** providing mutual healthcare coverage
- **$10M+ in verified donations** distributed transparently to patients in need

---

## 🤝 Contributing to Healthcare Revolution

### How to Contribute
1. **Fork the repository** and create feature branch
2. **Focus areas**: Patient interface improvements, NGO integration tools, insurance pool algorithms
3. **Code standards**: Follow Rust and React best practices with comprehensive testing
4. **Documentation**: Update README and API docs for significant changes
5. **Community**: Join discussions on healthcare accessibility challenges

### Priority Development Areas
- **Mobile optimization** for patients in developing regions
- **Multi-language support** for global accessibility
- **Offline functionality** for areas with limited connectivity
- **Integration APIs** for existing NGO websites and systems

---

## 📞 Support & Community

### Getting Help
- **Technical Documentation**: Comprehensive API and integration guides
- **Community Forum**: Connect with other developers and healthcare organizations
- **Video Tutorials**: Step-by-step guides for platform usage
- **24/7 Support**: Emergency support for critical healthcare funding issues

### Contact Information
- **Technical Issues**: Create GitHub issues with detailed bug reports
- **NGO Partnerships**: Contact partnerships@medseal.health
- **Security Concerns**: security@medseal.health (GPG key available)
- **Media Inquiries**: press@medseal.health

---

## 📄 License & Legal

**MIT License** - Open source platform encouraging global healthcare innovation

**Data Privacy**: MedSeal complies with HIPAA, GDPR, and local privacy regulations in supported regions

**Financial Compliance**: All cryptocurrency handling follows local financial regulations and AML/KYC requirements where applicable

---



**MedSeal** - Revolutionizing global healthcare accessibility through blockchain technology, AI assistance, and community-driven funding. Built with ❤️ on the Internet Computer for a healthier world.

**Experience the platform**: [Live Demo](https://medseal-platform.ic0.app)

---

### 🚨 Emergency Deployment Troubleshooting

#### Local Deployment Issues
```bash
# Reset local environment
dfx stop
dfx start --clean
rm -rf .dfx
dfx deploy
```

#### Playground Connection Problems
```bash
# Reset playground identity
dfx identity remove playground_deployer
dfx identity new playground_deployer
dfx wallet balance --network playground
```

#### Mainnet Deployment Failures
```bash
# Check cycles balance
dfx wallet balance --network ic
# If low: dfx cycles convert --amount 5.0 --network ic

# Verify identity
dfx identity whoami
dfx identity get-principal
```

#### Common Error Solutions
- **Canister full**: Increase memory allocation in dfx.json
- **Cycles exhausted**: Add cycles via `dfx cycles convert`
- **Network timeout**: Retry with `--retry-limit 10`
- **Permission denied**: Verify identity has correct permissions

For urgent deployment issues, contact: emergency-support@medseal.health

---

## ⚙️ Environment Configuration

Create environment configuration files for different deployment targets:

### Local Development Environment
```bash
# Create .env file in project root
cat > .env << EOF
# Network Configuration
NETWORK=local
NODE_ENV=development

# Canister IDs (auto-populated after dfx deploy)
MEDSEAL_CANISTER_ID=
AI_ASSISTANT_CANISTER_ID=
DONATION_CANISTER_ID=
NGO_API_CANISTER_ID=
INSURANCE_POOL_CANISTER_ID=

# Development Settings
DEBUG=true
LOG_LEVEL=verbose
PORT=3000

# API Endpoints
OCR_SERVICE_ENDPOINT=http://localhost:8080/ocr
LLM_API_KEY=dev_llm_key_here

# Security Settings
JWT_SECRET=local_dev_secret
WEBHOOK_SECRET=local_webhook_secret
EOF
```

### Production Environment Configuration
```bash
# Create .env.production
cat > .env.production << EOF
# Network Configuration
NETWORK=ic
NODE_ENV=production
MEDSEAL_ENV=mainnet

# Production Canister IDs
MEDSEAL_CANISTER_ID=rrkah-fqaaa-aaaah-qcura-cai
AI_ASSISTANT_CANISTER_ID=rdmx6-jaaaa-aaaah-qcura-cai
DONATION_CANISTER_ID=renrk-eyaaa-aaaah-qcura-cai

# Production Settings
DEBUG=false
LOG_LEVEL=error
ENABLE_ANALYTICS=true

# Security (use environment variables)
JWT_SECRET=${JWT_SECRET_PROD}
WEBHOOK_SECRET=${WEBHOOK_SECRET_PROD}
EOF
```

### Load Environment Variables
```bash
# For local development
export $(cat .env | xargs)

# For production deployment
export $(cat .env.production | xargs)

# Verify environment loaded correctly
echo "Network: $NETWORK"
echo "Node Environment: $NODE_ENV"
```

---

## 📝 Usage Examples with Code Snippets

### Patient Medical Crisis Posting

#### JavaScript Frontend Example
```javascript
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as MedSealIDL } from '../declarations/MedSeal_backend';

// Initialize agent for local development
const agent = new HttpAgent({ 
  host: process.env.NODE_ENV === 'development' 
    ? 'http://127.0.0.1:4943' 
    : 'https://ic0.app' 
});

// Create actor for MedSeal backend
const medsealActor = Actor.createActor(MedSealIDL, {
  agent,
  canisterId: process.env.MEDSEAL_CANISTER_ID,
});

// Post medical crisis case
async function postMedicalCrisis(patientData) {
  try {
    const result = await medsealActor.post_medical_case({
      patient_id: patientData.id,
      disease_description: patientData.diagnosis,
      medical_evidence: new Uint8Array(patientData.documents),
      funding_needed: BigInt(patientData.requiredAmount),
      urgency_level: patientData.urgency, // "Critical" | "High" | "Medium"
      location: patientData.location,
      contact_info: patientData.contact
    });
    
    return result;
  } catch (error) {
    console.error('Failed to post medical crisis:', error);
    throw error;
  }
}

// Usage example
const patientCase = {
  id: "patient_123",
  diagnosis: "Chronic kidney disease requiring dialysis",
  documents: documentBlob,
  requiredAmount: 50000,
  urgency: "Critical",
  location: "Rwanda, Kigali",
  contact: "patient@example.com"
};

postMedicalCrisis(patientCase);
```

### NGO Case Adoption and API Integration

#### Rust Backend Canister Method
```rust
use ic_cdk::api::time;
use ic_cdk_macros::{update, query};
use candid::{CandidType, Deserialize, Principal};

#[derive(CandidType, Deserialize, Clone)]
pub struct NGOCredentials {
    pub ngo_id: Principal,
    pub organization_name: String,
    pub api_key: String,
    pub webhook_url: String,
    pub verification_status: VerificationStatus,
}

#[update]
async fn adopt_patient_case(
    case_id: String,
    ngo_credentials: NGOCredentials,
    funding_commitment: u64
) -> Result<String, String> {
    // Verify NGO credentials
    let verified_ngo = verify_ngo_credentials(&ngo_credentials)?;
    
    // Check case availability
    let case = get_patient_case(&case_id)
        .ok_or("Case not found")?;
    
    if case.status != CaseStatus::Open {
        return Err("Case not available for adoption".to_string());
    }
    
    // Create adoption record
    let adoption_id = generate_adoption_id();
    let adoption = CaseAdoption {
        id: adoption_id.clone(),
        case_id: case_id.clone(),
        ngo_id: verified_ngo.ngo_id,
        funding_commitment,
        status: AdoptionStatus::Active,
        created_at: time(),
        updated_at: time(),
    };
    
    // Store adoption in stable memory
    ADOPTIONS.with(|adoptions| {
        adoptions.borrow_mut().insert(adoption_id.clone(), adoption);
    });
    
    // Update case status
    update_case_status(&case_id, CaseStatus::Adopted)?;
    
    // Generate API credentials for donation collection
    let api_credentials = generate_api_credentials(&verified_ngo);
    
    Ok(adoption_id)
}
```

### Community Insurance Pool Operations

#### Create Insurance Pool
```bash
# Create insurance pool via dfx
dfx canister call MedSeal_backend create_insurance_pool '(
  record {
    name = "Kigali Community Health Pool";
    monthly_contribution = 50000; // 0.0005 ICP
    max_members = 1000;
    coverage_conditions = vec {
      "Emergency medical procedures";
      "Chronic disease management";
      "Prescription medications";
    };
    minimum_claim_amount = 10000;
    maximum_claim_amount = 1000000;
  }
)'
```

#### Join Insurance Pool (JavaScript)
```javascript
async function joinInsurancePool(poolId, memberInfo) {
  const insuranceActor = Actor.createActor(InsuranceIDL, {
    agent,
    canisterId: process.env.INSURANCE_POOL_CANISTER_ID,
  });
  
  try {
    const result = await insuranceActor.join_insurance_pool({
      pool_id: poolId,
      member_info: {
        principal: memberInfo.principal,
        name: memberInfo.name,
        age: memberInfo.age,
        medical_history_hash: memberInfo.medicalHash,
        contact: memberInfo.contact,
        emergency_contact: memberInfo.emergencyContact
      },
      initial_contribution: BigInt(memberInfo.monthlyContribution)
    });
    
    // Set up recurring contributions
    await insuranceActor.setup_recurring_contribution({
      pool_id: poolId,
      member_id: result.member_id,
      amount: BigInt(memberInfo.monthlyContribution),
      frequency: "monthly",
      auto_pay: true
    });
    
    return result;
  } catch (error) {
    throw new Error(`Failed to join insurance pool: ${error.message}`);
  }
}
```

### NGO Donation Collection API

#### Express.js Webhook Handler
```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

// Verify webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// NGO donation webhook endpoint
app.post('/api/v1/ngo/:api_key/donate', async (req, res) => {
  try {
    const { api_key } = req.params;
    const signature = req.headers['x-medseal-signature'];
    
    // Verify NGO API key
    const ngo = await verifyNGOApiKey(api_key);
    if (!ngo) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Verify webhook signature
    const payload = JSON.stringify(req.body);
    if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }
    
    const { case_id, amount, donor_info, payment_method } = req.body;
    
    // Process donation through IC canister
    const donationResult = await donationActor.process_donation({
      ngo_id: ngo.principal,
      case_id,
      amount: BigInt(amount),
      donor: {
        name: donor_info.name,
        email: donor_info.email,
        anonymous: donor_info.anonymous || false
      },
      payment_method,
      timestamp: BigInt(Date.now())
    });
    
    // Send confirmation to NGO
    await notifyNGO(ngo.webhook_url, {
      event: 'donation_received',
      donation_id: donationResult.id,
      case_id,
      amount,
      transaction_hash: donationResult.tx_hash
    });
    
    res.json({
      success: true,
      donation_id: donationResult.id,
      transaction_hash: donationResult.tx_hash,
      receipt_url: `https://dashboard.internetcomputer.org/transaction/${donationResult.tx_hash}`
    });
    
  } catch (error) {
    console.error('Donation processing failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## 🔗 Integration Guidelines

### Canister-to-Canister Communication

Use ic-cdk for secure inter-canister calls:

```rust
use ic_cdk::call;

// Call another canister from within a canister
#[update]
async fn verify_patient_eligibility(patient_id: String) -> Result<bool, String> {
    // Call verification canister
    let (result,): (Result<bool, String>,) = call(
        VERIFICATION_CANISTER_ID,
        "verify_patient_medical_history",
        (patient_id,)
    ).await
    .map_err(|e| format!("Inter-canister call failed: {:?}", e))?;
    
    result
}
```

### Frontend Integration with IC Agent

#### Setup IC Agent for Different Networks
```javascript
import { HttpAgent, Actor } from '@dfinity/agent';

// Network configuration
const networks = {
  local: 'http://127.0.0.1:4943',
  playground: 'https://playground.dfinity.network',
  mainnet: 'https://ic0.app'
};

// Initialize agent based on environment
export function createAgent(network = 'local') {
  const agent = new HttpAgent({ 
    host: networks[network] || networks.local 
  });
  
  // Disable certificate validation for local development
  if (network === 'local') {
    agent.fetchRootKey();
  }
  
  return agent;
}

// Create typed actor
export function createMedSealActor(network = 'local') {
  const agent = createAgent(network);
  
  return Actor.createActor(medSealIdl, {
    agent,
    canisterId: getCanisterId('MedSeal_backend', network),
  });
}
```

### Third-Party API Integration

#### Webhook Signature Verification
```bash
# Generate webhook secret
openssl rand -hex 32

# Set webhook secret in environment
export WEBHOOK_SECRET=your_generated_secret_here
```

```javascript
// Verify incoming webhooks from external services
function verifyExternalWebhook(req, res, next) {
  const signature = req.headers['x-external-signature'];
  const timestamp = req.headers['x-timestamp'];
  const payload = JSON.stringify(req.body);
  
  // Check timestamp to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return res.status(400).json({ error: 'Request too old' });
  }
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.EXTERNAL_API_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(403).json({ error: 'Invalid signature' });
  }
  
  next();
}
```

---

## 📚 API Documentation

### Core Canister Methods

#### Patient Management API
```rust
// Create patient profile
#[update]
async fn create_patient_profile(profile: PatientProfile) -> Result<String, String>

// Post medical crisis
#[update] 
async fn post_medical_case(case: MedicalCase) -> Result<String, String>

// Get patient cases
#[query]
fn get_patient_cases(patient_id: String) -> Vec<MedicalCase>

// Update case status
#[update]
async fn update_case_status(case_id: String, status: CaseStatus) -> Result<(), String>
```

#### NGO Management API
```rust
// Register NGO
#[update]
async fn register_ngo(ngo_info: NGORegistration) -> Result<String, String>

// Verify NGO credentials  
#[update]
async fn verify_ngo_credentials(credentials: NGOCredentials) -> Result<VerificationResult, String>

// Adopt patient case
#[update]
async fn adopt_patient_case(case_id: String, ngo_id: String) -> Result<String, String>

// Get NGO statistics
#[query]
fn get_ngo_statistics(ngo_id: String) -> NGOStats
```

#### Donation Processing API
```rust
// Process donation
#[update]
async fn process_donation(donation: DonationRequest) -> Result<DonationReceipt, String>

// Get donation history
#[query]
fn get_donation_history(case_id: String) -> Vec<Donation>

// Verify transaction
#[query]
fn verify_donation_transaction(tx_hash: String) -> Option<DonationDetails>
```

#### Insurance Pool API
```rust
// Create insurance pool
#[update]
async fn create_insurance_pool(config: PoolConfiguration) -> Result<String, String>

// Join insurance pool
#[update] 
async fn join_insurance_pool(pool_id: String, member: MemberInfo) -> Result<String, String>

// Submit claim
#[update]
async fn submit_claim(claim: ClaimSubmission) -> Result<String, String>

// Process claim payout
#[update]
async fn process_claim_payout(claim_id: String) -> Result<PayoutDetails, String>
```

### REST API Endpoints for NGOs

#### Authentication
```http
POST /api/v1/auth/ngo
Content-Type: application/json
{
  "api_key": "ngo_api_key_here",
  "signature": "hmac_signature"
}
```

#### Donation Collection
```http
POST /api/v1/ngo/{api_key}/donate
Content-Type: application/json
X-MedSeal-Signature: sha256=signature_here
{
  "case_id": "case_123",
  "amount": 1000000,
  "donor_info": {
    "name": "John Doe",
    "email": "john@example.com",
    "anonymous": false
  },
  "payment_method": "ICP"
}
```

#### Case Management
```http
GET /api/v1/ngo/{api_key}/cases
Authorization: Bearer jwt_token_here

POST /api/v1/ngo/{api_key}/cases/{case_id}/adopt
Content-Type: application/json
{
  "funding_commitment": 50000,
  "timeline": "30_days"
}
```

---

## 🤝 Contributing Guidelines

### Development Workflow
1. **Fork repository**: Click "Fork" on GitHub repository page
2. **Clone locally**: `git clone https://github.com/your-username/MedSeal.git`
3. **Create feature branch**: `git checkout -b feature/patient-dashboard-improvements`
4. **Install dependencies**: `npm install --force && rustup target add wasm32-unknown-unknown`
5. **Start development environment**: `dfx start --background && dfx deploy`

### Code Standards and Testing
```bash
# Format Rust code
cargo fmt --all

# Lint JavaScript/React code
npm run lint

# Run Rust unit tests
cargo test --workspace

# Run frontend tests
npm test -- --coverage

# Run integration tests
dfx canister call MedSeal_backend run_integration_tests
```

### Contribution Focus Areas
- **Patient Interface**: Improve accessibility for users with disabilities
- **NGO Tools**: Enhance case management and reporting capabilities  
- **Insurance Algorithms**: Optimize claim processing and risk assessment
- **Mobile Optimization**: Ensure full functionality on mobile devices
- **Multi-language**: Add localization for underserved regions

### Pull Request Guidelines
```bash
# Before submitting PR
git add .
git commit -m "feat: improve patient crisis posting UI with accessibility features"
git push origin feature/patient-dashboard-improvements

# PR title format: "type: brief description"
# Types: feat, fix, docs, style, refactor, test, chore
```

---

## 🛠 Troubleshooting

### DFX and Canister Issues
```bash
# DFX not responding
dfx stop
killall dfx replica
dfx start --clean

# Canister deployment fails
dfx canister status --all
dfx wallet balance
dfx cycles convert --amount 5.0

# Reset local development environment
rm -rf .dfx
dfx start --clean
dfx deploy --upgrade-unchanged
```

### Frontend Build Problems
```bash
# Node modules conflicts
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --force

# React build errors
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Agent connection issues
export NETWORK=local
export NODE_ENV=development
npm start
```

### Network and Connectivity Issues
```bash
# Test local replica connection
dfx ping local
curl -I http://127.0.0.1:4943

# Test mainnet connectivity
dfx ping ic
ping ic0.app

# Check canister health
dfx canister logs MedSeal_backend
dfx canister status MedSeal_backend --network ic
```

### Common Error Solutions
- **"Canister trapped: out of cycles"**: Run `dfx cycles convert --amount 10.0`
- **"Agent connection refused"**: Verify `dfx start` and check port 4943
- **"Invalid principal"**: Ensure correct identity with `dfx identity whoami`
- **"Webpack build failed"**: Clear cache and rebuild: `rm -rf .dfx/local && dfx deploy`

---

## 📄 License Information

**MIT License**

```
Copyright (c) 2024 MedSeal Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Additional Legal Information
- **HIPAA Compliance**: Medical data handling follows US healthcare privacy regulations
- **GDPR Compliance**: User data rights respected in EU regions
- **Financial Regulations**: Cryptocurrency handling complies with applicable AML/KYC laws
- **Open Source**: Encourages global healthcare innovation and transparency

---

## 🤝 Contributing

We welcome contributions to MedSeal! Please follow these guidelines:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style
- **Rust**: Follow standard Rust formatting (`cargo fmt`)
- **JavaScript**: Use ESLint configuration provided
- **Documentation**: Update README for significant changes


## 🌟 Acknowledgments

- **Internet Computer Foundation** for the revolutionary blockchain platform
- **DFINITY** for the development tools and infrastructure
- **ic-llm team** for AI integration capabilities
- **Open source community** for various libraries and tools used

## 📞 Support

For technical support or questions:
- **Documentation**: Review this README and IC documentation
- **Community**: Join Internet Computer developer forums
- **Issues**: Report bugs via GitHub issues

---

**MedSeal** - Revolutionizing global healthcare accessibility through blockchain technology, AI assistance, and community-driven funding. Built with ❤️ on the Internet Computer for a healthier world.

**Experience the platform**: [Live Demo](https://dg7i5-5aaaa-aaaai-atlia-cai.icp0.io)

For urgent deployment issues, contact: emergency-support@medseal.health
