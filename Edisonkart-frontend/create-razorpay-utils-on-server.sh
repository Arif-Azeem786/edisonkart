#!/bin/bash
# Run this ON the live server (SSH into 13.53.116.48) from ~/edison-kart-main/Edisonkart-frontend
# Usage: bash create-razorpay-utils-on-server.sh

FILE="src/utils/razorpayUtils.js"
mkdir -p src/utils
cat > "$FILE" << 'ENDOFFILE'
export const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
        if (document.getElementById('razorpay-sdk')) {
            return resolve(true);
        }

        const script = document.createElement('script');
        script.id = 'razorpay-sdk';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
    });
};

export const openRazorpayCheckout = async ({
    key,
    orderId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    onSuccess,
    onFailure
}) => {
    try {
        await loadRazorpayScript();

        if (!window.Razorpay) {
            throw new Error('Razorpay SDK not available');
        }

        const options = {
            key,
            amount: Math.round(Number(amount || 0) * 100),
            currency: 'INR',
            name: 'Edisonkart',
            description: 'Order Payment',
            order_id: orderId,
            prefill: {
                name: customerName,
                email: customerEmail,
                contact: customerPhone
            },
            theme: {
                color: '#2563eb'
            },
            handler: function (response) {
                if (onSuccess) {
                    onSuccess(response);
                }
            },
            modal: {
                ondismiss: function () {
                    if (onFailure) {
                        onFailure(new Error('Payment popup closed'));
                    }
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (error) {
        if (onFailure) {
            onFailure(error);
        }
    }
};
ENDOFFILE
echo "Created $FILE"
