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

* Contract Address:

```
CA3XTXBT653YKAYKEQEWBHO5JMBDNCTMCBCOWXWFSOS4JBBPSYWSSXWT
```

---

## Transaction Proof

Example contract interaction (vote / initialize):

```
https://stellar.expert/explorer/testnet/tx/<your-transaction-hash>
```

(Replace with your actual transaction link)

---

## Live Demo

```
[https://<your-vercel-app>.vercel.app](https://live-poll-dapp.vercel.app/)
```

---

## Screenshots

* Wallet connection options
* Poll initialization UI
* Voting and live results

(Add screenshots here)

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

