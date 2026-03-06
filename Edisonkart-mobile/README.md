# EdisonKart Mobile (Expo)

React Native (Expo) app for EdisonKart e-commerce. Uses the **same backend** as the web app.

## Features (aligned with web)

- **Home** – Hero, categories, featured products
- **Shop** – Product listing with search
- **Product detail** – Add to cart, Buy now
- **Cart** – List, update quantity, remove, checkout
- **Checkout** – Address selection, place order
- **Orders** – List and order detail
- **Profile** – Name, email, addresses
- **Wishlist** – Saved products
- **Import product** – Paste URL (Amazon, Flipkart, etc.) to import
- **Support chat** – Chatbot (same backend `/api/chat`)
- **Auth** – Login, Register, OTP verification

## Setup

1. **Backend**  
   Run the existing Node backend (e.g. `cd Edisonkart-backend && npm run dev`) so the API is available.

2. **API URL**  
   - **Emulator:** `http://localhost:5000` or `http://10.0.2.2:5000` (Android emulator)
   - **Physical device:** Use your machine’s LAN IP, e.g. `http://192.168.1.5:5000`

   Set in the project root:
   - Create `.env` with:
     ```env
     EXPO_PUBLIC_API_URL=http://YOUR_IP_OR_HOST:5000
     ```
   - Or in `app.json` under `expo.extra`:
     ```json
     "apiHost": "http://192.168.1.5:5000"
     ```
   - Or edit `src/config.js` and set `API_HOST` directly.

3. **CORS**  
   Ensure the backend allows requests from the Expo app (origin or disabled for dev).

4. **Install and run**
   ```bash
   cd Edisonkart-mobile
   npm install
   npx expo start
   ```
   Then press `a` for Android or `i` for iOS simulator, or scan the QR code on a device (Expo Go).

## Project structure

- `app/` – Expo Router screens (file-based routes)
  - `(tabs)/` – Home, Shop, Cart, Account
  - `(auth)/` – Login, Register, Verify OTP
  - `product/[slug]` – Product detail
  - `checkout`, `orders`, `order/[id]`, `profile`, `wishlist`, `import-product`, `chat`
- `src/` – API client, config, services, stores (auth, cart)

## Build for Play Store

```bash
npx expo prebuild
cd android && ./gradlew bundleRelease
```

Configure signing and `app.json` (version, bundle id) for release.
