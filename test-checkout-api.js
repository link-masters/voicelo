async function testCheckout() {
    try {
        const response = await fetch('http://localhost:3000/api/checkout', {
            method: 'POST',
            body: JSON.stringify({
                variantId: '1161786',
                userId: 'test-user',
                userEmail: 'test@example.com',
                userName: 'Test User'
            })
        });
        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Data:", data);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}
testCheckout();
