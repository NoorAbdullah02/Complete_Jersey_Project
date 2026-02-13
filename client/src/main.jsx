import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/main.css';

// Bootstrap JS for modals
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
