const API_URL = import.meta.env.VITE_API_URL || '/api';

export const createOrder = async () => {
    try {
        const response = await fetch(`${API_URL}/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to create order');
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const verifyPayment = async (paymentData, teamData) => {
    try {
        const response = await fetch(`${API_URL}/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ...paymentData, teamData })
        });
        if (!response.ok) throw new Error('Payment verification failed');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
};
