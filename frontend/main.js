import './style.css';
import { initScene } from './src/three-scene.js';
import { initAnimations } from './src/animations.js';
import { createOrder, verifyPayment } from './src/api.js';

// Initialize 3D Scene
initScene();

// Initialize Animations
initAnimations();

// Handle Form Submission
const form = document.getElementById('registration-form');
const errorMsg = document.getElementById('error-msg');
const successScreen = document.getElementById('success-screen');
const regIdDisplay = document.getElementById('reg-id-display');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');

    // 1. Gather Data
    const formData = new FormData(form);
    const teamData = Object.fromEntries(formData.entries());

    // 2. Create Order on Backend
    try {
        const order = await createOrder();
        if (!order) throw new Error("Could not initiate payment.");

        // 3. Open Razorpay Checkout
        const options = {
            key: "rzp_test_YourKeyId", // PLACEHOLDER: Replace with your actual Test Key ID
            amount: order.amount,
            currency: order.currency,
            name: "FrontEnd Domination",
            description: "Team Registration Fee",
            order_id: order.id,
            handler: async function (response) {
                // 4. Verify Payment on Backend
                try {
                    const verification = await verifyPayment(response, teamData);
                    if (verification.status === 'success') {
                        // Show Success Screen
                        regIdDisplay.innerText = verification.registrationId;
                        form.reset();
                        successScreen.classList.remove('hidden');
                        successScreen.classList.add('flex');
                    } else {
                        throw new Error("Payment verification failed.");
                    }
                } catch (err) {
                    console.error(err);
                    alert("Payment failed or verification failed. Please try again.");
                }
            },
            prefill: {
                name: teamData.leaderName,
                email: teamData.leaderEmail,
                contact: teamData.leaderPhone
            },
            theme: {
                color: "#00f7ff"
            }
        };

        const rzp1 = new Razorpay(options);
        rzp1.open();

    } catch (err) {
        console.error(err);
        errorMsg.innerText = err.message || "An error occurred.";
        errorMsg.classList.remove('hidden');
    }
});
