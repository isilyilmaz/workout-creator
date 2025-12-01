/**
 * Exercise Data Service
 * Provides access to exercise database with caching and lookup functionality
 */

export class ExerciseDataService {
    constructor() {
        this.exercises = new Map(); // Cache for exercise data
        this.isLoaded = false;
        this.loadPromise = null;
    }

    /**
     * Load exercise database from JSON file
     */
    async loadExerciseDatabase() {
        // Return existing promise if already loading
        if (this.loadPromise) {
            return this.loadPromise;
        }

        // Return immediately if already loaded
        if (this.isLoaded) {
            return Promise.resolve();
        }

        this.loadPromise = this._loadExerciseData();
        return this.loadPromise;
    }

    /**
     * Private method to fetch and cache exercise data
     */
    async _loadExerciseData() {
        try {
            console.log('ExerciseDataService: Loading exercise database...');
            const response = await fetch('./data/exercise-data-with-ids.json');
            
            if (!response.ok) {
                throw new Error(`Failed to load exercise database: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.exercises || !Array.isArray(data.exercises)) {
                throw new Error('Invalid exercise database format: missing exercises array');
            }

            // Cache exercises by ID for fast lookup
            data.exercises.forEach(exercise => {
                if (exercise.id) {
                    this.exercises.set(exercise.id, exercise);
                }
            });

            this.isLoaded = true;
            console.log(`ExerciseDataService: Loaded ${this.exercises.size} exercises`);
            
        } catch (error) {
            console.error('ExerciseDataService: Error loading exercise database:', error);
            this.loadPromise = null;
            throw error;
        }
    }

    /**
     * Get exercise by ID
     */
    async getExerciseById(exerciseId) {
        if (!exerciseId) {
            return null;
        }

        await this.loadExerciseDatabase();
        return this.exercises.get(exerciseId) || null;
    }

    /**
     * Get exercise data with fallback for missing IDs
     */
    async getExerciseData(exercise) {
        // If exercise has an ID, try to get enhanced data
        if (exercise.exerciseId) {
            const enhancedData = await this.getExerciseById(exercise.exerciseId);
            if (enhancedData) {
                return {
                    ...exercise,
                    ...enhancedData,
                    // Keep workout-specific data (sets, reps, etc.)
                    sets: exercise.sets,
                    reps: exercise.reps,
                    repsCount: exercise.repsCount,
                    intensity: exercise.intensity || exercise.weight,
                    type: exercise.type
                };
            }
        }

        // Fallback to original exercise data
        return exercise;
    }

    /**
     * Get YouTube video URL for exercise
     */
    getVideoUrl(exercise) {
        if (exercise.video) {
            return `https://www.youtube.com/watch?v=${exercise.video}`;
        }
        return null;
    }

    /**
     * Get YouTube embed URL for exercise
     */
    getEmbedUrl(exercise) {
        if (exercise.video) {
            return `https://www.youtube.com/embed/${exercise.video}`;
        }
        return null;
    }

    /**
     * Search exercises by name
     */
    async searchExercises(searchTerm) {
        await this.loadExerciseDatabase();
        
        const term = searchTerm.toLowerCase();
        const results = [];
        
        for (const exercise of this.exercises.values()) {
            if (exercise.name.toLowerCase().includes(term)) {
                results.push(exercise);
            }
        }
        
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get all exercises
     */
    async getAllExercises() {
        await this.loadExerciseDatabase();
        return Array.from(this.exercises.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get exercises by target muscle
     */
    async getExercisesByMuscle(muscle) {
        await this.loadExerciseDatabase();
        
        const results = [];
        for (const exercise of this.exercises.values()) {
            if (exercise.targetMuscles && exercise.targetMuscles.includes(muscle)) {
                results.push(exercise);
            }
        }
        
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get exercises by equipment
     */
    async getExercisesByEquipment(equipment) {
        await this.loadExerciseDatabase();
        
        const results = [];
        for (const exercise of this.exercises.values()) {
            if (exercise.equipment === equipment) {
                results.push(exercise);
            }
        }
        
        return results.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * Get exercise instructions/tips (placeholder for future enhancement)
     */
    getExerciseInstructions(exercise) {
        const instructions = [];
        
        // Default instructions based on exercise type
        if (exercise.targetMuscles) {
            instructions.push(`Targets: ${exercise.targetMuscles.join(', ')}`);
        }
        
        if (exercise.equipment) {
            instructions.push(`Equipment needed: ${exercise.equipment}`);
        }
        
        if (exercise.difficultyLevel) {
            instructions.push(`Difficulty level: ${exercise.difficultyLevel}/10`);
        }

        // Add generic form tips
        instructions.push('Maintain proper form throughout the movement');
        instructions.push('Control the weight during both positive and negative phases');
        instructions.push('Breathe properly - exhale on exertion, inhale on return');
        
        return instructions;
    }

    /**
     * Get exercise form tips
     */
    getFormTips(exercise) {
        const tips = [];
        
        // Generic tips - could be expanded with exercise-specific data
        tips.push('Focus on proper form over heavy weight');
        tips.push('Start with lighter weight to master the technique');
        tips.push('Keep your core engaged throughout the movement');
        
        if (exercise.targetMuscles && exercise.targetMuscles.includes('back')) {
            tips.push('Keep your back straight and shoulder blades pulled back');
        }
        
        if (exercise.targetMuscles && exercise.targetMuscles.includes('chest')) {
            tips.push('Lower the weight slowly and press up explosively');
        }
        
        return tips;
    }

    /**
     * Check if service is loaded
     */
    isServiceLoaded() {
        return this.isLoaded;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            isLoaded: this.isLoaded,
            exerciseCount: this.exercises.size,
            loadPromise: !!this.loadPromise
        };
    }

    /**
     * Clear cache and force reload
     */
    clearCache() {
        this.exercises.clear();
        this.isLoaded = false;
        this.loadPromise = null;
    }
}