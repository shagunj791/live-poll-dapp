# Live Poll DApp (Stellar Soroban)

## Overview

A real-time decentralized polling application built on the Stellar Soroban smart contract platform.
Users can connect their wallets, initialize a poll, vote once, and see live results synchronized from the blockchain.

---

## Features

* Multi-wallet support:

  * Freighter (for signing transactions)
  * Stellar Wallets Kit (view-only / connection)

* Smart contract deployed on Stellar testnet

* Core functionality:

  * Initialize poll with custom question and options
  * Vote securely (one vote per wallet)
  * Fetch live results from contract

* Real-time updates:

  * Results auto-refresh every 5 seconds

* Transaction lifecycle tracking:

  * pending
  * success
  * error

* Error handling:

  * Wallet not installed
  * User rejected connection / transaction
  * Already voted
  * Poll not initialized

---

## Tech Stack

* React (Vite)
* Stellar Soroban SDK
* Freighter Wallet
* StellarWalletsKit

---

## Project Structure

```
src/
 ├── components/
 │    ├── WalletConnector.jsx
 │    ├── PollPanel.jsx
 │    ├── PollSetup.jsx
 │    ├── VotingPanel.jsx
 │    └── ResultsPanel.jsx
 │
 ├── services/
 │    ├── contractService.js
 │    └── walletService.js
```

---

## Setup Instructions

```bash
git clone https://github.com/<your-username>/live-poll-dapp.git
cd live-poll-dapp/frontend
npm install
npm run dev
```

---

## Smart Contract Details

* Network: Stellar Testnet

## Live Demo
https://live-poll-dapp.vercel.app

## Contract Address
CBQUA67LVRIKB74W4MIEG7UE2MXSZS6CAV26DSVZQMBKWAP4IQGH2UTU

## Sample Transaction
Initialize Poll TX:
15317260a33775cedbb65bcb5435e846d5e87488984261554ba8d893d2cacd01

Explorer:
https://stellar.expert/explorer/testnet/tx/15317260a33775cedbb65bcb5435e846d5e87488984261554ba8d893d2cacd01

## Screenshots

## Screenshots

### 1. Wallet Connected (Freighter) + Poll Initialized + TX Hash

![Freighter](./screenshots/freighter.png)

### 2. Multi-Wallet Support (Wallet Kit)

![Wallet Kit](./screenshots/wallet-kit.png)

### 3. Initial State (Connect Wallet Screen)

![Connect](./screenshots/connect-screen.png)


---

## Requirement Checklist

* ✔ Multi-wallet integration (Freighter + Wallet Kit)
* ✔ 3 error types handled
* ✔ Contract deployed on testnet
* ✔ Contract called from frontend
* ✔ Read + write contract data
* ✔ Real-time updates implemented
* ✔ Transaction status visible
* ✔ Minimum 2+ meaningful commits

---

## Notes

* Only Freighter wallet can sign transactions (initialize / vote)
* Other wallets can connect but cannot perform write operations
* Poll can only be initialized once per contract

---

## License

MIT License

