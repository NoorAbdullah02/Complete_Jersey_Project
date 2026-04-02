const fs = require('fs');
const path = './client/src/components/OrderForm.jsx';
let content = fs.readFileSync(path, 'utf8');

// Strip out ALL the onFocus inline styles that cause frame drops on mobile React
content = content.replace(/onFocus=\{\(e\) => \{ e\.target\.style\.background = '[^']+'; e\.target\.style\.borderColor = 'var\(--primary\)'; e\.target\.style\.boxShadow = '[^']+'; \}\}/g, "");
content = content.replace(/onFocus=\{\(e\) => \{ e\.target\.style\.background = '[^']+'; e\.target\.style\.borderColor = 'var\(--primary\)'; \}\}/g, "");

// Strip out ALL the onBlur inline styles that cause frame drops, keeping ONLY the handleBlur callback
content = content.replace(/onBlur=\{\(e\) => \{\s*e\.target\.style\.background = '[^']+';\s*e\.target\.style\.borderColor = '[^']+';\s*e\.target\.style\.boxShadow = 'none';\s*handleBlur\('([^']+)', e\.target\.value\);\s*\}\}/g, "onBlur={(e) => handleBlur('$1', e.target.value)}");

content = content.replace(/onBlur=\{\(e\) => \{\s*e\.target\.style\.background = '[^']+';\s*e\.target\.style\.borderColor = '[^']+';\s*e\.target\.style\.boxShadow = 'none';\s*handleBlur\('([^']+)', e\.target\.value, item\.id\);\s*\}\}/g, "onBlur={(e) => handleBlur('$1', e.target.value, item.id)}");

// For the mission notes
content = content.replace(/onBlur=\{\(e\) => \{ e\.target\.style\.background = '[^']+'; e\.target\.style\.borderColor = '[^']+'; \}\}/g, "");

fs.writeFileSync(path, content, 'utf8');
console.log('OrderForm inputs optimized for buttery smooth performance!');
