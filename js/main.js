/**
 * Main Application Entry Point
 * Initializes the Workout Creator application
 */
import { AppController } from './presentation/controllers/AppController.js';

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // Could send to error tracking service
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏋️ Initializing Workout Creator Application');
    
    try {
        // Create and start the application controller
        window.app = new AppController();
        
        // Wait for initialization to complete
        await window.app.init();
        
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        
        // Show fallback error message
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-fallback">
                    <h2>⚠️ Application Failed to Load</h2>
                    <p>We're sorry, but there was an error loading the application.</p>
                    <p>Please refresh the page and try again.</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }
});

// Add some utility functions to global scope for debugging
if (process.env.NODE_ENV === 'development') {
    window.debug = {
        getApp: () => window.app,
        getState: () => window.app?.getState(),
        navigateTo: (page) => window.app?.navigateTo(page),
        showModal: (content, options) => window.app?.showModal(content, options)
    };
}