/**
 * Workout Data Manager
 * Centralized workout data management to eliminate duplication between controllers
 * Provides a unified interface for workout data operations
 */

export class WorkoutDataManager {
    constructor() {
        this.workoutData = this.createEmptyWorkout();
        this.observers = new Set();
        this.validationRules = {
            name: { required: true, minLength: 1 },
            days: { required: true, type: 'object' },
            exercises: { required: false, type: 'array' }
        };
    }

    /**
     * Create empty workout structure
     */
    createEmptyWorkout() {
        return {
            id: this.generateId(),
            name: 'My Custom Workout',
            description: '',
            difficulty: 5,
            days: {
                monday: [],
                tuesday: [],
                wednesday: [],
                thursday: [],
                friday: [],
                saturday: [],
                sunday: []
            },
            targetMuscles: [],
            equipment: [],
            duration: '',
            tags: ['custom'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Generate unique ID for workout
     */
    generateId() {
        return 'workout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current workout data
     */
    getWorkoutData() {
        return { ...this.workoutData };
    }

    /**
     * Load workout data
     */
    loadWorkoutData(data) {
        try {
            console.log('WorkoutDataManager: Loading workout data', data);
            
            // Validate incoming data
            const validationResult = this.validateWorkoutData(data);
            if (!validationResult.isValid) {
                throw new Error(`Invalid workout data: ${validationResult.errors.join(', ')}`);
            }

            // Ensure all required day structures exist
            const processedData = this.normalizeWorkoutData(data);
            
            this.workoutData = { ...processedData };
            this.workoutData.updatedAt = new Date().toISOString();

            // Notify observers
            this.notifyObservers('workoutLoaded', this.workoutData);
            
            console.log('WorkoutDataManager: Workout data loaded successfully');
            return { success: true };
            
        } catch (error) {
            console.error('WorkoutDataManager: Error loading workout data:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update workout metadata
     */
    updateWorkoutMetadata(updates) {
        const allowedFields = ['name', 'description', 'difficulty', 'targetMuscles', 'equipment', 'duration', 'tags'];
        const validUpdates = {};

        // Filter allowed updates
        allowedFields.forEach(field => {
            if (updates.hasOwnProperty(field)) {
                validUpdates[field] = updates[field];
            }
        });

        Object.assign(this.workoutData, validUpdates);
        this.workoutData.updatedAt = new Date().toISOString();

        this.notifyObservers('workoutMetadataUpdated', validUpdates);
        return this.workoutData;
    }

    /**
     * Add exercise to a specific day
     */
    addExerciseToDay(day, exercise) {
        try {
            if (!this.workoutData.days[day]) {
                this.workoutData.days[day] = [];
            }

            const exerciseWithMetadata = {
                id: this.generateId(),
                ...exercise,
                type: exercise.type || 'exercise',
                addedAt: new Date().toISOString()
            };

            this.workoutData.days[day].push(exerciseWithMetadata);
            this.workoutData.updatedAt = new Date().toISOString();

            this.notifyObservers('exerciseAdded', { day, exercise: exerciseWithMetadata });
            return { success: true, exercise: exerciseWithMetadata };

        } catch (error) {
            console.error('WorkoutDataManager: Error adding exercise:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update exercise in a specific day
     */
    updateExerciseInDay(day, exerciseIndex, updates) {
        try {
            if (!this.workoutData.days[day] || !this.workoutData.days[day][exerciseIndex]) {
                throw new Error('Exercise not found');
            }

            const exercise = this.workoutData.days[day][exerciseIndex];
            Object.assign(exercise, updates);
            exercise.updatedAt = new Date().toISOString();
            this.workoutData.updatedAt = new Date().toISOString();

            this.notifyObservers('exerciseUpdated', { day, exerciseIndex, exercise });
            return { success: true, exercise };

        } catch (error) {
            console.error('WorkoutDataManager: Error updating exercise:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove exercise from a specific day
     */
    removeExerciseFromDay(day, exerciseIndex) {
        try {
            if (!this.workoutData.days[day] || !this.workoutData.days[day][exerciseIndex]) {
                throw new Error('Exercise not found');
            }

            const removedExercise = this.workoutData.days[day].splice(exerciseIndex, 1)[0];
            this.workoutData.updatedAt = new Date().toISOString();

            this.notifyObservers('exerciseRemoved', { day, exerciseIndex, exercise: removedExercise });
            return { success: true, exercise: removedExercise };

        } catch (error) {
            console.error('WorkoutDataManager: Error removing exercise:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get exercises for a specific day
     */
    getExercisesForDay(day) {
        return [...(this.workoutData.days[day] || [])];
    }

    /**
     * Get all days with exercises
     */
    getAllDays() {
        return { ...this.workoutData.days };
    }

    /**
     * Move exercise between days or reorder within day
     */
    moveExercise(fromDay, fromIndex, toDay, toIndex) {
        try {
            if (!this.workoutData.days[fromDay] || !this.workoutData.days[fromDay][fromIndex]) {
                throw new Error('Source exercise not found');
            }

            if (!this.workoutData.days[toDay]) {
                this.workoutData.days[toDay] = [];
            }

            const exercise = this.workoutData.days[fromDay].splice(fromIndex, 1)[0];
            exercise.updatedAt = new Date().toISOString();
            
            const insertIndex = Math.min(toIndex, this.workoutData.days[toDay].length);
            this.workoutData.days[toDay].splice(insertIndex, 0, exercise);
            
            this.workoutData.updatedAt = new Date().toISOString();

            this.notifyObservers('exerciseMoved', { 
                fromDay, fromIndex, toDay, toIndex: insertIndex, exercise 
            });
            
            return { success: true, exercise };

        } catch (error) {
            console.error('WorkoutDataManager: Error moving exercise:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear all exercises from a day
     */
    clearDay(day) {
        if (!this.workoutData.days[day]) {
            return { success: true, removedExercises: [] };
        }

        const removedExercises = [...this.workoutData.days[day]];
        this.workoutData.days[day] = [];
        this.workoutData.updatedAt = new Date().toISOString();

        this.notifyObservers('dayCleared', { day, removedExercises });
        return { success: true, removedExercises };
    }

    /**
     * Reset to empty workout
     */
    resetWorkout() {
        this.workoutData = this.createEmptyWorkout();
        this.notifyObservers('workoutReset', this.workoutData);
        return this.workoutData;
    }

    /**
     * Calculate workout statistics
     */
    calculateWorkoutStats() {
        const stats = {
            totalExercises: 0,
            totalSets: 0,
            exercisesByDay: {},
            muscleGroupsTargeted: new Set(),
            equipmentUsed: new Set(),
            estimatedDuration: 0
        };

        Object.entries(this.workoutData.days).forEach(([day, exercises]) => {
            const dayExercises = exercises.filter(ex => ex.type === 'exercise');
            stats.exercisesByDay[day] = dayExercises.length;
            stats.totalExercises += dayExercises.length;

            dayExercises.forEach(exercise => {
                // Count sets
                if (exercise.sets) {
                    stats.totalSets += parseInt(exercise.sets) || 0;
                }

                // Track muscle groups
                if (exercise.muscleGroups) {
                    exercise.muscleGroups.forEach(muscle => stats.muscleGroupsTargeted.add(muscle));
                }

                // Track equipment
                if (exercise.equipment) {
                    stats.equipmentUsed.add(exercise.equipment);
                }
            });
        });

        // Convert sets to arrays
        stats.muscleGroupsTargeted = Array.from(stats.muscleGroupsTargeted);
        stats.equipmentUsed = Array.from(stats.equipmentUsed);

        return stats;
    }

    /**
     * Export workout to JSON
     */
    exportToJSON() {
        const exportData = {
            ...this.workoutData,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Create a downloadable blob for workout export
     */
    createExportBlob(format = 'json') {
        let content, mimeType, extension;

        switch (format.toLowerCase()) {
            case 'json':
                content = this.exportToJSON();
                mimeType = 'application/json';
                extension = 'json';
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }

        return {
            blob: new Blob([content], { type: mimeType }),
            filename: `${this.workoutData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`
        };
    }

    /**
     * Validate workout data structure
     */
    validateWorkoutData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            errors.push('Workout data must be an object');
            return { isValid: false, errors };
        }

        // Check required fields
        if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
            errors.push('Workout name is required and must be a non-empty string');
        }

        if (!data.days || typeof data.days !== 'object') {
            errors.push('Workout days must be an object');
        } else {
            // Validate days structure
            const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            requiredDays.forEach(day => {
                if (data.days[day] && !Array.isArray(data.days[day])) {
                    errors.push(`Day ${day} must be an array`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Normalize workout data to ensure consistency
     */
    normalizeWorkoutData(data) {
        const normalized = { ...data };

        // Ensure all days exist
        const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!normalized.days) {
            normalized.days = {};
        }

        requiredDays.forEach(day => {
            if (!normalized.days[day]) {
                normalized.days[day] = [];
            }
        });

        // Set default values
        if (!normalized.id) {
            normalized.id = this.generateId();
        }

        if (!normalized.difficulty) {
            normalized.difficulty = 5;
        }

        if (!normalized.tags) {
            normalized.tags = ['custom'];
        }

        if (!normalized.createdAt) {
            normalized.createdAt = new Date().toISOString();
        }

        return normalized;
    }

    /**
     * Add observer for workout data changes
     */
    addObserver(observer) {
        if (typeof observer === 'function') {
            this.observers.add(observer);
        }
    }

    /**
     * Remove observer
     */
    removeObserver(observer) {
        this.observers.delete(observer);
    }

    /**
     * Notify all observers of changes
     */
    notifyObservers(event, data) {
        this.observers.forEach(observer => {
            try {
                observer(event, data, this.workoutData);
            } catch (error) {
                console.error('WorkoutDataManager: Error in observer:', error);
            }
        });
    }

    /**
     * Create a deep copy of workout data
     */
    cloneWorkout(newName = null) {
        const cloned = JSON.parse(JSON.stringify(this.workoutData));
        cloned.id = this.generateId();
        cloned.name = newName || `${cloned.name} (Copy)`;
        cloned.createdAt = new Date().toISOString();
        cloned.updatedAt = new Date().toISOString();
        return cloned;
    }

    /**
     * Get workout summary
     */
    getWorkoutSummary() {
        const stats = this.calculateWorkoutStats();
        return {
            name: this.workoutData.name,
            difficulty: this.workoutData.difficulty,
            totalExercises: stats.totalExercises,
            totalSets: stats.totalSets,
            muscleGroups: stats.muscleGroupsTargeted,
            equipment: stats.equipmentUsed,
            daysWithExercises: Object.keys(stats.exercisesByDay).filter(day => stats.exercisesByDay[day] > 0),
            lastUpdated: this.workoutData.updatedAt
        };
    }
}