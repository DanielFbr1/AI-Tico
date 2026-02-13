
// verify_groq.js
// Run with: node --env-file=.env verify_groq.js

const apiKey = process.env.VITE_GROQ_API_KEY;
const url = 'https://api.groq.com/openai/v1/chat/completions';

console.log("Testing Groq API...");
console.log("API Key present:", !!apiKey);
if (apiKey) console.log("API Key start:", apiKey.substring(0, 10));

async function testGroq() {
    const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' }
    ];

    const body = {
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
        // omitting response_format
    };

    console.log("Sending request body:", JSON.stringify(body, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            console.error(`Error Status: ${response.status} ${response.statusText}`);
            const errData = await response.text();
            console.error("Error Body:", errData);
        } else {
            const data = await response.json();
            console.log("Success!");
            console.log("Response:", data.choices[0].message.content);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testGroq();
