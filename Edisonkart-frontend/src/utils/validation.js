export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePhone = (phone) => {
    // Basic 10 digit check, allows generic formats if stripped
    const cleanPhone = phone.replace(/\D/g, '');
    return /^\d{10}$/.test(cleanPhone);
};

export const validatePincode = (pincode) => {
    return /^\d{6}$/.test(pincode);
};

export const validatePassword = (password) => {
    // Min 6 chars
    return password.length >= 6;
};

export const validateRequired = (value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
};
