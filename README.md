# Resurrection Wallet
Resurrection Wallet is a frontend for [Phoenixd](https://github.com/phoenixrails/phoenixd), a lightweight, non-custodial Bitcoin wallet with some advanced features like auto-liquidity.

Features:
- [x] Autoinstall Phoenixd
- [x] Use mainnet or testnet
- [x] Update balance and transactions automatically when a new payment is received / sent
- [x] Create invoice and receive payments
- [x] Pay bolt11 invoices
- [x] Pay bol12 offers
- [ ] Pay Lightning Addresses
- [ ] Pay onchain addresses
- [ ] Show fiat value in different currencies
- [ ] Open phoenixd.conf to read the password
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
- Run "sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev"
- Run "cd src-tauri && cargo build && cd .."
- Run "npm run tauri dev"
