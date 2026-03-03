#!/bin/bash
# Run this on the Ubuntu server from: ~/edison-kart-main/Edisonkart-frontend

set -e
cd ~/edison-kart-main/Edisonkart-frontend

# Replace Cashfree heading with Razorpay
sed -i "s/Secure Payment via Cashfree/Secure Payment via Razorpay/g" src/components/pages/Checkout.jsx

# Replace Cashfree description with Razorpay description (use | as sed delimiter to avoid escaping /)
sed -i 's|You will be redirected to Cashfree'"'"'s secure payment gateway to complete your transaction utilizing 128-bit encryption.|You will complete your payment securely using Razorpay UPI / Cards / Netbanking with industry-standard encryption.|g' src/components/pages/Checkout.jsx

echo "Done. Verifying no Cashfree left:"
grep -n "Cashfree" src/components/pages/Checkout.jsx || echo "No Cashfree found - OK."
