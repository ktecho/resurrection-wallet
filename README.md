# Resurrection Wallet
Resurrection Wallet is a frontend for [Phoenixd](https://github.com/phoenixrails/phoenixd), a lightweight, non-custodial Bitcoin wallet with some advanced features like auto-liquidity.

Features:
- [x] Linux x86_64 support
- [ ] MacOS support
- [x] Autoinstall Phoenixd
- [x] Use mainnet or testnet
- [x] Read the password from phoenixd.conf
- [x] Update balance and transactions automatically when a new payment is received / sent
- [x] Create invoice and receive payments
- [x] Pay bolt11 invoices
- [x] Pay bolt12 offers
- [ ] Pay Lightning Addresses
- [ ] Pay onchain addresses
- [ ] Show fiat value in different currencies
- [ ] Scan QR Codes to pay invoices/offers ---> it works, but it's not very reliable
- [ ] Auto-update app
- [ ] Auto-update Phoenixd
- [ ] Manage the phoenixd process better
    - [ ] Detect if Phoenixd is running
    - [x] Kill Phoenixd when the app is closed
- [ ] Detect WebSocket disconnections / manage reconnection

Main Screen
![Main screen](screenshots/image1.png)

Transaction details
![Transaction details](screenshots/image2.png)

Setup Screen
![Setup Screen](screenshots/image3.png)
## Installation

Download the latest release from the [releases page](https://github.com/ktecho/resurrection-wallet/releases/latest) and run it. AppImages are recommended because they'll be easier to update to the next version.

It will prompt you to install Phoenixd automatically. If you already have Phoenixd installed, a new version will be downloaded and installed automatically, but you'll be able to use the same wallet, channels, etc.

## Tech Stack
- Tauri (Rust)
- SvelteKit
- Tailwind

## Development environment
(to be improved)
- Install Rust (https://www.rust-lang.org/tools/install)
- Install Tauri v2 dependencies:
  - Run "sudo apt install nodejs libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev"
- Run "cd src-tauri && cargo build && cd .."
- Run "yarn run tauri dev"
  - If you don't yarn, you can install it by running "sudo npm install --global yarn"

## Contribute

If you want to support the development of this project, you can donate to the following address:

**LN address**: btcremnant@getalby.com

**bolt12 offer**:  lno1zrxq8pjw7qjlm68mtp7e3yvxee4y5xrgjhhyf2fxhlphpckrvevh50u0qvu5fzc7mvw4lj7xyvhec0qzk8u0e34yf8veq0xrjheq2z7c7jtxzqsz6le74p3jsfps737g8z7lwa2djxz7t0aklfkwglj9yqng36uqanzqqvafpk7w3mq28hf8ncckcd6v50ux4h8xjl2d5qphjt6lut560ee3wyvp9ezfqpf7a5xxxgkqn9ste2z29vnhqwkw9fwdjr39dzck2jx0qj7ccaym7c0y5qerxe9l2a80svzeu9f25qqs8u2us22c7zjah9ulpehwjknulg

**Bitcoin onchain**:  bc1qxycgkfgnxhevts6uhhkzt46zfqzncgchpfgwlu
>>>>>>> 15f7779 (Adding contribution addresses)
