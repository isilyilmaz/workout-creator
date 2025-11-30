/**
 * Navigation Configuration
 * Centralized configuration for all application routes and navigation
 */

import { WorkoutCreatorAssistantPage } from '../presentation/pages/WorkoutCreatorAssistantPage.js';
import { ExerciseLibraryPage } from '../presentation/pages/ExerciseLibraryPage.js';
import { BMICalculatorPage } from '../presentation/pages/BMICalculatorPage.js';

/**
 * Navigation route types
 */
export const RouteTypes = {
    CONTENT: 'content',    // HTML content loaded via ContentLoader
    COMPONENT: 'component', // JavaScript component classes
    STATIC: 'static'       // Static pages with predefined content
};

/**
 * Main navigation configuration
 * Each route defines how to handle navigation to that page
 */
export const NavigationConfig = {
    // Main pages
    home: {
        type: RouteTypes.CONTENT,
        path: 'home.html',
        title: 'Workout Creator - Home',
        requiresAuth: false,
        setupEvents: 'home'
    },
    
    'workout-creator': {
        type: RouteTypes.CONTENT,
        path: 'workout-creator.html',
        title: 'Workout Creator',
        requiresAuth: false,
        setupEvents: 'workout-creator'
    },
    
    'workout-creator-assistant': {
        type: RouteTypes.COMPONENT,
        component: WorkoutCreatorAssistantPage,
        title: 'Workout Creator Assistant',
        requiresAuth: false
    },
    
    // User pages
    login: {
        type: RouteTypes.CONTENT,
        path: 'login.html',
        title: 'Login - Workout Creator',
        requiresAuth: false,
        setupEvents: 'login'
    },
    
    profile: {
        type: RouteTypes.CONTENT,
        path: 'profile-information.html',
        title: 'Profile - Workout Creator',
        requiresAuth: true,
        setupEvents: 'profile'
    },
    
    // Tool pages
    'exercise-library': {
        type: RouteTypes.COMPONENT,
        component: ExerciseLibraryPage,
        title: 'Exercise Library',
        requiresAuth: false
    },
    
    'bmi-calculator': {
        type: RouteTypes.COMPONENT,
        component: BMICalculatorPage,
        title: 'BMI Calculator',
        requiresAuth: false
    },
    
    // Static pages
    help: {
        type: RouteTypes.STATIC,
        title: 'Help - Workout Creator',
        content: {
            title: 'Help',
            description: 'Help and documentation for using the Workout Creator.'
        },
        requiresAuth: false
    },
    
    about: {
        type: RouteTypes.STATIC,
        title: 'About - Workout Creator',
        content: {
            title: 'About',
            description: 'About the Workout Program Creator application.'
        },
        requiresAuth: false
    }
};

/**
 * Default route when no specific route is requested
 */
export const DEFAULT_ROUTE = 'home';

/**
 * Route to redirect to when authentication is required
 */
export const LOGIN_ROUTE = 'login';

/**
 * Get navigation config for a specific route
 * @param {string} routeName - Name of the route
 * @returns {Object|null} Route configuration or null if not found
 */
export function getRouteConfig(routeName) {
    return NavigationConfig[routeName] || null;
}

/**
 * Get all available routes
 * @returns {Array<string>} Array of route names
 */
export function getAllRoutes() {
    return Object.keys(NavigationConfig);
}

/**
 * Check if route requires authentication
 * @param {string} routeName - Name of the route
 * @returns {boolean} True if authentication is required
 */
export function routeRequiresAuth(routeName) {
    const config = getRouteConfig(routeName);
    return config ? config.requiresAuth : false;
}

/**
 * Get route title
 * @param {string} routeName - Name of the route
 * @returns {string} Page title or default
 */
export function getRouteTitle(routeName) {
    const config = getRouteConfig(routeName);
    return config ? config.title : 'Workout Creator';
}

/**
 * Navigation menu configuration
 * Defines which routes appear in navigation menus and their display properties
 */
export const NavigationMenu = {
    header: [
        {
            route: 'home',
            label: 'Home',
            icon: '🏠',
            order: 1
        },
        {
            route: 'workout-creator',
            label: 'Workout Creator',
            icon: '💪',
            order: 2
        },
        {
            route: 'workout-creator-assistant',
            label: 'Workout Assistant',
            icon: '🤖',
            order: 3
        },
        {
            route: 'exercise-library',
            label: 'Exercise Library',
            icon: '📚',
            order: 4
        },
        {
            route: 'bmi-calculator',
            label: 'BMI Calculator',
            icon: '⚖️',
            order: 5
        }
    ],
    
    footer: [
        {
            route: 'about',
            label: 'About',
            order: 1
        },
        {
            route: 'help',
            label: 'Help',
            order: 2
        }
    ],
    
    user: [
        {
            route: 'profile',
            label: 'Profile',
            icon: '👤',
            requiresAuth: true,
            order: 1
        },
        {
            route: 'login',
            label: 'Login',
            icon: '🔐',
            requiresAuth: false,
            hideWhenLoggedIn: false,
            order: 2
        }
    ]
};

/**
 * Get menu items for a specific menu section
 * @param {string} section - Menu section (header, footer, user)
 * @param {boolean} isLoggedIn - Current authentication status
 * @returns {Array} Filtered and sorted menu items
 */
export function getMenuItems(section, isLoggedIn = false) {
    const items = NavigationMenu[section] || [];
    
    return items
        .filter(item => {
            // Filter based on authentication requirements
            if (item.requiresAuth && !isLoggedIn) {
                return false;
            }
            if (item.hideWhenLoggedIn && isLoggedIn) {
                return false;
            }
            return true;
        })
        .sort((a, b) => (a.order || 999) - (b.order || 999));
}