# Resurrection Wallet
Resurrection Wallet is a frontend for [Phoenixd](https://github.com/phoenixrails/phoenixd), a lightweight, non-custodial Bitcoin wallet with some advanced features like auto-liquidity.

Features:
- [x] Autoinstall Phoenixd
- [x] Update balance and transactions automatically when a new payment is received / sent
- [x] Create invoice
- [ ] Use mainnet or testnet
- [ ] Open phoenixd.conf to read the password
- [ ] Pay bolt11 invoices
- [ ] Pay bol12 offers
- [ ] Scan QR Codes to pay invoices/offers
- [ ] Auto-update app
- [ ] Auto-update Phoenixd
- [ ] Manage the phoenixd process better
    - [ ] Detect if Phoenixd is running
    - [ ] Kill Phoenixd when the app is closed
- [ ] Detect WebSocket disconnections / manage reconnection

## Tech Stack
- Tauri (Rust)
- SvelteKit
- Tailwind

## Development environment
- Install Rust (https://www.rust-lang.org/tools/install)
- Run "npm run tauri dev"