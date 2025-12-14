/**
 * PaperChat - Main Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// KaTeX CSS for LaTeX rendering
import 'katex/dist/katex.min.css';

// Puter.js is loaded via CDN script in index.html

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
