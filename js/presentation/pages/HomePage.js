/**
 * Home Page Component
 * Main landing page matching the reference design
 */
import { ExerciseService } from '../../application/services/ExerciseService.js';
import { WorkoutService } from '../../application/services/WorkoutService.js';

export class HomePage {
    constructor(container, appController) {
        this.container = container;
        this.appController = appController;
        this.exerciseService = new ExerciseService();
        this.workoutService = new WorkoutService();
        this.stats = null;
    }

    async render() {
        try {
            // Load statistics
            await this.loadStats();
            
            this.container.innerHTML = this.getHTML();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error rendering home page:', error);
            this.container.innerHTML = this.getErrorHTML();
        }
    }

    async loadStats() {
        try {
            const [exerciseStats, workoutStats] = await Promise.all([
                this.exerciseService.getExerciseStats(),
                this.workoutService.getWorkoutStats()
            ]);

            this.stats = {
                exercises: exerciseStats.total || 0,
                workoutPrograms: workoutStats.total || 0,
                customizable: 100
            };
        } catch (error) {
            console.error('Error loading stats:', error);
            this.stats = {
                exercises: 500,
                workoutPrograms: 50,
                customizable: 100
            };
        }
    }

    getHTML() {
        return `
            <div class="home-page">
                <!-- Hero Section -->
                <section class="hero-section">
                    <div class="hero-content">
                        <h1 class="hero-title">Create Your Perfect Workout</h1>
                        <p class="hero-description">
                            Design personalized workout programs with our comprehensive 
                            fitness tools. Whether you're a beginner or advanced athlete, we 
                            have everything you need to achieve your fitness goals.
                        </p>
                        
                        <!-- Statistics -->
                        <div class="stats-container">
                            <div class="stat-item">
                                <div class="stat-number">${this.stats.exercises}+</div>
                                <div class="stat-label">Exercises</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${this.stats.workoutPrograms}+</div>
                                <div class="stat-label">Workout Programs</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${this.stats.customizable}%</div>
                                <div class="stat-label">Customizable</div>
                            </div>
                        </div>

                        <!-- Workout Creator Section -->
                        <div class="workout-creator-section">
                            <div class="workout-form">
                                <input 
                                    type="text" 
                                    placeholder="Give your workout a name" 
                                    class="workout-name-input"
                                    id="workout-name-input"
                                >
                                <div class="workout-actions">
                                    <button class="btn btn-secondary" data-action="load-workout">
                                        Load Workout
                                    </button>
                                    <button class="btn btn-primary" data-action="create-workout">
                                        Save Workout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Weekly Schedule Section -->
                <section class="weekly-schedule-section">
                    <h2 class="section-title">Weekly Schedule</h2>
                    <div class="weekly-grid" id="weekly-grid">
                        ${this.getWeeklyGridHTML()}
                    </div>
                </section>

                <!-- Workout Summary Section -->
                <section class="workout-summary-section">
                    <h2 class="section-title">Workout Summary</h2>
                    <div class="summary-grid">
                        ${this.getSummaryCardsHTML()}
                    </div>
                </section>

                <!-- Additional Features Section -->
                <section class="features-section">
                    <div class="features-grid">
                        ${this.getFeatureCardsHTML()}
                    </div>
                </section>
            </div>
        `;
    }

    getWeeklyGridHTML() {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        return days.map(day => `
            <div class="day-card" data-day="${day.toLowerCase()}">
                <div class="day-header">
                    <h3>${day}</h3>
                </div>
                <div class="day-content">
                    <div class="exercise-placeholder">
                        <button class="add-exercise-btn" data-day="${day.toLowerCase()}">
                            + Exercise
                        </button>
                    </div>
                    <div class="rest-placeholder">
                        <button class="add-rest-btn" data-day="${day.toLowerCase()}">
                            + Rest
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getSummaryCardsHTML() {
        return `
            <div class="summary-card" data-action="workout-creator">
                <div class="summary-icon">🎯</div>
                <h3>Workout Creator</h3>
                <p>Create custom workout programs tailored to your fitness level, goals, and available time.</p>
                <div class="summary-arrow">→</div>
            </div>

            <div class="summary-card" data-action="exercise-library">
                <div class="summary-icon">📚</div>
                <h3>Exercise Library</h3>
                <p>Browse hundreds of exercises with detailed instructions and demonstration videos.</p>
                <div class="summary-arrow">→</div>
            </div>

            <div class="summary-card" data-action="ready-workouts">
                <div class="summary-icon">🏃</div>
                <h3>Ready Workouts</h3>
                <p>Choose from professionally designed workout programs for different experience levels.</p>
                <div class="summary-arrow">→</div>
            </div>

            <div class="summary-card" data-action="warmup-routines">
                <div class="summary-icon">🔥</div>
                <h3>Warmup Routines</h3>
                <p>Prepare your body for exercise with effective warmup sequences.</p>
                <div class="summary-arrow">→</div>
            </div>

            <div class="summary-card" data-action="cooldown-routines">
                <div class="summary-icon">❄️</div>
                <h3>Cooldown Routines</h3>
                <p>Recover properly after your workout with guided cooldown exercises.</p>
                <div class="summary-arrow">→</div>
            </div>
        `;
    }

    getFeatureCardsHTML() {
        return `
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>Personalized Programs</h3>
                <p>Get workout plans tailored to your specific fitness level, goals, and available equipment.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">📈</div>
                <h3>Progress Tracking</h3>
                <p>Monitor your fitness journey with detailed analytics and progress measurements.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <h3>Goal-Oriented</h3>
                <p>Focus on specific objectives like strength building, weight loss, or endurance improvement.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">📅</div>
                <h3>Flexible Scheduling</h3>
                <p>Create workout routines that fit perfectly into your busy daily schedule.</p>
            </div>
        `;
    }

    setupEventListeners() {
        // Workout actions
        this.container.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            
            switch (action) {
                case 'create-workout':
                    this.handleCreateWorkout();
                    break;
                case 'load-workout':
                    this.handleLoadWorkout();
                    break;
                case 'workout-creator':
                    this.appController.navigateTo('workout-creator');
                    break;
                case 'exercise-library':
                    this.appController.navigateTo('exercise-library');
                    break;
                case 'ready-workouts':
                    this.showReadyWorkouts();
                    break;
                case 'warmup-routines':
                    this.showWarmupRoutines();
                    break;
                case 'cooldown-routines':
                    this.showCooldownRoutines();
                    break;
                default:
                    break;
            }
        });

        // Day card interactions
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.add-exercise-btn')) {
                const day = e.target.getAttribute('data-day');
                this.addExerciseToDay(day);
            } else if (e.target.matches('.add-rest-btn')) {
                const day = e.target.getAttribute('data-day');
                this.addRestToDay(day);
            }
        });

        // Summary card navigation
        this.container.addEventListener('click', (e) => {
            const summaryCard = e.target.closest('.summary-card');
            if (summaryCard) {
                const action = summaryCard.getAttribute('data-action');
                if (action) {
                    switch (action) {
                        case 'workout-creator':
                            this.appController.navigateTo('workout-creator');
                            break;
                        case 'exercise-library':
                            this.appController.navigateTo('exercise-library');
                            break;
                        default:
                            console.log(`Navigate to ${action}`);
                            break;
                    }
                }
            }
        });
    }

    async handleCreateWorkout() {
        const nameInput = document.getElementById('workout-name-input');
        const workoutName = nameInput?.value?.trim();

        if (!workoutName) {
            this.appController.showError('Please enter a workout name');
            return;
        }

        try {
            // Navigate to workout creator with the name
            this.appController.navigateTo('workout-creator');
            
            // Pass the workout name to the workout creator
            // This would be handled by the workout creator page
            sessionStorage.setItem('new-workout-name', workoutName);
            
            this.appController.showSuccess('Redirecting to Workout Creator...');
        } catch (error) {
            console.error('Error creating workout:', error);
            this.appController.showError('Failed to create workout');
        }
    }

    handleLoadWorkout() {
        // Show modal to select existing workouts
        const modalContent = `
            <div class="load-workout-modal">
                <h3>Load Existing Workout</h3>
                <p>Select a workout to load into the editor.</p>
                <div class="workout-list" id="workout-list">
                    <div class="loading-placeholder">Loading workouts...</div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </div>
        `;

        this.appController.showModal(modalContent, { title: 'Load Workout' });
        this.loadWorkoutsList();
    }

    async loadWorkoutsList() {
        try {
            const workouts = await this.workoutService.getUserWorkouts();
            const workoutList = document.getElementById('workout-list');
            
            if (!workoutList) return;

            if (workouts.length === 0) {
                workoutList.innerHTML = `
                    <div class="no-workouts">
                        <p>No saved workouts found.</p>
                        <button class="btn btn-primary modal-close" data-action="workout-creator">
                            Create Your First Workout
                        </button>
                    </div>
                `;
            } else {
                workoutList.innerHTML = workouts.map(workout => `
                    <div class="workout-item" data-workout-id="${workout.id}">
                        <h4>${workout.name}</h4>
                        <p>${workout.description}</p>
                        <div class="workout-meta">
                            <span>Difficulty: ${workout.difficulty}/10</span>
                            <span>Exercises: ${workout.exercises?.length || 0}</span>
                        </div>
                    </div>
                `).join('');

                // Add click handlers for workout items
                workoutList.addEventListener('click', (e) => {
                    const workoutItem = e.target.closest('.workout-item');
                    if (workoutItem) {
                        const workoutId = workoutItem.getAttribute('data-workout-id');
                        this.loadSelectedWorkout(workoutId);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading workouts:', error);
            const workoutList = document.getElementById('workout-list');
            if (workoutList) {
                workoutList.innerHTML = '<div class="error-message">Failed to load workouts</div>';
            }
        }
    }

    loadSelectedWorkout(workoutId) {
        // Store the selected workout ID and navigate to workout creator
        sessionStorage.setItem('load-workout-id', workoutId);
        this.appController.closeModal();
        this.appController.navigateTo('workout-creator');
    }

    addExerciseToDay(day) {
        // For now, just show a placeholder
        this.appController.showModal(`
            <div class="add-exercise-modal">
                <h3>Add Exercise to ${day.charAt(0).toUpperCase() + day.slice(1)}</h3>
                <p>This feature will allow you to add exercises to your weekly schedule.</p>
                <p>For now, please use the Workout Creator to build complete workouts.</p>
                <button class="btn btn-primary modal-close">OK</button>
            </div>
        `, { title: 'Add Exercise' });
    }

    addRestToDay(day) {
        const dayCard = this.container.querySelector(`[data-day="${day}"]`);
        if (dayCard) {
            const content = dayCard.querySelector('.day-content');
            content.innerHTML = `
                <div class="rest-day">
                    <span class="rest-icon">😴</span>
                    <span class="rest-text">Rest Day</span>
                    <button class="remove-rest-btn" data-day="${day}">&times;</button>
                </div>
            `;
        }
    }

    showReadyWorkouts() {
        // This would navigate to a ready workouts page or show a modal
        this.appController.showModal(`
            <div class="ready-workouts-modal">
                <h3>Ready Workouts</h3>
                <p>Pre-designed workout programs will be available here.</p>
                <p>Choose from beginner, intermediate, and advanced programs.</p>
                <button class="btn btn-primary modal-close">Coming Soon</button>
            </div>
        `, { title: 'Ready Workouts' });
    }

    showWarmupRoutines() {
        this.appController.showModal(`
            <div class="warmup-modal">
                <h3>Warmup Routines</h3>
                <p>Effective warmup sequences to prepare your body for exercise.</p>
                <button class="btn btn-primary modal-close">Coming Soon</button>
            </div>
        `, { title: 'Warmup Routines' });
    }

    showCooldownRoutines() {
        this.appController.showModal(`
            <div class="cooldown-modal">
                <h3>Cooldown Routines</h3>
                <p>Recovery exercises and stretches for after your workout.</p>
                <button class="btn btn-primary modal-close">Coming Soon</button>
            </div>
        `, { title: 'Cooldown Routines' });
    }

    getErrorHTML() {
        return `
            <div class="error-page">
                <h2>⚠️ Error Loading Home Page</h2>
                <p>There was an error loading the home page content.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    Refresh Page
                </button>
            </div>
        `;
    }

    destroy() {
        // Clean up event listeners if needed
        // This page uses event delegation, so no specific cleanup needed
    }
}