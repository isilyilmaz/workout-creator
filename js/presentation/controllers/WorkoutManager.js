/**
 * Workout Manager
 * Centralized workout event management and UI coordination
 */
import { WorkoutDataManager } from '../../application/WorkoutDataManager.js';

export class WorkoutManager {
    constructor() {
        this.workoutDataManager = new WorkoutDataManager();
        this.selectedDay = null;
        this.editingExerciseIndex = null;
        this.isInitialized = false;
        
        // Subscribe to workout data changes
        this.workoutDataManager.addObserver((event, data) => this.handleDataChange(event, data));
    }

    /**
     * Handle workout data changes
     */
    handleDataChange(event, data) {
        console.log(`WorkoutManager: Handling data change - ${event}`, data);
        
        switch (event) {
            case 'workoutLoaded':
                console.log('WorkoutManager: Workout loaded event received, updating UI...');
                this.updateWorkoutNameInput();
                console.log('WorkoutManager: Starting populateAllDays...');
                this.populateAllDays();
                break;
            case 'exerciseAdded':
            case 'exerciseUpdated':
            case 'exerciseRemoved':
                console.log(`WorkoutManager: ${event} for day ${data.day}`);
                this.renderDayExercises(data.day);
                break;
            case 'dayCleared':
                console.log(`WorkoutManager: Day cleared for ${data.day}`);
                this.renderDayExercises(data.day);
                break;
            case 'workoutReset':
                console.log('WorkoutManager: Workout reset, updating UI...');
                this.updateWorkoutNameInput();
                this.populateAllDays();
                break;
            default:
                console.log(`WorkoutManager: Unknown event received: ${event}`);
        }
    }

    /**
     * Initialize workout management for a page
     */
    async initialize() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        await this.populateExerciseDropdown();
        this.isInitialized = true;
    }

    /**
     * Populate exercise dropdown with database exercises
     */
    async populateExerciseDropdown() {
        try {
            const exerciseService = this.workoutDataManager.getExerciseDataService();
            const exercises = await exerciseService.getAllExercises();
            
            const select = document.getElementById('exercise-name-select');
            if (select) {
                // Keep the default option
                const defaultOption = select.querySelector('option[value=""]');
                select.innerHTML = '';
                
                // Re-add default option
                if (defaultOption) {
                    select.appendChild(defaultOption);
                }
                
                // Add exercises from database
                exercises.forEach(exercise => {
                    const option = document.createElement('option');
                    option.value = exercise.id; // Use exercise ID as value
                    option.textContent = exercise.name;
                    option.setAttribute('data-exercise-name', exercise.name);
                    select.appendChild(option);
                });
                
                console.log(`Populated exercise dropdown with ${exercises.length} exercises`);
            }
        } catch (error) {
            console.error('Error populating exercise dropdown:', error);
        }
    }

    /**
     * Setup all workout-related event listeners
     */
    setupEventListeners() {
        // Click events
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="save-workout"]')) {
                this.handleSaveWorkout(e);
            } else if (e.target.matches('[data-action="load-workout"]')) {
                this.handleLoadWorkout(e);
            } else if (e.target.matches('[data-action="show-workout-summary"]')) {
                this.handleShowWorkoutSummary(e);
            } else if (e.target.matches('[data-action="back-to-home"]')) {
                this.handleBackToHome(e);
            } else if (e.target.matches('[data-action="add-exercise"]')) {
                this.handleAddExercise(e);
            } else if (e.target.matches('[data-action="add-rest"]')) {
                this.handleAddRest(e);
            } else if (e.target.matches('[data-action="close-modal"]')) {
                this.closeModal();
            } else if (e.target.matches('[data-action="confirm-add-exercise"]')) {
                this.handleConfirmAddExercise(e);
            } else if (e.target.matches('[data-action="confirm-add-rest"]')) {
                this.handleConfirmAddRest(e);
            } else if (e.target.matches('[data-action="confirm-edit-exercise"]')) {
                this.handleConfirmEditExercise(e);
            } else if (e.target.matches('[data-action="show-exercise-demo"]') || e.target.closest('[data-action="show-exercise-demo"]')) {
                this.handleShowExerciseDemo(e);
            } else if (e.target.matches('[data-action="edit-exercise"]') || e.target.closest('[data-action="edit-exercise"]')) {
                this.handleEditExerciseFromItem(e);
            } else if (e.target.matches('[data-action="delete-exercise"]') || e.target.closest('[data-action="delete-exercise"]')) {
                this.handleDeleteExerciseFromItem(e);
            } else if (e.target.matches('[data-action="close-demonstration"]')) {
                this.closeExerciseDemonstration();
            } else if (e.target.matches('[data-action="edit-exercise-from-demo"]')) {
                this.handleEditExerciseFromDemo(e);
            } else if (e.target.matches('.remove-exercise')) {
                this.handleRemoveExercise(e);
            } else if (e.target.closest('.exercise-card')) {
                this.handleEditExerciseCard(e);
            }
        });

        // File input change event - No longer needed as we use fixed path loading
        // document.addEventListener('change', (e) => {
        //     if (e.target.matches('#workout-file-input')) {
        //         this.handleWorkoutFileLoad(e);
        //     }
        // });

        // Workout name input change
        document.addEventListener('input', (e) => {
            if (e.target.matches('#workout-name-input')) {
                this.workoutDataManager.updateWorkoutMetadata({ name: e.target.value });
            }
        });

        // Drag and drop events for exercise reordering
        document.addEventListener('dragstart', (e) => {
            if (e.target.closest('.exercise-item')) {
                this.handleDragStart(e);
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver(e);
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
        });

        document.addEventListener('dragend', (e) => {
            this.handleDragEnd(e);
        });
    }

    /**
     * Load workout data and populate interface
     */
    loadWorkoutData(data) {
        console.log('WorkoutManager: Starting workout data load process');
        console.log('WorkoutManager: Workout data to load:', {
            name: data.name,
            dayCount: data.days ? Object.keys(data.days).length : 0,
            hasExercises: data.days ? Object.values(data.days).some(day => day.length > 0) : false
        });
        
        const result = this.workoutDataManager.loadWorkoutData(data);
        if (!result.success) {
            console.error('WorkoutManager: Failed to load workout data:', result.error);
            this.showError(`Failed to load workout: ${result.error}`);
        } else {
            console.log('WorkoutManager: Workout data loaded successfully into WorkoutDataManager');
            console.log('WorkoutManager: Observer notifications should trigger populateAllDays');
        }
        return result;
    }

    /**
     * Update workout name input field
     */
    updateWorkoutNameInput() {
        const nameInput = document.getElementById('workout-name-input');
        if (nameInput) {
            const workoutData = this.workoutDataManager.getWorkoutData();
            nameInput.value = workoutData.name;
            console.log('Updated workout name to:', workoutData.name);
        }
    }

    /**
     * Populate all days with current workout data
     */
    populateAllDays() {
        const allDays = this.workoutDataManager.getAllDays();
        console.log('PopulateAllDays called with data:', allDays);
        
        // Add a small delay to ensure DOM elements are ready
        setTimeout(() => {
            Object.keys(allDays).forEach(day => {
                console.log(`Processing day: ${day}`);
                this.renderDayExercises(day);
            });
        }, 50); // Small delay to allow include processing to complete
    }

    /**
     * Render exercises for a specific day
     */
    async renderDayExercises(day, retryCount = 0) {
        const exerciseContainer = document.getElementById(`${day}-exercises`);
        if (!exerciseContainer) {
            console.warn(`Exercise container not found for day: ${day} (attempt ${retryCount + 1})`);
            
            // If DOM elements not ready, retry after a short delay
            if (retryCount < 3) {
                setTimeout(() => {
                    this.renderDayExercises(day, retryCount + 1);
                }, 100 * (retryCount + 1)); // Progressive delay: 100ms, 200ms, 300ms
                return;
            }
            
            console.error(`Failed to find exercise container for ${day} after ${retryCount + 1} attempts`);
            return;
        }

        try {
            // Get enhanced exercises with database data
            const exercises = await this.workoutDataManager.getEnhancedExercisesForDay(day);
            console.log(`Rendering ${exercises.length} enhanced exercises for ${day}:`, exercises);
            
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
            
            console.log(`Successfully rendered ${exercises.length} exercises for ${day}`);
        } catch (error) {
            console.error(`Error rendering exercises for ${day}:`, error);
            // Fallback to basic rendering if enhanced fails
            this.renderBasicDayExercises(day);
        }
    }

    /**
     * Fallback method to render exercises without database enhancement
     */
    renderBasicDayExercises(day) {
        const exerciseContainer = document.getElementById(`${day}-exercises`);
        if (!exerciseContainer) return;

        const exercises = this.workoutDataManager.getExercisesForDay(day);
        console.log(`Fallback rendering ${exercises.length} exercises for ${day}`);
        
        try {
            exerciseContainer.innerHTML = exercises.map((exercise, index) => {
                if (exercise.type === 'exercise') {
                    return this.createExerciseCardHTML(exercise, index);
                } else if (exercise.type === 'rest') {
                    return this.createRestCardHTML(exercise, index);
                } else {
                    return this.createExerciseCardHTML({...exercise, type: 'exercise'}, index);
                }
            }).filter(html => html).join('');
        } catch (error) {
            console.error(`Error in fallback rendering for ${day}:`, error);
        }
    }

    /**
     * Create exercise card HTML using template
     */
    createExerciseCardHTML(exercise, index) {
        const repsText = exercise.reps === 'max' ? 'max reps' : `${exercise.reps} reps`;
        
        // Use the exercise-item template with enhanced data
        return this.renderExerciseItemTemplate({
            index: index,
            exerciseName: exercise.name,
            exerciseType: 'exercise',
            isExercise: true,
            sets: exercise.sets,
            repsDisplay: repsText,
            intensity: exercise.intensity,
            exerciseId: exercise.exerciseId,
            targetMuscles: exercise.targetMuscles,
            equipment: exercise.equipment,
            difficultyLevel: exercise.difficultyLevel,
            video: exercise.video
        });
    }

    /**
     * Create rest card HTML using template
     */
    createRestCardHTML(rest, index) {
        // Use the exercise-item template for rest periods
        return this.renderExerciseItemTemplate({
            index: index,
            exerciseName: 'Rest Period',
            exerciseType: 'rest',
            isExercise: false,
            duration: rest.duration,
            restType: rest.restType
        });
    }

    /**
     * Render exercise item template with data
     */
    renderExerciseItemTemplate(data) {
        // Simple template rendering since we don't have a full templating engine
        let template = `
            <div class="exercise-item" 
                 data-exercise-index="${data.index}" 
                 data-exercise-name="${data.exerciseName}"
                 data-exercise-type="${data.exerciseType}"
                 draggable="true">
                
                <!-- Drag Handle -->
                <div class="exercise-drag-handle" title="Drag to reorder">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <circle cx="3" cy="3" r="1"/>
                        <circle cx="9" cy="3" r="1"/>
                        <circle cx="3" cy="6" r="1"/>
                        <circle cx="9" cy="6" r="1"/>
                        <circle cx="3" cy="9" r="1"/>
                        <circle cx="9" cy="9" r="1"/>
                    </svg>
                </div>
                
                <!-- Exercise Content -->
                <div class="exercise-content" data-action="show-exercise-demo">
                    <div class="exercise-name">${data.exerciseName}</div>
                    <div class="exercise-details">`;
        
        if (data.isExercise) {
            template += `
                        <div class="sets-reps">${data.sets} sets × ${data.repsDisplay}</div>
                        <div class="intensity">${data.intensity}%</div>`;
        } else {
            template += `
                        <div class="sets-reps">${data.duration} minutes</div>
                        <div class="rest-type">${data.restType}</div>`;
        }
        
        template += `
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="exercise-actions">`;
        
        if (data.isExercise) {
            template += `
                    <button class="exercise-edit-btn" 
                            data-action="edit-exercise" 
                            title="Edit exercise">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M11.7 3.3L10.7 2.3c-.4-.4-1-.4-1.4 0L2 9.6V12h2.4l7.3-7.3c.4-.4.4-1 0-1.4zM4.6 11H3V9.4l6-6 1.6 1.6-6 6z"/>
                        </svg>
                    </button>`;
        }
        
        template += `
                    <button class="exercise-delete-btn" 
                            data-action="delete-exercise" 
                            title="Delete ${data.isExercise ? 'exercise' : 'rest period'}">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                            <path d="M14 1.4L12.6 0 7 5.6 1.4 0 0 1.4 5.6 7 0 12.6 1.4 14 7 8.4 12.6 14 14 12.6 8.4 7z"/>
                        </svg>
                    </button>
                </div>
            </div>`;
        
        return template;
    }

    /**
     * Handle save workout to fixed path data/sample-workout.json
     */
    handleSaveWorkout(e) {
        try {
            const exportData = this.workoutDataManager.createExportBlob('json');
            const url = URL.createObjectURL(exportData.blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'sample-workout-with-ids.json'; // Fixed filename for data directory
            link.click();
            
            const workoutData = this.workoutDataManager.getWorkoutData();
            this.showSuccess(`Workout "${workoutData.name}" saved as sample-workout-with-ids.json. Move the downloaded file to the data/ directory to use with the Load button.`);
            
            // Clean up the URL object
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('WorkoutManager: Error saving workout:', error);
            this.showError('Failed to save workout');
        }
    }

    /**
     * Handle load workout from fixed path data/sample-workout.json
     */
    async handleLoadWorkout(e) {
        console.log('WorkoutManager: Load workout button clicked - fetching from data/sample-workout.json');
        
        try {
            // Show loading state
            const button = e.target;
            const originalText = button.textContent;
            button.textContent = 'Loading...';
            button.disabled = true;
            
            // Fetch workout data from fixed path
            const response = await fetch('./data/sample-workout-with-ids.json');
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('sample-workout-with-ids.json not found in data/ directory. Save a workout first.');
                }
                throw new Error(`Failed to load sample-workout-with-ids.json: ${response.statusText}`);
            }
            
            const workoutData = await response.json();
            console.log('WorkoutManager: Successfully fetched workout data from data/sample-workout-with-ids.json:', workoutData);
            
            // Load the workout data into the system
            const result = this.loadWorkoutData(workoutData);
            if (result.success) {
                this.showSuccess(`Workout "${workoutData.name}" loaded from sample-workout-with-ids.json successfully!`);
            } else {
                throw new Error(result.error);
            }
            
            // Restore button state
            button.textContent = originalText;
            button.disabled = false;
            
        } catch (error) {
            console.error('WorkoutManager: Error loading workout from data/sample-workout.json:', error);
            
            // Restore button state
            const button = e.target;
            button.textContent = button.getAttribute('data-original-text') || 'Load Workout';
            button.disabled = false;
            
            // Show appropriate error message
            let errorMessage = 'Failed to load sample-workout-with-ids.json.';
            if (error.message.includes('not found') || error.message.includes('404')) {
                errorMessage = 'sample-workout-with-ids.json not found. Save a workout first, then move the file to the data/ directory.';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'sample-workout-with-ids.json contains invalid data. Please check the file format.';
            }
            
            this.showError(errorMessage);
        }
    }

    /**
     * Handle workout file loading
     */
    handleWorkoutFileLoad(e) {
        console.log('WorkoutManager: File input changed, files:', e.target.files);
        const file = e.target.files[0];
        if (!file) {
            console.log('WorkoutManager: No file selected');
            return;
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            this.showError('Please select a JSON file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size too large. Please select a file smaller than 10MB');
            return;
        }

        console.log(`WorkoutManager: File selected - ${file.name}, ${file.type}, ${file.size} bytes`);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                console.log('WorkoutManager: File content loaded, parsing JSON...');
                const workoutData = JSON.parse(e.target.result);
                
                // Basic validation of workout data structure
                if (!workoutData || typeof workoutData !== 'object') {
                    throw new Error('Invalid workout data structure');
                }
                
                if (!workoutData.name) {
                    workoutData.name = 'Imported Workout';
                }
                
                console.log('WorkoutManager: JSON parsed successfully:', workoutData);
                console.log('WorkoutManager: Loading workout data into system...');
                
                const result = this.loadWorkoutData(workoutData);
                if (result.success) {
                    this.showSuccess(`Workout "${workoutData.name}" loaded successfully!`);
                    console.log('WorkoutManager: Workout loading completed successfully');
                } else {
                    console.error('WorkoutManager: Workout loading failed:', result.error);
                }
            } catch (error) {
                console.error('WorkoutManager: Error processing workout file:', error);
                let errorMessage = 'Invalid workout file format';
                
                if (error.message.includes('JSON')) {
                    errorMessage = 'File is not valid JSON format';
                } else if (error.message.includes('structure')) {
                    errorMessage = 'Workout file has invalid structure';
                }
                
                this.showError(errorMessage);
            }
        };
        
        reader.onerror = () => {
            console.error('WorkoutManager: Error reading file');
            this.showError('Error reading file. Please try again.');
        };
        
        reader.readAsText(file);
    }

    /**
     * Handle show workout summary
     */
    handleShowWorkoutSummary(e) {
        // Navigate to workout summary page
        if (window.app) {
            window.app.navigateTo('workout-summary');
        }
    }

    /**
     * Handle back to home
     */
    handleBackToHome(e) {
        if (window.app) {
            window.app.navigateTo('home');
        }
    }

    /**
     * Handle add exercise
     */
    handleAddExercise(e) {
        this.selectedDay = e.target.getAttribute('data-day');
        this.showModal('simple-exercise-modal');
    }

    /**
     * Handle add rest
     */
    handleAddRest(e) {
        this.selectedDay = e.target.getAttribute('data-day');
        this.showModal('simple-rest-modal');
    }

    /**
     * Handle confirm add exercise
     */
    handleConfirmAddExercise(e) {
        const exerciseSelect = document.getElementById('exercise-name-select');
        const exerciseId = exerciseSelect.value;
        const sets = parseInt(document.getElementById('sets-input').value);
        const reps = parseInt(document.getElementById('reps-input').value);
        const intensity = parseInt(document.getElementById('intensity-input').value);

        if (!exerciseId) {
            this.showError('Please select an exercise');
            return;
        }

        // Get exercise name from selected option
        const selectedOption = exerciseSelect.options[exerciseSelect.selectedIndex];
        const exerciseName = selectedOption.getAttribute('data-exercise-name') || selectedOption.textContent;

        const exercise = {
            type: 'exercise',
            exerciseId: exerciseId,  // Include exercise ID for database lookup
            name: exerciseName,
            sets: sets,
            reps: reps,
            intensity: intensity,
            weight: `${intensity}%`,  // Also store as weight for consistency
            repsCount: reps,  // Store for the JSON format
            duration: "",
            distance: "",
            pace: "",
            weightValue: 0,
            weightUnit: "kg",
            paceValue: 0,
            paceUnit: "km/h"
        };

        // Add exercise using data manager
        const result = this.workoutDataManager.addExerciseToDay(this.selectedDay, exercise);
        
        if (result.success) {
            this.closeModal();
            this.showSuccess(`${exerciseName} added to ${this.selectedDay}`);
        } else {
            this.showError(`Failed to add exercise: ${result.error}`);
        }
    }

    /**
     * Handle confirm add rest
     */
    handleConfirmAddRest(e) {
        const duration = parseInt(document.getElementById('rest-duration-input').value);
        const restType = document.getElementById('rest-type-select').value;
        
        const rest = {
            type: 'rest',
            duration: duration,
            restType: restType
        };

        // Add rest using data manager
        const result = this.workoutDataManager.addExerciseToDay(this.selectedDay, rest);
        
        if (result.success) {
            this.closeModal();
            this.showSuccess(`Rest period (${duration} min) added to ${this.selectedDay}`);
        } else {
            this.showError(`Failed to add rest period: ${result.error}`);
        }
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
        
        const exercises = this.workoutDataManager.getExercisesForDay(day);
        const item = exercises[index];
        
        if (confirm(`Remove ${item.type === 'exercise' ? item.name : 'rest period'}?`)) {
            const result = this.workoutDataManager.removeExerciseFromDay(day, index);
            
            if (result.success) {
                this.showSuccess(`${item.type === 'exercise' ? item.name : 'Rest period'} removed`);
            } else {
                this.showError(`Failed to remove item: ${result.error}`);
            }
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
        
        const exercises = this.workoutDataManager.getExercisesForDay(day);
        const exercise = exercises[index];
        
        if (exercise.type === 'exercise') {
            this.selectedDay = day;
            this.editingExerciseIndex = index;
            this.showEditExerciseModal(exercise);
        }
    }

    /**
     * Show edit exercise modal
     */
    showEditExerciseModal(exercise) {
        // Populate modal with exercise data
        document.getElementById('exercise-name-select').value = exercise.name;
        document.getElementById('sets-input').value = exercise.sets;
        document.getElementById('reps-input').value = exercise.reps;
        document.getElementById('intensity-input').value = exercise.intensity;

        // Change button text and action
        const confirmBtn = document.querySelector('[data-action="confirm-add-exercise"]');
        if (confirmBtn) {
            confirmBtn.textContent = 'Update Exercise';
            confirmBtn.setAttribute('data-action', 'confirm-edit-exercise');
        }

        this.showModal('simple-exercise-modal');
    }

    /**
     * Handle confirm edit exercise
     */
    handleConfirmEditExercise(e) {
        const exerciseName = document.getElementById('exercise-name-select').value;
        const sets = parseInt(document.getElementById('sets-input').value);
        const reps = parseInt(document.getElementById('reps-input').value);
        const intensity = parseInt(document.getElementById('intensity-input').value);

        if (!exerciseName) {
            this.showError('Please select an exercise');
            return;
        }

        const exercise = {
            type: 'exercise',
            name: exerciseName,
            sets: sets,
            reps: reps,
            intensity: intensity
        };

        // Update exercise using data manager
        const result = this.workoutDataManager.updateExerciseInDay(this.selectedDay, this.editingExerciseIndex, exercise);
        
        if (result.success) {
            this.closeModal();
            this.editingExerciseIndex = null;
            this.showSuccess(`${exercise.name} updated`);
        } else {
            this.showError(`Failed to update exercise: ${result.error}`);
        }
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    /**
     * Close modal and reset state
     */
    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            modal.classList.remove('show');
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
     * Show success message
     */
    showSuccess(message) {
        // Use app's notification system if available
        if (window.app && typeof window.app.showSuccess === 'function') {
            window.app.showSuccess(message);
        } else {
            console.log('SUCCESS:', message);
            alert(message); // Fallback
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Use app's notification system if available
        if (window.app && typeof window.app.showError === 'function') {
            window.app.showError(message);
        } else {
            console.error('ERROR:', message);
            alert(message); // Fallback
        }
    }

    /**
     * Handle show exercise demonstration
     */
    handleShowExerciseDemo(e) {
        const exerciseItem = e.target.closest('.exercise-item');
        if (!exerciseItem) return;

        const exerciseName = exerciseItem.getAttribute('data-exercise-name');
        const exerciseType = exerciseItem.getAttribute('data-exercise-type');
        const exerciseIndex = exerciseItem.getAttribute('data-exercise-index');
        
        // Don't show demo for rest periods
        if (exerciseType === 'rest') {
            return;
        }

        const dayColumn = exerciseItem.closest('.day-column');
        const day = dayColumn.getAttribute('data-day');
        
        // Get exercise data
        const exercises = this.workoutDataManager.getExercisesForDay(day);
        const exercise = exercises[parseInt(exerciseIndex)];
        
        if (exercise) {
            this.showExerciseDemonstration(exercise, day, exerciseIndex);
        }
    }

    /**
     * Handle edit exercise from item
     */
    handleEditExerciseFromItem(e) {
        const exerciseItem = e.target.closest('.exercise-item');
        if (!exerciseItem) return;

        const exerciseIndex = exerciseItem.getAttribute('data-exercise-index');
        const dayColumn = exerciseItem.closest('.day-column');
        const day = dayColumn.getAttribute('data-day');
        
        const exercises = this.workoutDataManager.getExercisesForDay(day);
        const exercise = exercises[parseInt(exerciseIndex)];
        
        if (exercise && exercise.type === 'exercise') {
            this.selectedDay = day;
            this.editingExerciseIndex = parseInt(exerciseIndex);
            this.showEditExerciseModal(exercise);
        }
    }

    /**
     * Handle delete exercise from item
     */
    handleDeleteExerciseFromItem(e) {
        const exerciseItem = e.target.closest('.exercise-item');
        if (!exerciseItem) return;

        const exerciseIndex = exerciseItem.getAttribute('data-exercise-index');
        const dayColumn = exerciseItem.closest('.day-column');
        const day = dayColumn.getAttribute('data-day');
        
        const exercises = this.workoutDataManager.getExercisesForDay(day);
        const item = exercises[parseInt(exerciseIndex)];
        
        const itemName = item.type === 'exercise' ? item.name : 'rest period';
        
        if (confirm(`Remove ${itemName}?`)) {
            const result = this.workoutDataManager.removeExerciseFromDay(day, parseInt(exerciseIndex));
            
            if (result.success) {
                this.showSuccess(`${itemName} removed`);
            } else {
                this.showError(`Failed to remove item: ${result.error}`);
            }
        }
    }

    /**
     * Wait for modal elements to be available in DOM
     */
    async waitForModalElements(retryCount = 0, maxRetries = 10) {
        const requiredElements = [
            'demo-exercise-title',
            'demo-video-container',
            'video-placeholder',
            'exercise-demonstration-modal'
        ];

        // Check if all required elements exist
        const allElementsExist = requiredElements.every(id => document.getElementById(id) !== null);
        
        if (allElementsExist) {
            return true;
        }

        if (retryCount >= maxRetries) {
            console.error('Modal elements not available after maximum retries');
            return false;
        }

        // Wait with exponential backoff
        const delay = Math.min(100 * Math.pow(1.5, retryCount), 1000);
        console.log(`Waiting for modal elements (attempt ${retryCount + 1}/${maxRetries + 1}), delay: ${delay}ms`);
        
        return new Promise((resolve) => {
            setTimeout(async () => {
                const result = await this.waitForModalElements(retryCount + 1, maxRetries);
                resolve(result);
            }, delay);
        });
    }

    /**
     * Show exercise demonstration modal
     */
    async showExerciseDemonstration(exercise, day, exerciseIndex) {
        try {
            // Store current exercise for edit functionality
            this.demonstrationExercise = { exercise, day, exerciseIndex };
            
            // Wait for modal elements to be available
            const elementsReady = await this.waitForModalElements();
            if (!elementsReady) {
                console.error('Modal elements not available, cannot show demonstration');
                return;
            }
            
            // Get enhanced exercise data if available
            let enhancedExercise = exercise;
            try {
                enhancedExercise = await this.workoutDataManager.getExerciseDataService().getExerciseData(exercise);
            } catch (error) {
                console.warn('Could not enhance exercise data:', error);
            }
            
            // Update modal content - now safely access DOM elements
            const titleElement = document.getElementById('demo-exercise-title');
            if (titleElement) {
                titleElement.textContent = `${enhancedExercise.name} - Exercise Demonstration`;
            }
            
            // Load YouTube video with enhanced data
            await this.loadExerciseVideo(enhancedExercise.name, enhancedExercise);
            
            // Show modal
            const modal = document.getElementById('exercise-demonstration-modal');
            if (modal) {
                modal.classList.add('show');
            }
        } catch (error) {
            console.error('Error showing exercise demonstration:', error);
        }
    }

    /**
     * Load exercise demonstration video
     */
    async loadExerciseVideo(exerciseName, exerciseData) {
        const videoContainer = document.getElementById('demo-video-container');
        const placeholder = document.getElementById('video-placeholder');
        
        // Check if required DOM elements exist
        if (!videoContainer || !placeholder) {
            console.warn('Video container or placeholder not found in DOM');
            return;
        }
        
        try {
            // Get exercise data service for video lookup
            const exerciseService = this.workoutDataManager.getExerciseDataService();
            
            // If we have exercise data with video ID, use it
            let videoId = null;
            if (exerciseData && exerciseData.video) {
                videoId = exerciseData.video;
            } else {
                // Try to find exercise by name in database
                const searchResults = await exerciseService.searchExercises(exerciseName);
                if (searchResults.length > 0 && searchResults[0].video) {
                    videoId = searchResults[0].video;
                }
            }
            
            if (videoId) {
                // Create YouTube iframe
                const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                videoContainer.innerHTML = `
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="${embedUrl}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
                console.log(`Loaded YouTube video for ${exerciseName}: ${videoId}`);
            } else {
                // Show placeholder when no video is available
                placeholder.innerHTML = `
                    <div class="placeholder-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <p>Exercise demonstration for:</p>
                        <h3>${exerciseName}</h3>
                        <p>Video not available for this exercise</p>
                    </div>
                `;
                console.log(`No video found for exercise: ${exerciseName}`);
            }
        } catch (error) {
            console.error('Error loading exercise video:', error);
            
            // Show error placeholder
            placeholder.innerHTML = `
                <div class="placeholder-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <p>Exercise demonstration for:</p>
                    <h3>${exerciseName}</h3>
                    <p>Unable to load video</p>
                </div>
            `;
        }
    }

    /**
     * Close exercise demonstration modal
     */
    closeExerciseDemonstration() {
        const modal = document.getElementById('exercise-demonstration-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.demonstrationExercise = null;
    }

    /**
     * Handle edit exercise from demonstration modal
     */
    handleEditExerciseFromDemo(e) {
        if (this.demonstrationExercise) {
            this.closeExerciseDemonstration();
            
            const { exercise, day, exerciseIndex } = this.demonstrationExercise;
            this.selectedDay = day;
            this.editingExerciseIndex = parseInt(exerciseIndex);
            this.showEditExerciseModal(exercise);
        }
    }


    /**
     * Handle drag start
     */
    handleDragStart(e) {
        const exerciseItem = e.target.closest('.exercise-item');
        if (!exerciseItem) return;

        exerciseItem.classList.add('dragging');
        
        // Store drag data
        this.dragData = {
            element: exerciseItem,
            sourceDay: exerciseItem.closest('.day-column').getAttribute('data-day'),
            sourceIndex: parseInt(exerciseItem.getAttribute('data-exercise-index'))
        };
        
        e.dataTransfer.effectAllowed = 'move';
    }

    /**
     * Handle drag over
     */
    handleDragOver(e) {
        const dayColumn = e.target.closest('.day-column');
        if (!dayColumn || !this.dragData) return;

        // Add visual feedback
        dayColumn.classList.add('drag-over');
        
        // Find the best insertion point
        const exerciseCards = dayColumn.querySelector('.exercise-cards');
        const exerciseItems = Array.from(exerciseCards.querySelectorAll('.exercise-item:not(.dragging)'));
        
        let insertAfter = null;
        for (const item of exerciseItems) {
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                break;
            }
            insertAfter = item;
        }
        
        // Remove existing drop zones
        dayColumn.querySelectorAll('.exercise-drop-zone').forEach(zone => zone.remove());
        
        // Add drop zone indicator
        const dropZone = document.createElement('div');
        dropZone.className = 'exercise-drop-zone active';
        
        if (insertAfter) {
            insertAfter.insertAdjacentElement('afterend', dropZone);
        } else {
            exerciseCards.insertAdjacentElement('afterbegin', dropZone);
        }
    }

    /**
     * Handle drop
     */
    handleDrop(e) {
        if (!this.dragData) return;

        const dayColumn = e.target.closest('.day-column');
        if (!dayColumn) return;

        const targetDay = dayColumn.getAttribute('data-day');
        const exerciseCards = dayColumn.querySelector('.exercise-cards');
        const exerciseItems = Array.from(exerciseCards.querySelectorAll('.exercise-item:not(.dragging)'));
        
        // Calculate target index
        let targetIndex = 0;
        for (const item of exerciseItems) {
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                break;
            }
            targetIndex++;
        }

        // Perform the move if it's a valid operation
        const { sourceDay, sourceIndex } = this.dragData;
        
        if (sourceDay !== targetDay || sourceIndex !== targetIndex) {
            // Adjust target index if moving within the same day
            if (sourceDay === targetDay && sourceIndex < targetIndex) {
                targetIndex--;
            }
            
            const result = this.workoutDataManager.moveExercise(sourceDay, sourceIndex, targetDay, targetIndex);
            
            if (result.success) {
                this.showSuccess('Exercise moved successfully');
            } else {
                this.showError(`Failed to move exercise: ${result.error}`);
            }
        }
        
        this.handleDragEnd(e);
    }

    /**
     * Handle drag end
     */
    handleDragEnd(e) {
        // Clean up drag state
        document.querySelectorAll('.exercise-item.dragging').forEach(item => {
            item.classList.remove('dragging');
        });
        
        document.querySelectorAll('.day-column.drag-over').forEach(column => {
            column.classList.remove('drag-over');
        });
        
        document.querySelectorAll('.exercise-drop-zone').forEach(zone => {
            zone.remove();
        });
        
        this.dragData = null;
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        this.isInitialized = false;
        // Note: Since we use event delegation, we don't need to remove individual listeners
    }
}