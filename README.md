# XRP Ledger 2.0

## Description

This project is a comprehensive TypeScript-based application for interacting with the XRP Ledger testnet. It provides a modular architecture with three main features:

### Features

- **🏦 Currency Issuer** (`features/issuer/`): Create and manage custom tokens on the XRP Ledger with hot and cold wallet architecture
- **💸 Token Sender** (`features/sender/`): Send XRP and custom tokens between wallets with transaction validation
- **📊 Ledger Monitor** (`features/main/`): Monitor account information, balances, and ledger state

### Architecture

The application follows a clean, modular structure:

```text
├── features/          # Main application features
│   ├── issuer/        # Currency issuance 
│   ├── sender/        # Token/XRP sending 
│   └── main/          # Account monitoring and ledger info
├── tools/             # Shared utilities and helpers
│   ├── helpers        # Transaction handling and wallet management
│   ├── server         # Testnet connection configuration
│   └── template       # Script template
└── package.json       # Dependencies and project configuration
```

### Key Features

- **TypeScript Support**: Fully migrated to TypeScript with strict type checking
- **Transaction Safety**: Robust error handling and transaction validation
- **Ledger Sequence Management**: Automatic handling of configurable transaction expiration
- **Hot/Cold Wallet Support**: Secure wallet architecture for token issuance
- **Testnet Integration**: Easy connection to XRP Ledger testnet for development and testing

### Security Features

- Private key management with seed-based wallet generation
- Transaction signing and validation
- Error handling with detailed logging
- Secure transaction submission with retry logic
