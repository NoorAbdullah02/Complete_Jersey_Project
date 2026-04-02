const fs = require('fs');
const path = './client/src/styles/main.css';
let content = fs.readFileSync(path, 'utf8');

// Replace oranges with ice blue in CSS
content = content.replace(/#f0a500/g, '#00f3ff');
content = content.replace(/#ff6b35/g, '#0088ff');
content = content.replace(/rgba\(240,\s*165,\s*0,/g, 'rgba(0, 243, 255,');
content = content.replace(/rgba\(255,\s*107,\s*53,/g, 'rgba(0, 136, 255,');

// Adjust particle colors
content = content.replace(/background: rgba\(240, 165, 0, 0.8\);/g, 'background: rgba(0, 243, 255, 0.8);');
content = content.replace(/background: rgba\(255, 107, 53, 0.7\);/g, 'background: rgba(0, 136, 255, 0.7);');

// Save back
fs.writeFileSync(path, content, 'utf8');
console.log('Theme updated in main.css');
