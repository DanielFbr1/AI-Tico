const https = require('https');

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models?key=AIzaSyDrwazJkAoMRTULS4oA3ktTzUzmlP6uVTA',
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log(json.models.map(m => m.name));
            } else {
                console.log("No models found or error:", json);
            }
        } catch (e) {
            console.log("Error parsing:", data);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
