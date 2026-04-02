const fs = require('fs');
const path = './client/src/components/OrderForm.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace oranges with ice blue
content = content.replace(/#f0a500/g, '#00f3ff');
content = content.replace(/#ff6b35/g, '#0088ff');
content = content.replace(/rgba\(240,\s*165,\s*0,/g, 'rgba(0, 243, 255,');
content = content.replace(/rgba\(255,\s*107,\s*53,/g, 'rgba(0, 136, 255,');

// Adjust gradient of buttons to look cooler
content = content.replace(/linear-gradient\(135deg, #00f3ff 0%, #0088ff 100%\)/g, 'linear-gradient(135deg, #00f3ff 0%, #0088ff 100%)');

// Update Department to 'Department of ICE'
content = content.replace(/department: 'ICE'/g, "department: 'Department of ICE'");

// Save back
fs.writeFileSync(path, content, 'utf8');
console.log('Theme updated in OrderForm.jsx');
