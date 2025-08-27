# MedSeal - Secure Digital Health Platform

[![Internet Computer](https://img.shields.io/badge/Internet%20Computer-Blockchain-blue)](https://internetcomputer.org/)
[![Rust](https://img.shields.io/badge/Rust-Backend-orange)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-Frontend-blue)](https://reactjs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-green)](https://github.com/IC-Innovations/ic-llm)

## 🏥 Project Overview

**MedSeal** is a revolutionary blockchain-based digital health platform built on the Internet Computer that bridges the gap between doctors and patients through secure, transparent, and AI-enhanced prescription management.

### 🎯 Problem Statement

Traditional prescription systems face critical challenges:
- **Security vulnerabilities** in paper-based prescriptions
- **Lack of transparency** between doctors and patients
- **Limited access** to medication information and guidance
- **No real-time support** for medication-related queries
- **Fragmented communication** between healthcare providers and patients

### 💡 Solution

MedSeal provides a comprehensive digital health ecosystem that:
- **Secures prescriptions** on an immutable blockchain ledger
- **Enables real-time communication** between doctors and patients
- **Provides AI-powered health assistance** for medication guidance
- **Offers OCR technology** for digitizing medicine guides
- **Ensures privacy** through decentralized infrastructure

## 🚀 Key Features

### For Doctors 👨‍⚕️
- **Medicine Repository Management**: Build and manage a comprehensive database of medicines with OCR-powered guide extraction
- **Smart Prescription Creation**: Generate secure digital prescriptions with unique verification codes
- **AI Medical Assistant**: Get intelligent support for drug interactions, dosages, and clinical decisions
- **Patient Monitoring**: Track prescription access and patient engagement
- **Analytics Dashboard**: View comprehensive statistics and recent activity

### For Patients 👥
- **Secure Prescription Access**: Access prescriptions using unique ID and verification codes
- **Detailed Medicine Information**: View comprehensive medicine details, dosages, and side effects
- **AI Health Partner**: Get personalized medication guidance and health support
- **Prescription History**: Maintain a secure history of all accessed prescriptions
- **Medicine Guides**: Access detailed medicine guides and instructions

### Technical Features 🔧
- **Blockchain Security**: Built on Internet Computer for maximum security and decentralization
- **OCR Technology**: Automatic text extraction from PDF medicine guides
- **AI Integration**: Powered by Llama 3.1 8B model for intelligent health assistance
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Updates**: Instant synchronization across the platform

## 🛠 Technology Stack

### Backend
- **Rust**: High-performance, memory-safe backend development
- **Internet Computer**: Decentralized blockchain platform
- **Candid**: Interface description language for IC canisters
- **ic-llm**: AI integration for health assistance

### Frontend
- **React**: Modern UI framework
- **JavaScript/JSX**: Interactive user interfaces
- **Bootstrap**: Professional, responsive styling
- **PDF.js**: OCR and PDF processing
- **Canvas API**: Image processing for OCR

### Infrastructure
- **Internet Computer Protocol**: Decentralized hosting and computation
- **DFX**: Development framework for IC applications
- **Node.js**: Development environment and package management

## 📋 Prerequisites

Before deploying MedSeal, ensure you have:

### Required Software
1. **Rust Programming Language**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **DFX (DFINITY Canister SDK)**
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

3. **Node.js** (version 16 or higher)
   ```bash
   # Install via package manager or download from nodejs.org
   node --version  # Should be 16+
   ```

### System Requirements
- **OS**: Linux, macOS, or Windows (with WSL2)
- **RAM**: Minimum 4GB recommended
- **Storage**: At least 2GB free space
- **Network**: Stable internet connection for blockchain interaction

## 🚀 Deployment Guide

### Option 1: Quick Deployment with Script

1. **Clone the repository**
   ```bash
   git clone https://github.com/hirwaroger/MedSeal
   cd MedSeal
   ```

2. **Make deployment script executable**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run deployment script**
   ```bash
   ./deploy.sh
   ```

4. **Access the application**
   - The script will provide URLs for frontend and backend access
   - Open the frontend URL in your browser

### Option 2: Manual Local Deployment

1. **Clone and navigate to project**
   ```bash
   git clone https://github.com/hirwaroger/MedSeal
   cd MedSeal
   ```

2. **Install frontend dependencies**
   ```bash
   npm install --force
   ```

3. **Start local Internet Computer replica**
   ```bash
   dfx start --background --clean
   ```

4. **Deploy canisters**
   ```bash
   dfx deploy
   ```

5. **Generate Candid interfaces**
   ```bash
   npm run generate
   ```

6. **Access the application**
   ```bash
   # Get frontend canister ID
   dfx canister id MedSeal_frontend
   
   # Access at: http://localhost:4943?canisterId=<frontend_canister_id>
   ```

### Option 3: Internet Computer Mainnet Deployment

1. **Create Internet Computer identity**
   ```bash
   dfx identity new deployment
   dfx identity use deployment
   ```

2. **Get cycles for deployment**
   ```bash
   # You'll need ICP tokens converted to cycles
   dfx wallet --network ic balance
   ```

3. **Deploy to mainnet**
   ```bash
   dfx deploy --network ic
   ```

## 📱 Usage Guide

### Getting Started

1. **Register Account**
   - Choose your role: Doctor or Patient
   - Provide required information
   - For doctors: Include medical license number

2. **For Doctors**
   - Add medicines to your repository
   - Upload PDF guides for OCR extraction
   - Create prescriptions for patients
   - Monitor prescription access

3. **For Patients**
   - Receive prescription ID and code from doctor
   - Access prescription securely
   - View detailed medicine information
   - Use AI assistant for health guidance

### User Roles & Permissions

#### Doctor Capabilities
- ✅ Create and manage medicine repository
- ✅ Generate secure prescriptions
- ✅ Access AI medical assistant
- ✅ View prescription analytics
- ✅ Upload and process PDF guides

#### Patient Capabilities
- ✅ Access prescriptions with valid codes
- ✅ View medicine details and guides
- ✅ Use AI health partner for guidance
- ✅ Maintain prescription history
- ❌ Cannot access other patients' data

## 🔐 Security Features

### Blockchain Security
- **Immutable Records**: All prescriptions stored on tamper-proof blockchain
- **Cryptographic Verification**: Each prescription has unique verification codes
- **Decentralized Storage**: No single point of failure

### Privacy Protection
- **Role-Based Access**: Users can only access their authorized data
- **Secure Authentication**: Identity verification through Internet Computer
- **Data Encryption**: Sensitive information encrypted at rest and in transit

### Access Control
- **Prescription Isolation**: Patients can only access their own prescriptions
- **Doctor-Patient Boundaries**: Clear separation of doctor and patient data
- **Time-Based Access**: Prescriptions can have access restrictions

## 🤖 AI Integration

### Health Partner Features
- **Medication Guidance**: Personalized advice based on prescribed medicines
- **Drug Interaction Warnings**: AI-powered interaction detection
- **Side Effect Information**: Comprehensive side effect explanations
- **Dosage Recommendations**: AI-assisted dosage optimization

### AI Models Used
- **Llama 3.1 8B**: Primary language model for health assistance
- **Context-Aware Responses**: AI understands user type and prescription context
- **Medical Knowledge Base**: Trained on medical literature and drug information

## 🔧 Development

### Project Structure
```
MedSeal/
├── src/
│   ├── MedSeal_backend/          # Rust backend canister
│   │   ├── src/lib.rs           # Main backend logic
│   │   ├── Cargo.toml           # Rust dependencies
│   │   └── MedSeal_backend.did  # Candid interface
│   └── MedSeal_frontend/         # React frontend
│       ├── src/
│       │   ├── components/      # React components
│       │   ├── utils/          # Utility functions
│       │   └── index.js        # Main entry point
│       └── package.json        # Node dependencies
├── dfx.json                    # DFX configuration
├── deploy.sh                   # Deployment script
└── README.md                   # This file
```

### Development Commands
```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Generate Candid interfaces
npm run generate

# Deploy locally
dfx deploy

# Check canister status
dfx canister status --all
```

## 🐛 Troubleshooting

### Common Issues

1. **DFX Start Fails**
   ```bash
   # Clean and restart
   dfx stop
   dfx start --clean --background
   ```

2. **Rust Compilation Errors**
   ```bash
   # Update Rust toolchain
   rustup update
   ```

3. **Frontend Build Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Canister Deployment Fails**
   ```bash
   # Check wallet balance
   dfx wallet balance
   
   # Increase cycle allocation
   dfx canister deposit-cycles <amount> <canister-name>
   ```

### Getting Help
- Check the [Internet Computer documentation](https://internetcomputer.org/docs)
- Review [DFX troubleshooting guide](https://internetcomputer.org/docs/current/developer-docs/setup/troubleshooting)
- Ensure all prerequisites are properly installed

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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

**MedSeal** - Revolutionizing healthcare through blockchain technology and AI assistance. Built with ❤️ on the Internet Computer.
