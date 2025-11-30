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
                this.updateWorkoutNameInput();
                this.populateAllDays();
                break;
            case 'exerciseAdded':
            case 'exerciseUpdated':
            case 'exerciseRemoved':
                this.renderDayExercises(data.day);
                break;
            case 'dayCleared':
                this.renderDayExercises(data.day);
                break;
            case 'workoutReset':
                this.updateWorkoutNameInput();
                this.populateAllDays();
                break;
        }
    }

    /**
     * Initialize workout management for a page
     */
    initialize() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.isInitialized = true;
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
            } else if (e.target.matches('.remove-exercise')) {
                this.handleRemoveExercise(e);
            } else if (e.target.closest('.exercise-card')) {
                this.handleEditExerciseCard(e);
            }
        });

        // File input change event
        document.addEventListener('change', (e) => {
            if (e.target.matches('#workout-file-input')) {
                this.handleWorkoutFileLoad(e);
            }
        });

        // Workout name input change
        document.addEventListener('input', (e) => {
            if (e.target.matches('#workout-name-input')) {
                this.workoutDataManager.updateWorkoutMetadata({ name: e.target.value });
            }
        });
    }

    /**
     * Load workout data and populate interface
     */
    loadWorkoutData(data) {
        const result = this.workoutDataManager.loadWorkoutData(data);
        if (!result.success) {
            this.showError(`Failed to load workout: ${result.error}`);
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
        Object.keys(allDays).forEach(day => {
            console.log(`Processing day: ${day}`);
            this.renderDayExercises(day);
        });
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

        const exercises = this.workoutDataManager.getExercisesForDay(day);
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
     * Handle save workout
     */
    handleSaveWorkout(e) {
        try {
            const exportData = this.workoutDataManager.createExportBlob('json');
            const url = URL.createObjectURL(exportData.blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = exportData.filename;
            link.click();
            
            const workoutData = this.workoutDataManager.getWorkoutData();
            this.showSuccess(`Workout "${workoutData.name}" saved successfully!`);
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
     * Handle workout file loading
     */
    handleWorkoutFileLoad(e) {
        console.log('File input changed, files:', e.target.files);
        const file = e.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File selected:', file.name, file.type, file.size);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                console.log('File content loaded, parsing JSON...');
                const workoutData = JSON.parse(e.target.result);
                console.log('JSON parsed successfully:', workoutData);
                this.loadWorkoutData(workoutData);
                this.showSuccess(`Workout "${workoutData.name}" loaded successfully!`);
            } catch (error) {
                console.error('Error loading workout:', error);
                this.showError('Invalid workout file format');
            }
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
     * Cleanup event listeners
     */
    cleanup() {
        this.isInitialized = false;
        // Note: Since we use event delegation, we don't need to remove individual listeners
    }
}