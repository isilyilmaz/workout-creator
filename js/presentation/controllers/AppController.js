/**
 * Application Controller
 * Main controller for handling routing and application state
 */
import { ContentLoader } from './ContentLoader.js';
import { UserService } from '../../application/services/UserService.js';
import { WorkoutManager } from './WorkoutManager.js';
import { 
    NavigationConfig, 
    RouteTypes, 
    DEFAULT_ROUTE, 
    LOGIN_ROUTE,
    getRouteConfig,
    routeRequiresAuth,
    getRouteTitle
} from '../../config/NavigationConfig.js';

export class AppController {
    constructor() {
        this.contentLoader = new ContentLoader();
        this.userService = new UserService();
        this.workoutManager = new WorkoutManager();
        this.currentPage = null;
        this.currentContent = null;
        
        this.appState = {
            currentUser: null,
            language: 'en',
            theme: 'dark',
            isLoggedIn: false
        };

        this.loadingOverlay = document.getElementById('loading-overlay');
        this.modalContainer = document.getElementById('modal-container');
        this.mainContent = document.getElementById('main-content');

        // Don't call init here - it's called from main.js
    }

    /**
     * Initialize the application
     */
    async init() {
        this.setupEventListeners();
        this.setupAuthenticationCallbacks();
        this.loadUserPreferences();
        
        // Wait a bit for the UserService to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.handleInitialRoute();
    }

    /**
     * Set up authentication callbacks
     */
    setupAuthenticationCallbacks() {
        this.userService.onAuthChange((isLoggedIn, user) => {
            this.appState.isLoggedIn = isLoggedIn;
            this.appState.currentUser = user;
            this.updateHeaderAuthButton();
            this.saveUserPreferences();
        });
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.navigateTo(page);
            }
        });

        // Language selector
        document.addEventListener('click', (e) => {
            if (e.target.matches('.lang-btn')) {
                e.preventDefault();
                const lang = e.target.getAttribute('data-lang');
                this.setLanguage(lang);
            }
        });

        // Browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'home';
            this.navigateTo(page, false);
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target === this.modalContainer || e.target.matches('.modal-close')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Handle initial route based on URL hash
     */
    handleInitialRoute() {
        const hash = window.location.hash.substr(1);
        const page = hash || 'home';
        this.navigateTo(page, false);
    }

    /**
     * Navigate to a page
     */
    async navigateTo(pageName, updateHistory = true) {
        try {
            console.log(`Navigating to page: ${pageName}`);
            
            // Get route configuration
            const routeConfig = getRouteConfig(pageName);
            if (!routeConfig) {
                console.warn(`Route "${pageName}" not found, redirecting to default`);
                if (pageName !== DEFAULT_ROUTE) {
                    return this.navigateTo(DEFAULT_ROUTE, updateHistory);
                }
                throw new Error(`Default route "${DEFAULT_ROUTE}" not found in configuration`);
            }

            // Check authentication requirements
            if (routeConfig.requiresAuth && !this.appState.isLoggedIn) {
                console.log(`Route "${pageName}" requires authentication, redirecting to login`);
                return this.navigateTo(LOGIN_ROUTE, updateHistory);
            }
            
            // Show loading
            this.showLoading();

            // Update navigation state
            this.updateNavigationState(pageName);

            // Update URL
            if (updateHistory) {
                const url = pageName === DEFAULT_ROUTE ? '#' : `#${pageName}`;
                window.history.pushState({ page: pageName }, '', url);
            }

            // Cleanup current page/content
            this.cleanup();

            // Route based on type
            switch (routeConfig.type) {
                case RouteTypes.CONTENT:
                    console.log(`Loading content page: ${routeConfig.path}`);
                    const result = await this.loadContentPage(pageName, routeConfig);
                    if (!result.success) {
                        console.error('Failed to load content page:', result.error);
                    }
                    break;
                    
                case RouteTypes.COMPONENT:
                    console.log(`Loading component page: ${pageName}`);
                    await this.loadComponentPage(pageName, routeConfig);
                    break;
                    
                case RouteTypes.STATIC:
                    console.log(`Loading static page: ${pageName}`);
                    this.loadStaticPage(pageName, routeConfig);
                    break;
                    
                default:
                    throw new Error(`Unknown route type: ${routeConfig.type}`);
            }

            // Hide loading
            this.hideLoading();

            // Update document title
            this.updateTitle(pageName);

            console.log(`Successfully navigated to: ${pageName}`);

        } catch (error) {
            console.error('Error navigating to page:', error);
            this.hideLoading();
            this.showError('Failed to load page. Please try again.');
        }
    }

    /**
     * Load content-based page
     */
    async loadContentPage(pageName, routeConfig) {
        const result = await this.contentLoader.loadAndInject(routeConfig.path, this.mainContent);
        
        if (result.success) {
            this.currentContent = pageName;
            if (routeConfig.setupEvents) {
                this.setupContentPageEvents(routeConfig.setupEvents);
            }
        }
        
        return result;
    }

    /**
     * Load component-based page
     */
    async loadComponentPage(pageName, routeConfig) {
        const PageClass = routeConfig.component;
        
        if (typeof PageClass === 'function') {
            this.currentPage = new PageClass(this.mainContent, this);
            if (typeof this.currentPage.render === 'function') {
                await this.currentPage.render();
            }
        } else {
            throw new Error(`Invalid component for route: ${pageName}`);
        }
    }

    /**
     * Load static page
     */
    loadStaticPage(pageName, routeConfig) {
        this.renderStaticPage(routeConfig.content);
    }

    /**
     * Set up event listeners for content pages
     */
    setupContentPageEvents(pageName) {
        switch (pageName) {
            case 'login':
                this.setupLoginEvents();
                break;
            case 'profile':
                this.setupProfileEvents();
                break;
            case 'home':
                this.setupHomeEvents();
                break;
            case 'workout-creator':
                this.setupWorkoutCreatorEvents();
                break;
        }
    }

    /**
     * Clean up current page/content
     */
    cleanup() {
        if (this.currentPage && typeof this.currentPage.destroy === 'function') {
            this.currentPage.destroy();
        }
        this.currentPage = null;
        this.currentContent = null;
    }

    /**
     * Set up login page events
     */
    setupLoginEvents() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Demo login buttons
        document.querySelectorAll('.demo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDemoLogin(e));
        });
    }

    /**
     * Set up profile page events
     */
    setupProfileEvents() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.showEditProfile());
        }

        // Load profile data
        this.loadProfileData();
    }

    /**
     * Set up home page events
     */
    setupHomeEvents() {
        // Initialize workout management using shared WorkoutManager
        this.workoutManager.initialize();
    }
    /**
     * Set up workout creator page events
     */
    setupWorkoutCreatorEvents() {
        // Initialize workout management using shared WorkoutManager
        this.workoutManager.initialize();
    }
    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username')?.value;
        const password = document.getElementById('login-password')?.value;
        const rememberMe = document.getElementById('remember-me')?.checked;
        const errorDiv = document.getElementById('login-error');
        
        if (!username || !password) {
            this.showLoginError('Please enter both username and password');
            return;
        }

        try {
            this.showLoading();
            const result = await this.userService.authenticate(username, password, rememberMe);
            
            if (result.success) {
                this.showSuccess('Login successful!');
                this.navigateTo('home');
            } else {
                this.showLoginError(result.error);
            }
        } catch (error) {
            this.showLoginError('Login failed. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle demo login
     */
    async handleDemoLogin(e) {
        const username = e.target.getAttribute('data-username');
        const password = e.target.getAttribute('data-password');
        
        if (username && password) {
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = password;
            
            // Auto-submit
            const form = document.getElementById('login-form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            const result = await this.userService.logout();
            if (result.success) {
                this.showSuccess('Logged out successfully');
                this.navigateTo('home');
            }
        } catch (error) {
            this.showError('Logout failed');
        }
    }

    /**
     * Show login error
     */
    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.querySelector('.error-message').textContent = message;
        }
    }

    /**
     * Load profile data
     */
    loadProfileData() {
        const user = this.userService.getCurrentUser();
        if (!user) {
            this.navigateTo('login');
            return;
        }

        // Update profile information
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('profile-name', this.userService.getUserDisplayName());
        updateElement('profile-email', user.email);
        updateElement('display-name', user.namesurname || user.username);
        updateElement('display-username', user.username);
        updateElement('display-email', user.email);
        updateElement('display-role', this.userService.getUserRole());

        // Update avatar
        const avatarInitials = document.getElementById('avatar-initials');
        if (avatarInitials) {
            avatarInitials.textContent = this.userService.getUserInitials();
        }

        // Update user role badge
        const roleElement = document.getElementById('user-role');
        if (roleElement) {
            roleElement.textContent = this.userService.getUserRole();
            roleElement.className = `user-badge ${this.userService.isAdmin() ? 'admin' : 'user'}`;
        }

        // Load subscription info
        this.loadSubscriptionData();

        // Show admin section if user is admin
        if (this.userService.isAdmin()) {
            const adminSection = document.getElementById('admin-section');
            if (adminSection) adminSection.style.display = 'block';
        }
    }

    /**
     * Load subscription data
     */
    loadSubscriptionData() {
        const subscriptionInfo = this.userService.getSubscriptionInfo();
        if (!subscriptionInfo) return;

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('subscription-text', subscriptionInfo.isActive ? 'Active' : 'Inactive');
        updateElement('subscription-start', subscriptionInfo.startDate);
        updateElement('subscription-end', subscriptionInfo.endDate);
        updateElement('renewal-fee', subscriptionInfo.renewalFee);
        updateElement('free-trial-status', subscriptionInfo.freeTrial ? 'Yes' : 'No');

        // Update status indicator
        const statusIndicator = document.getElementById('subscription-status');
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${subscriptionInfo.isActive ? 'active' : 'inactive'}`;
        }
    }

    /**
     * Update header authentication button
     */
    updateHeaderAuthButton() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        // Remove existing auth button
        const existingBtn = headerActions.querySelector('.auth-btn');
        if (existingBtn) {
            existingBtn.remove();
        }

        if (this.userService.isLoggedIn()) {
            // Show profile button
            const profileBtn = document.createElement('button');
            profileBtn.className = 'auth-btn profile-btn';
            profileBtn.innerHTML = `
                <span class="profile-avatar">${this.userService.getUserInitials()}</span>
                <span class="profile-name">${this.userService.getUserDisplayName()}</span>
            `;
            profileBtn.addEventListener('click', () => this.navigateTo('profile'));
            
            // Insert before language selector
            const langSelector = headerActions.querySelector('.language-selector');
            headerActions.insertBefore(profileBtn, langSelector);
        } else {
            // Show login button
            const loginBtn = document.createElement('button');
            loginBtn.className = 'auth-btn login-btn';
            loginBtn.textContent = 'Login';
            loginBtn.addEventListener('click', () => this.navigateTo('login'));
            
            // Insert before language selector
            const langSelector = headerActions.querySelector('.language-selector');
            headerActions.insertBefore(loginBtn, langSelector);
        }
    }

    /**
     * Handle save workout as JSON
     */
    handleSaveWorkout(e) {
        try {
            const workoutName = this.workoutData.name || 'My Workout';
            const dataStr = JSON.stringify(this.workoutData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${workoutName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            link.click();
            
            this.showSuccess(`Workout "${workoutName}" saved successfully!`);
        } catch (error) {
            console.error('Error saving workout:', error);
            this.showError('Failed to save workout');
        }
    }

    /**
     * Handle load workout from JSON file
     */
    handleLoadWorkout(e) {
        console.log('Load workout button clicked');
        const fileInput = document.getElementById('workout-file-input');
        if (fileInput) {
            console.log('File input found, triggering click');
            fileInput.click();
        } else {
            console.error('File input not found');
        }
    }

    /**
     * Handle day selection
     */
    handleDaySelection(e) {
        const dayCard = e.target.closest('.day-card');
        if (!dayCard) return;

        const day = dayCard.getAttribute('data-day');
        this.selectedDay = day;

        // Update active day card
        document.querySelectorAll('.day-card').forEach(card => card.classList.remove('active'));
        dayCard.classList.add('active');

        // Show selected day section
        const selectedDaySection = document.getElementById('selected-day-section');
        if (selectedDaySection) {
            selectedDaySection.style.display = 'block';
            this.renderWorkoutDay(day);
        }
    }

    /**
     * Render workout day content
     */
    renderWorkoutDay(day) {
        const dayTitle = document.getElementById('selected-day-title');
        const workoutBuilder = document.getElementById('workout-builder');
        
        if (dayTitle) {
            dayTitle.textContent = `${day.charAt(0).toUpperCase() + day.slice(1)} Workout`;
        }

        if (workoutBuilder) {
            const dayData = this.workoutData.days[day] || [];
            
            if (dayData.length === 0) {
                workoutBuilder.innerHTML = `
                    <div class="empty-workout">
                        <p>No exercises added yet. Click "Add Exercise" or "Add Rest" to get started!</p>
                    </div>
                `;
            } else {
                workoutBuilder.innerHTML = dayData.map((item, index) => {
                    if (item.type === 'exercise') {
                        return this.renderExerciseItem(item, index);
                    } else if (item.type === 'rest') {
                        return this.renderRestItem(item, index);
                    }
                }).join('');
            }
        }

        // Update muscle group visualization
        this.updateMuscleGroupVisualization(day);
    }

    /**
     * Render exercise item HTML
     */
    renderExerciseItem(exercise, index) {
        const details = [];
        if (exercise.sets && exercise.reps) {
            details.push(`${exercise.sets} sets × ${exercise.reps} reps`);
        }
        if (exercise.weight && exercise.weightUnit) {
            details.push(`${exercise.weight}${exercise.weightUnit}`);
        }
        if (exercise.duration && exercise.durationUnit) {
            details.push(`${exercise.duration} ${exercise.durationUnit}`);
        }
        if (exercise.distance && exercise.distanceUnit) {
            details.push(`${exercise.distance} ${exercise.distanceUnit}`);
        }
        if (exercise.calories) {
            details.push(`${exercise.calories} kcal`);
        }

        return `
            <div class="exercise-item" data-index="${index}">
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-details">
                        ${details.join(' • ')}
                    </div>
                </div>
                <div class="exercise-actions">
                    <button class="exercise-action-btn edit-btn" title="Edit Exercise">✎</button>
                    <button class="exercise-action-btn delete-btn" title="Delete Exercise">✕</button>
                </div>
            </div>
        `;
    }

    /**
     * Render rest item HTML
     */
    renderRestItem(rest, index) {
        const duration = rest.minutes > 0 ? `${rest.minutes}:${rest.seconds.toString().padStart(2, '0')} min` : `${rest.seconds} sec`;
        
        return `
            <div class="rest-item" data-index="${index}">
                <div class="rest-info">
                    <span class="rest-icon">💤</span>
                    <div class="rest-details">
                        <h4>Rest - ${duration}</h4>
                        <p>${rest.type} rest${rest.notes ? ' • ' + rest.notes : ''}</p>
                    </div>
                </div>
                <div class="exercise-actions">
                    <button class="exercise-action-btn delete-btn" title="Delete Rest Period">✕</button>
                </div>
            </div>
        `;
    }

    /**
     * Handle add exercise
     */
    handleAddExercise(e) {
        if (!this.selectedDay) {
            this.showError('Please select a day first');
            return;
        }

        this.showExerciseModal();
    }

    /**
     * Show exercise modal
     */
    showExerciseModal() {
        const modal = document.getElementById('exercise-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Reset form
            document.getElementById('equipment-select').value = '';
            document.getElementById('exercise-search').value = '';
            document.getElementById('exercise-select').innerHTML = '';
            document.getElementById('sets-input').value = '3';
            document.getElementById('reps-input').value = '12';
            document.getElementById('weight-input').value = '';
            document.getElementById('duration-input').value = '';
            document.getElementById('distance-input').value = '';
            document.getElementById('pace-input').value = '';
            document.getElementById('calorie-estimate').textContent = '0 kcal';
            
            // Hide video preview
            document.getElementById('video-preview').style.display = 'none';
        }
    }

    /**
     * Update exercise options based on equipment
     */
    updateExerciseOptions(equipment) {
        const exerciseSelect = document.getElementById('exercise-select');
        const exercises = this.exerciseDatabase[equipment] || [];
        
        exerciseSelect.innerHTML = exercises.map(exercise => 
            `<option value="${exercise}">${exercise}</option>`
        ).join('');
        
        // Clear search
        document.getElementById('exercise-search').value = '';
    }

    /**
     * Filter exercises based on search
     */
    filterExercises(searchTerm) {
        const equipment = document.getElementById('equipment-select').value;
        if (!equipment) return;
        
        const exercises = this.exerciseDatabase[equipment] || [];
        const filteredExercises = exercises.filter(exercise => 
            exercise.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const exerciseSelect = document.getElementById('exercise-select');
        exerciseSelect.innerHTML = filteredExercises.map(exercise => 
            `<option value="${exercise}">${exercise}</option>`
        ).join('');
    }

    /**
     * Update exercise preview
     */
    updateExercisePreview(exerciseName) {
        if (!exerciseName) return;
        
        // Show video preview (placeholder implementation)
        const videoPreview = document.getElementById('video-preview');
        if (videoPreview) {
            videoPreview.style.display = 'block';
            // In a real implementation, you would load actual exercise videos/GIFs
            document.getElementById('exercise-gif').src = `https://via.placeholder.com/300x200/333/fff?text=${encodeURIComponent(exerciseName)}`;
        }
    }

    /**
     * Calculate estimated calories
     */
    calculateCalories() {
        const sets = parseInt(document.getElementById('sets-input').value) || 0;
        const reps = parseInt(document.getElementById('reps-input').value) || 0;
        const weight = parseFloat(document.getElementById('weight-input').value) || 0;
        const duration = parseInt(document.getElementById('duration-input').value) || 0;
        
        // Simple calorie calculation (this would be more sophisticated in a real app)
        let calories = 0;
        if (sets && reps) {
            calories = sets * reps * 0.5; // Base calorie estimate
            if (weight > 0) {
                calories += weight * 0.1; // Weight factor
            }
        }
        if (duration > 0) {
            calories += duration * 0.2; // Duration factor
        }
        
        calories = Math.round(calories);
        document.getElementById('calorie-estimate').textContent = `${calories} kcal`;
        
        return calories;
    }

    /**
     * Render exercises for a specific day
     */
    renderDayExercises(day) {
        const exerciseContainer = document.getElementById(`${day}-exercises`);
        if (!exerciseContainer) {
            console.warn(`Exercise container not found for day: ${day}`);
            return;
        }

        const exercises = this.workoutData.days[day] || [];
        console.log(`Rendering ${exercises.length} exercises for ${day}:`, exercises);
        
        exerciseContainer.innerHTML = exercises.map((exercise, index) => {
            if (exercise.type === 'exercise') {
                return this.createExerciseCardHTML(exercise, index);
            } else if (exercise.type === 'rest') {
                return this.createRestCardHTML(exercise, index);
            } else {
                // Handle exercises without explicit type (assume exercise)
                return this.createExerciseCardHTML({...exercise, type: 'exercise'}, index);
            }
        }).filter(html => html).join('');
    }

    /**
     * Create exercise card HTML
     */
    createExerciseCardHTML(exercise, index) {
        const repsText = exercise.reps === 'max' ? 'max reps' : `${exercise.reps} reps`;
        return `
            <div class="exercise-card" data-index="${index}">
                <button class="remove-exercise">×</button>
                <div class="exercise-name">${exercise.name}</div>
                <div class="exercise-details">
                    <div class="sets-reps">${exercise.sets} sets × ${repsText}</div>
                    <div class="intensity">${exercise.intensity}%</div>
                </div>
            </div>
        `;
    }

    /**
     * Create rest card HTML
     */
    createRestCardHTML(rest, index) {
        return `
            <div class="rest-card" data-index="${index}">
                <button class="remove-exercise">×</button>
                <div class="exercise-name">Rest Period</div>
                <div class="exercise-details">
                    <div class="sets-reps">${rest.duration} minutes</div>
                    <div class="intensity">${rest.restType}</div>
                </div>
            </div>
        `;
    }

    /**
     * Handle simple add exercise
     */
    handleSimpleAddExercise(e) {
        const button = e.target.closest('[data-action="add-exercise"]');
        this.selectedDay = button.getAttribute('data-day');
        
        const modal = document.getElementById('simple-exercise-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Reset form
            document.getElementById('exercise-name-select').value = '';
            document.getElementById('sets-input').value = '3';
            document.getElementById('reps-input').value = '12';
            document.getElementById('intensity-input').value = '75';
        }
    }

    /**
     * Handle simple add rest
     */
    handleSimpleAddRest(e) {
        const button = e.target.closest('[data-action="add-rest"]');
        this.selectedDay = button.getAttribute('data-day');
        
        const modal = document.getElementById('simple-rest-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Reset form
            document.getElementById('rest-duration-input').value = '5';
            document.getElementById('rest-type-select').value = 'active';
        }
    }

    /**
     * Handle simple confirm add exercise
     */
    handleSimpleConfirmAddExercise(e) {
        const exerciseName = document.getElementById('exercise-name-select').value;
        const sets = parseInt(document.getElementById('sets-input').value);
        const reps = document.getElementById('reps-input').value;
        const intensity = parseInt(document.getElementById('intensity-input').value);
        
        if (!exerciseName) {
            this.showError('Please select an exercise');
            return;
        }

        const exercise = {
            type: 'exercise',
            name: exerciseName,
            sets: sets,
            reps: reps === 'max' ? 'max' : parseInt(reps),
            intensity: intensity
        };

        // Add exercise to selected day
        if (!this.workoutData.days[this.selectedDay]) {
            this.workoutData.days[this.selectedDay] = [];
        }
        this.workoutData.days[this.selectedDay].push(exercise);

        // Update UI
        this.renderDayExercises(this.selectedDay);
        this.closeModal();
        
        this.showSuccess(`${exerciseName} added to ${this.selectedDay}`);
    }

    /**
     * Handle simple confirm add rest
     */
    handleSimpleConfirmAddRest(e) {
        const duration = parseInt(document.getElementById('rest-duration-input').value);
        const restType = document.getElementById('rest-type-select').value;

        const rest = {
            type: 'rest',
            duration: duration,
            restType: restType
        };

        // Add rest to selected day
        if (!this.workoutData.days[this.selectedDay]) {
            this.workoutData.days[this.selectedDay] = [];
        }
        this.workoutData.days[this.selectedDay].push(rest);

        // Update UI
        this.renderDayExercises(this.selectedDay);
        this.closeModal();
        
        this.showSuccess(`Rest period (${duration} min) added to ${this.selectedDay}`);
    }

    /**
     * Handle remove exercise
     */
    handleRemoveExercise(e) {
        e.stopPropagation();
        
        const card = e.target.closest('.exercise-card, .rest-card');
        if (!card) return;

        const dayColumn = card.closest('.day-column');
        const day = dayColumn.getAttribute('data-day');
        const index = parseInt(card.getAttribute('data-index'));
        
        const item = this.workoutData.days[day][index];
        
        if (confirm(`Remove ${item.type === 'exercise' ? item.name : 'rest period'}?`)) {
            this.workoutData.days[day].splice(index, 1);
            this.renderDayExercises(day);
            
            this.showSuccess(`${item.type === 'exercise' ? item.name : 'Rest period'} removed`);
        }
    }

    /**
     * Handle edit exercise card
     */
    handleEditExerciseCard(e) {
        // Prevent if clicking remove button
        if (e.target.closest('.remove-exercise')) return;
        
        const card = e.target.closest('.exercise-card');
        if (!card) return;

        const dayColumn = card.closest('.day-column');
        const day = dayColumn.getAttribute('data-day');
        const index = parseInt(card.getAttribute('data-index'));
        
        const exercise = this.workoutData.days[day][index];
        
        if (exercise.type === 'exercise') {
            this.selectedDay = day;
            this.editingExerciseIndex = index;
            this.showEditExerciseModal(exercise);
        }
    }

    /**
     * Show edit exercise modal (simplified)
     */
    showEditExerciseModal(exercise) {
        const modal = document.getElementById('simple-exercise-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Populate with existing data
            document.getElementById('exercise-name-select').value = exercise.name;
            document.getElementById('sets-input').value = exercise.sets;
            document.getElementById('reps-input').value = exercise.reps;
            document.getElementById('intensity-input').value = exercise.intensity;
            
            // Change button text and action
            const confirmBtn = modal.querySelector('[data-action="confirm-add-exercise"]');
            confirmBtn.textContent = 'Update Exercise';
            confirmBtn.setAttribute('data-action', 'confirm-edit-exercise');
        }
    }

    /**
     * Handle confirm edit exercise (simplified)
     */
    handleConfirmEditExercise(e) {
        if (this.editingExerciseIndex === null) return;

        const exercise = this.workoutData.days[this.selectedDay][this.editingExerciseIndex];
        
        // Update exercise data
        exercise.name = document.getElementById('exercise-name-select').value;
        exercise.sets = parseInt(document.getElementById('sets-input').value);
        exercise.reps = document.getElementById('reps-input').value === 'max' ? 'max' : parseInt(document.getElementById('reps-input').value);
        exercise.intensity = parseInt(document.getElementById('intensity-input').value);

        // Update UI
        this.renderDayExercises(this.selectedDay);
        this.closeModal();
        this.editingExerciseIndex = null;
        
        this.showSuccess(`${exercise.name} updated`);
    }

    /**
     * Close modal and reset state
     */
    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        
        // Reset edit state
        this.editingExerciseIndex = null;
        
        // Reset button text
        const confirmBtn = document.querySelector('[data-action="confirm-edit-exercise"]');
        if (confirmBtn) {
            confirmBtn.textContent = 'Add Exercise';
            confirmBtn.setAttribute('data-action', 'confirm-add-exercise');
        }
    }

    /**
     * Handle confirm add exercise
     */
    handleConfirmAddExercise(e) {
        const equipment = document.getElementById('equipment-select').value;
        const exerciseName = document.getElementById('exercise-select').value;
        const sets = parseInt(document.getElementById('sets-input').value);
        const reps = parseInt(document.getElementById('reps-input').value);
        const weight = parseFloat(document.getElementById('weight-input').value);
        const weightUnit = document.getElementById('weight-unit').value;
        const duration = parseInt(document.getElementById('duration-input').value);
        const durationUnit = document.getElementById('duration-unit').value;
        const distance = parseFloat(document.getElementById('distance-input').value);
        const distanceUnit = document.getElementById('distance-unit').value;
        const pace = document.getElementById('pace-input').value;
        
        if (!equipment || !exerciseName) {
            this.showError('Please select equipment and exercise');
            return;
        }

        const exercise = {
            type: 'exercise',
            name: exerciseName,
            equipment: equipment,
            sets: sets || undefined,
            reps: reps || undefined,
            weight: weight || undefined,
            weightUnit: weight ? weightUnit : undefined,
            duration: duration || undefined,
            durationUnit: duration ? durationUnit : undefined,
            distance: distance || undefined,
            distanceUnit: distance ? distanceUnit : undefined,
            pace: pace || undefined,
            calories: this.calculateCalories(),
            muscles: this.getExerciseMuscles(exerciseName)
        };

        // Add exercise to selected day
        if (!this.workoutData.days[this.selectedDay]) {
            this.workoutData.days[this.selectedDay] = [];
        }
        this.workoutData.days[this.selectedDay].push(exercise);

        // Update UI
        this.renderWorkoutDay(this.selectedDay);
        this.updateDayCard(this.selectedDay);
        this.closeModal();
        
        this.showSuccess(`${exerciseName} added to ${this.selectedDay}`);
    }

    /**
     * Handle add rest period
     */
    handleAddRest(e) {
        if (!this.selectedDay) {
            this.showError('Please select a day first');
            return;
        }

        const modal = document.getElementById('rest-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Reset form
            document.getElementById('rest-minutes').value = '2';
            document.getElementById('rest-seconds').value = '0';
            document.getElementById('rest-type').value = 'active';
            document.getElementById('rest-notes').value = '';
        }
    }

    /**
     * Handle confirm add rest
     */
    handleConfirmAddRest(e) {
        const minutes = parseInt(document.getElementById('rest-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('rest-seconds').value) || 0;
        const type = document.getElementById('rest-type').value;
        const notes = document.getElementById('rest-notes').value;

        if (minutes === 0 && seconds === 0) {
            this.showError('Please enter a rest duration');
            return;
        }

        const rest = {
            type: 'rest',
            minutes: minutes,
            seconds: seconds,
            type: type,
            notes: notes
        };

        // Add rest to selected day
        if (!this.workoutData.days[this.selectedDay]) {
            this.workoutData.days[this.selectedDay] = [];
        }
        this.workoutData.days[this.selectedDay].push(rest);

        // Update UI
        this.renderWorkoutDay(this.selectedDay);
        this.updateDayCard(this.selectedDay);
        this.closeModal();
        
        const duration = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')} min` : `${seconds} sec`;
        this.showSuccess(`Rest period (${duration}) added to ${this.selectedDay}`);
    }

    /**
     * Handle edit exercise
     */
    handleEditExercise(e) {
        const exerciseItem = e.target.closest('.exercise-item');
        if (!exerciseItem) return;

        const index = parseInt(exerciseItem.getAttribute('data-index'));
        const exercise = this.workoutData.days[this.selectedDay][index];
        
        if (exercise.type !== 'exercise') return;

        this.editingExerciseIndex = index;
        this.showEditExerciseModal(exercise);
    }

    /**
     * Show edit exercise modal
     */
    showEditExerciseModal(exercise) {
        const modal = document.getElementById('edit-exercise-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Populate form with exercise data
            document.getElementById('edit-exercise-name').value = exercise.name;
            document.getElementById('edit-sets-input').value = exercise.sets || '';
            document.getElementById('edit-reps-input').value = exercise.reps || '';
            document.getElementById('edit-weight-input').value = exercise.weight || '';
            document.getElementById('edit-weight-unit').value = exercise.weightUnit || 'kg';
            document.getElementById('edit-duration-input').value = exercise.duration || '';
            document.getElementById('edit-duration-unit').value = exercise.durationUnit || 'minutes';
        }
    }

    /**
     * Handle confirm edit exercise
     */
    handleConfirmEditExercise(e) {
        if (this.editingExerciseIndex === null) return;

        const exercise = this.workoutData.days[this.selectedDay][this.editingExerciseIndex];
        
        // Update exercise data
        exercise.sets = parseInt(document.getElementById('edit-sets-input').value) || undefined;
        exercise.reps = parseInt(document.getElementById('edit-reps-input').value) || undefined;
        exercise.weight = parseFloat(document.getElementById('edit-weight-input').value) || undefined;
        exercise.weightUnit = exercise.weight ? document.getElementById('edit-weight-unit').value : undefined;
        exercise.duration = parseInt(document.getElementById('edit-duration-input').value) || undefined;
        exercise.durationUnit = exercise.duration ? document.getElementById('edit-duration-unit').value : undefined;
        
        // Recalculate calories (simplified)
        if (exercise.sets && exercise.reps) {
            exercise.calories = Math.round(exercise.sets * exercise.reps * 0.5 + (exercise.weight || 0) * 0.1);
        }

        // Update UI
        this.renderWorkoutDay(this.selectedDay);
        this.updateDayCard(this.selectedDay);
        this.closeModal();
        this.editingExerciseIndex = null;
        
        this.showSuccess(`${exercise.name} updated`);
    }

    /**
     * Handle delete exercise/rest
     */
    handleDeleteExercise(e) {
        const item = e.target.closest('.exercise-item, .rest-item');
        if (!item) return;

        const index = parseInt(item.getAttribute('data-index'));
        const itemData = this.workoutData.days[this.selectedDay][index];
        
        if (confirm(`Are you sure you want to delete this ${itemData.type}?`)) {
            this.workoutData.days[this.selectedDay].splice(index, 1);
            
            // Update UI
            this.renderWorkoutDay(this.selectedDay);
            this.updateDayCard(this.selectedDay);
            
            this.showSuccess(`${itemData.type === 'exercise' ? itemData.name : 'Rest period'} deleted`);
        }
    }

    /**
     * Close any open modal
     */
    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
        this.editingExerciseIndex = null;
    }

    /**
     * Update day card with exercise count and calories
     */
    updateDayCard(day) {
        const dayCard = document.querySelector(`.day-card[data-day="${day}"]`);
        if (!dayCard) return;

        const dayData = this.workoutData.days[day] || [];
        const exerciseCount = dayData.filter(item => item.type === 'exercise').length;
        const totalCalories = dayData
            .filter(item => item.type === 'exercise')
            .reduce((sum, exercise) => sum + (exercise.calories || 0), 0);

        const exerciseCountElement = dayCard.querySelector('.exercise-count');
        const caloriesElement = dayCard.querySelector('.total-calories');
        
        if (exerciseCountElement) {
            exerciseCountElement.textContent = `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;
        }
        
        if (caloriesElement) {
            caloriesElement.textContent = `${totalCalories} kcal`;
        }

        // Update day preview
        const dayPreview = dayCard.querySelector('.day-preview');
        if (dayPreview) {
            if (dayData.length === 0) {
                dayPreview.innerHTML = '<div class="empty-day">Click to add exercises</div>';
            } else {
                const exercises = dayData.filter(item => item.type === 'exercise').map(ex => ex.name);
                dayPreview.innerHTML = `<div class="day-exercises">${exercises.slice(0, 3).join(', ')}${exercises.length > 3 ? '...' : ''}</div>`;
            }
        }
    }

    /**
     * Update all day cards
     */
    updateAllDayCards() {
        Object.keys(this.workoutData.days).forEach(day => {
            this.updateDayCard(day);
        });
    }

    /**
     * Get muscles targeted by exercise (simplified mapping)
     */
    getExerciseMuscles(exerciseName) {
        const muscleMap = {
            'Bench Press': ['chest', 'triceps', 'shoulders'],
            'Deadlift': ['back', 'glutes', 'hamstrings'],
            'Squat': ['quadriceps', 'glutes'],
            'Pull-ups': ['back', 'biceps'],
            'Overhead Press': ['shoulders', 'triceps'],
            'Barbell Row': ['back', 'biceps'],
            'Dips': ['chest', 'triceps'],
            'Plank': ['abs'],
            // Add more mappings as needed
        };
        
        return muscleMap[exerciseName] || [];
    }

    /**
     * Update muscle group visualization
     */
    updateMuscleGroupVisualization(day) {
        const dayData = this.workoutData.days[day] || [];
        const activeMuscles = new Set();
        
        dayData.forEach(item => {
            if (item.type === 'exercise' && item.muscles) {
                item.muscles.forEach(muscle => activeMuscles.add(muscle));
            }
        });

        // Update muscle group display
        document.querySelectorAll('.muscle-group').forEach(group => {
            const muscle = group.getAttribute('data-muscle');
            if (activeMuscles.has(muscle)) {
                group.classList.add('active');
            } else {
                group.classList.remove('active');
            }
        });
    }

    /**
     * Handle muscle group click
     */
    handleMuscleGroupClick(e) {
        const muscle = e.target.getAttribute('data-muscle');
        this.showSuccess(`Showing exercises for ${muscle}`);
        // In a real implementation, this could filter exercises by muscle group
    }

    /**
     * Initialize muscle groups
     */
    initializeMuscleGroups() {
        // This would set up the muscle group visualization
        // For now, it's just a placeholder
    }

    /**
     * Handle showing workout summary
     */
    async handleShowWorkoutSummary(e) {
        e.preventDefault();
        try {
            this.showLoading();
            const result = await this.contentLoader.loadContent('workout-summary.html');
            
            if (result.success) {
                this.mainContent.innerHTML = result.content;
                this.currentContent = 'workout-summary';
                this.populateWorkoutSummaryData();
                this.updateNavigationState('workout-summary');
            } else {
                this.showError('Failed to load workout summary');
            }
        } catch (error) {
            console.error('Error loading workout summary:', error);
            this.showError('Failed to load workout summary');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handle back to home navigation
     */
    async handleBackToHome(e) {
        e.preventDefault();
        try {
            this.navigateTo('home');
        } catch (error) {
            console.error('Error navigating back to home:', error);
            this.showError('Navigation failed');
        }
    }

    /**
     * Populate workout summary with dynamic data
     */
    populateWorkoutSummaryData() {
        try {
            // Get workout name from input or use default
            const workoutNameInput = document.querySelector('#workout-name-input');
            const workoutName = workoutNameInput?.value || 'isil-workout';
            
            // Update workout name in summary
            const workoutNameElement = document.querySelector('.workout-name');
            if (workoutNameElement) {
                workoutNameElement.textContent = workoutName;
            }

            // Collect and populate weekly exercise data
            this.populateWeeklyScheduleData();
            
        } catch (error) {
            console.error('Error populating workout summary data:', error);
        }
    }

    /**
     * Populate weekly schedule data in summary
     */
    populateWeeklyScheduleData() {
        // Sample workout data structure
        const weeklyData = {
            monday: {
                exercises: [
                    { name: 'Deadlift', details: '• 4 sets × 6 reps • 80% • 15-25 kcal' },
                    { name: 'Pull-ups', details: '• 4 sets × max reps • 70% • 12-20 kcal' },
                    { name: 'Barbell Row', details: '• 3 sets × 8 reps • 80% • 10-18 kcal' },
                    { name: 'Lat Pulldown', details: '• 3 sets × 12 reps • 70% • 8-15 kcal' }
                ],
                muscles: ['Back', 'Core', 'Biceps'],
                calories: '45-78 kcal'
            },
            tuesday: {
                exercises: [
                    { name: 'Bench Press', details: '• 4 sets × 8 reps • 80% • 20-30 kcal' },
                    { name: 'Incline Dumbbell Press', details: '• 3 sets × 12 reps • 70% • 15-25 kcal' },
                    { name: 'Triceps Pushdown', details: '• 3 sets × 12 reps • 70% • 10-15 kcal' },
                    { name: 'Dips', details: '• 3 sets × max reps • 20-25 kcal' }
                ],
                muscles: ['Chest', 'Shoulders', 'Triceps'],
                calories: '65-95 kcal'
            },
            thursday: {
                exercises: [
                    { name: 'Deadlift', details: '• 4 sets × 6 reps • 80% • 15-25 kcal' },
                    { name: 'Pull-ups', details: '• 4 sets × max reps • 70% • 12-20 kcal' },
                    { name: 'Barbell Row', details: '• 3 sets × 8 reps • 80% • 10-18 kcal' },
                    { name: 'Barbell Curl', details: '• 3 sets × 12 reps • 70% • 13-22 kcal' }
                ],
                muscles: ['Back', 'Biceps', 'Core'],
                calories: '50-85 kcal'
            },
            sunday: {
                exercises: [
                    { name: 'Bench Press', details: '• 4 sets × 8 reps • 80% • 20-30 kcal' },
                    { name: 'Overhead Press', details: '• 3 sets × 10 reps • 70% • 18-25 kcal' },
                    { name: 'Lateral Raise', details: '• 4 sets × 15 reps • 60% • 16-25 kcal' },
                    { name: 'Triceps Pushdown', details: '• 3 sets × 12 reps • 70% • 16-30 kcal' }
                ],
                muscles: ['Chest', 'Shoulders', 'Triceps'],
                calories: '70-110 kcal'
            }
        };

        // Update each workout day
        Object.keys(weeklyData).forEach(day => {
            this.updateDayData(day, weeklyData[day]);
        });
    }

    /**
     * Update a specific day's workout data
     */
    updateDayData(day, data) {
        // Update calories
        const caloriesElement = document.getElementById(`${day}-calories`);
        if (caloriesElement) {
            caloriesElement.textContent = data.calories;
        }

        // Update muscles
        const musclesContainer = document.getElementById(`${day}-muscles`);
        if (musclesContainer && data.muscles) {
            musclesContainer.innerHTML = data.muscles
                .map(muscle => `<span class="muscle-tag">${muscle}</span>`)
                .join('');
        }

        // Update exercises
        const exercisesContainer = document.getElementById(`${day}-exercises`);
        if (exercisesContainer && data.exercises) {
            exercisesContainer.innerHTML = data.exercises
                .map(exercise => `
                    <div class="exercise-item">
                        <span class="exercise-name">${exercise.name}</span>
                        <span class="exercise-details">${exercise.details}</span>
                    </div>
                `).join('');
        }
    }

    /**
     * Show edit profile modal
     */
    showEditProfile() {
        const modal = document.getElementById('edit-profile-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Load current data
            const user = this.userService.getCurrentUser();
            if (user) {
                document.getElementById('edit-name').value = user.namesurname || '';
                document.getElementById('edit-email').value = user.email || '';
            }
        }
    }

    /**
     * Update navigation state
     */
    updateNavigationState(pageName) {
        // Update active navigation link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageName) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Update document title
     */
    updateTitle(pageName) {
        const title = getRouteTitle(pageName);
        document.title = title;
    }

    /**
     * Set application language
     */
    setLanguage(lang) {
        this.appState.language = lang;
        
        // Update language button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            }
        });

        // Save preference
        localStorage.setItem('app-language', lang);

        // Reload current page with new language
        if (this.currentPage && typeof this.currentPage.updateLanguage === 'function') {
            this.currentPage.updateLanguage(lang);
        }
    }

    /**
     * Show loading overlay
     */
    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Show modal
     */
    showModal(content, options = {}) {
        if (!this.modalContainer) return;

        const modalHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${options.title || 'Modal'}</h3>
                    <button class="modal-close" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;

        this.modalContainer.innerHTML = modalHTML;
        this.modalContainer.classList.remove('hidden');
        
        // Focus management
        const modal = this.modalContainer.querySelector('.modal');
        if (modal) {
            modal.focus();
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        if (this.modalContainer) {
            this.modalContainer.classList.add('hidden');
            this.modalContainer.innerHTML = '';
        }
    }

    /**
     * Show error message
     */
    showError(message, duration = 5000) {
        const errorHTML = `
            <div class="error-toast">
                <div class="error-content">
                    <span class="error-icon">⚠️</span>
                    <span class="error-message">${message}</span>
                    <button class="error-close">&times;</button>
                </div>
            </div>
        `;

        const errorElement = document.createElement('div');
        errorElement.innerHTML = errorHTML;
        document.body.appendChild(errorElement);

        // Auto remove
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, duration);

        // Manual close
        errorElement.addEventListener('click', (e) => {
            if (e.target.matches('.error-close')) {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }
        });
    }

    /**
     * Show success message
     */
    showSuccess(message, duration = 3000) {
        const successHTML = `
            <div class="success-toast">
                <div class="success-content">
                    <span class="success-icon">✅</span>
                    <span class="success-message">${message}</span>
                    <button class="success-close">&times;</button>
                </div>
            </div>
        `;

        const successElement = document.createElement('div');
        successElement.innerHTML = successHTML;
        document.body.appendChild(successElement);

        // Auto remove
        setTimeout(() => {
            if (successElement.parentNode) {
                successElement.parentNode.removeChild(successElement);
            }
        }, duration);

        // Manual close
        successElement.addEventListener('click', (e) => {
            if (e.target.matches('.success-close')) {
                if (successElement.parentNode) {
                    successElement.parentNode.removeChild(successElement);
                }
            }
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K: Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            // Focus search if available
            const searchInput = document.querySelector('[data-search]');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Escape: Close modal
        if (e.key === 'Escape') {
            this.closeModal();
        }

        // Ctrl/Cmd + H: Home
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            this.navigateTo('home');
        }
    }

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        // Load language preference
        const savedLang = localStorage.getItem('app-language');
        if (savedLang && ['en', 'tr'].includes(savedLang)) {
            this.setLanguage(savedLang);
        }

        // Load theme preference
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme) {
            this.appState.theme = savedTheme;
            document.body.setAttribute('data-theme', savedTheme);
        }

        // Authentication state will be handled by UserService initialization
        // Update app state with current user
        const currentUser = this.userService.getCurrentUser();
        if (currentUser) {
            this.appState.currentUser = currentUser;
            this.appState.isLoggedIn = true;
        }

        // Update header auth button
        this.updateHeaderAuthButton();
    }

    /**
     * Save user preferences
     */
    saveUserPreferences() {
        localStorage.setItem('app-language', this.appState.language);
        localStorage.setItem('app-theme', this.appState.theme);
        
        if (this.appState.currentUser) {
            localStorage.setItem('user-profile', JSON.stringify(this.appState.currentUser));
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.appState.currentUser;
    }

    /**
     * Set current user
     */
    setCurrentUser(user) {
        this.appState.currentUser = user;
        this.saveUserPreferences();
    }

    /**
     * Create static page
     */
    createStaticPage(title, content) {
        return {
            title,
            content
        };
    }

    /**
     * Render static page
     */
    renderStaticPage(pageData) {
        this.mainContent.innerHTML = `
            <div class="static-page">
                <div class="page-header">
                    <h1>${pageData.title}</h1>
                </div>
                <div class="page-content">
                    <p>${pageData.content}</p>
                </div>
            </div>
        `;
    }

    /**
     * Get application state
     */
    getState() {
        return { ...this.appState };
    }

    /**
     * Update application state
     */
    updateState(updates) {
        this.appState = { ...this.appState, ...updates };
        this.saveUserPreferences();
    }
}
