const http = require('http');

http.get('http://localhost:5000/api/restaurants', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const restaurants = JSON.parse(data);
        const vaani = restaurants.find(r => r.name === 'Vaani Vilas');
        console.log(JSON.stringify(vaani, null, 2));
    });
}).on('error', (err) => {
    console.error('Error: ' + err.message);
});
