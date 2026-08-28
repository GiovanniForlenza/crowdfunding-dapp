# Crowdfunding DApp - Data Security Project
 
A decentralized crowdfunding DApp on Ethereum. It lets users create fundraising campaigns
with a goal and a deadline: if the goal is reached before the deadline, the creator
withdraws the funds; otherwise, contributors get refunded. The rules are enforced by a
smart contract, with no trusted intermediary (a *trustless* model).
 
## Technologies
 
- **Solidity 0.8.24** for the smart contract
- **Hardhat** for compilation, testing, local blockchain, and deployment
- **OpenZeppelin** for `ReentrancyGuard` (reentrancy protection)
- **React + Vite** for the front-end
- **ethers.js** for front-end to contract communication
- **MetaMask** for signing transactions
## Project structure
 
```
crowdfunding-dapp/
├── contracts/
│   └── Crowdfunding.sol        # the smart contract
├── test/
│   └── Crowdfunding.js         # test suite
├── scripts/
│   └── deploy.js               # deployment script
├── hardhat.config.js
└── frontend/
    └── src/
        ├── App.jsx             # main interface
        └── contract.js         # contract address + ABI
```
 
## Prerequisites
 
- Node.js (version 18 or higher)
- MetaMask installed in the browser (Chrome recommended for development)
## Installation
 
From the project root:
 
```bash
npm install
```
 
And inside the front-end folder:
 
```bash
cd frontend
npm install
cd ..
```
 
## Running the project
 
Running the project requires **three terminals** open at the same time.
 
### Terminal 1: Local blockchain
 
```bash
npx hardhat node
```
 
Starts a local blockchain on `http://127.0.0.1:8545` with 20 test accounts, each holding
10,000 (fake) ETH. **Keep this terminal open.**
 
### Terminal 2: Deploy the contract
 
```bash
npx hardhat run scripts/deploy.js --network localhost
```
 
Prints the address where the contract was deployed. **Copy this address** and paste it into
`frontend/src/contract.js` in the `CONTRACT_ADDRESS` constant.
 
> Note: the address changes every time the blockchain restarts, so it must be updated each
> time. The ABI, on the other hand, stays the same until the contract is modified.
 
### Terminal 3: Front-end
 
```bash
cd frontend
npm run dev
```
 
Opens the app at `http://localhost:5173`.
 
## MetaMask setup
 
### 1. Add the local network
 
Network selector, then *Add network*, then *Add a network manually*:
 
- **Network name**: Hardhat Local
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency symbol**: ETH
### 2. Import the test accounts
 
From Terminal 1, copy the *Private Key* of two accounts (for example Account #0 and
Account #1). In MetaMask: *Import account*, then paste the private key.
 
> These keys are public and well known: use them **only** on the local blockchain, never on
> real networks.
 
### 3. Troubleshooting after a restart
 
If the balance looks wrong or transactions fail after restarting the blockchain:
MetaMask, then Settings, then Advanced, then *Clear activity tab data*.
 
## Running the tests
 
```bash
npx hardhat test
```
 
The suite verifies: contribution recording, the success scenario (withdrawal), the failure
scenario (refund), and the security checks (unauthorized access, withdrawal before the
deadline, contributions after the deadline).