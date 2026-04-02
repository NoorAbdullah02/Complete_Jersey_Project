const fs = require('fs');
const path = './client/src/components/OrderForm.jsx';
let content = fs.readFileSync(path, 'utf8');

// The original file used Indigo (#6366f1, #818cf8, rgba(99, 102, 241...)) and Purple (#a855f7) and Pink (#ec4899)
// Let's replace them with CSS variables to match the beautiful new ICE theme natively

// Indigo / Blueish
content = content.replace(/#818cf8/g, 'var(--primary)');
content = content.replace(/#6366f1/g, 'var(--primary)');
content = content.replace(/#a5b4fc/g, 'var(--primary)');
content = content.replace(/rgba\(99,\s*102,\s*241,/g, 'rgba(0, 242, 254,'); 
content = content.replace(/rgba\(129,\s*140,\s*248,/g, 'rgba(0, 242, 254,');

// Purple / Pink
content = content.replace(/#a855f7/g, 'var(--secondary)');
content = content.replace(/#ec4899/g, 'var(--accent)');
content = content.replace(/rgba\(168,\s*85,\s*247,/g, 'rgba(79, 172, 254,');
content = content.replace(/rgba\(236,\s*72,\s*153,/g, 'rgba(180, 41, 249,');

// Replace Text
content = content.replace(/PILOT DATA/g, 'YOUR DETAILS');
content = content.replace(/START YOUR <span style={{ color: 'var\(--primary\)' }}>LEGACY<\/span>/g, 'DEPARTMENT <span style={{ color: "var(--primary)" }}>OF ICE</span>');
content = content.replace(/<i className="fas fa-shield-alt me-2"><\/i> ICE DEPARTMENT/g, '<i className="fas fa-shield-alt me-2"></i> Department of ICE');
content = content.replace(/ICE DEPARTMENT/g, 'Department of ICE');
content = content.replace(/UNIT \{index \+ 1\} CONFIG/g, 'JERSEY {index + 1}');
content = content.replace(/Mission Notes/g, 'Additional Notes');

// Update State
content = content.replace(/name: '', mobileNumber: '', email: '', notes: '',/g, "name: '', mobileNumber: '', email: '', notes: '', department: 'Department of ICE', batch: '',");
content = content.replace(/batch: '', size: ''/g, "size: ''");

// Fix validators array list
content = content.replace(/\['name', 'mobileNumber', 'email'\]\.forEach/g, "['name', 'mobileNumber', 'email', 'batch'].forEach");

fs.writeFileSync(path, content, 'utf8');
console.log('OrderForm updated successfully');
