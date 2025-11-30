/**
 * Workout Domain Entity
 * Represents a complete workout with exercises, schedule, and metadata
 */
export class Workout {
    constructor({
        id = null,
        name,
        description = '',
        category = 'custom',
        duration = '30-45 minutes',
        difficulty = 3,
        targetMuscles = [],
        equipment = [],
        exercises = [],
        frequency = '3 times per week',
        tags = [],
        createdAt = new Date(),
        updatedAt = new Date()
    }) {
        this.validateInputs({ name, difficulty });
        
        this.id = id || this.generateId();
        this.name = name;
        this.description = description;
        this.category = category;
        this.duration = duration;
        this.difficulty = difficulty;
        this.targetMuscles = targetMuscles;
        this.equipment = equipment;
        this.exercises = exercises;
        this.frequency = frequency;
        this.tags = tags;
        this.createdAt = new Date(createdAt);
        this.updatedAt = new Date(updatedAt);
    }

    validateInputs({ name, difficulty }) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Workout name is required and must be a non-empty string');
        }
        
        if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 10) {
            throw new Error('Difficulty must be an integer between 1 and 10');
        }
    }

    generateId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `workout-${timestamp}-${random}`;
    }

    /**
     * Add an exercise to the workout
     */
    addExercise(exercise) {
        if (!exercise || typeof exercise !== 'object') {
            throw new Error('Exercise must be a valid exercise object');
        }
        
        this.exercises.push({
            ...exercise,
            sets: exercise.sets || 3,
            reps: exercise.reps || '8-12',
            rest: exercise.rest || '60s',
            notes: exercise.notes || ''
        });
        
        this.updatedAt = new Date();
        this.updateWorkoutMetadata();
    }

    /**
     * Remove an exercise from the workout by index
     */
    removeExercise(index) {
        if (index < 0 || index >= this.exercises.length) {
            throw new Error('Invalid exercise index');
        }
        
        this.exercises.splice(index, 1);
        this.updatedAt = new Date();
        this.updateWorkoutMetadata();
    }

    /**
     * Update exercise details at specific index
     */
    updateExercise(index, updates) {
        if (index < 0 || index >= this.exercises.length) {
            throw new Error('Invalid exercise index');
        }
        
        this.exercises[index] = { ...this.exercises[index], ...updates };
        this.updatedAt = new Date();
    }

    /**
     * Reorder exercises
     */
    reorderExercises(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.exercises.length ||
            toIndex < 0 || toIndex >= this.exercises.length) {
            throw new Error('Invalid exercise indices');
        }
        
        const [exercise] = this.exercises.splice(fromIndex, 1);
        this.exercises.splice(toIndex, 0, exercise);
        this.updatedAt = new Date();
    }

    /**
     * Update workout metadata based on exercises
     */
    updateWorkoutMetadata() {
        if (this.exercises.length === 0) return;
        
        // Update target muscles
        const muscles = new Set();
        this.exercises.forEach(exercise => {
            if (exercise.targetMuscles) {
                exercise.targetMuscles.forEach(muscle => muscles.add(muscle));
            }
        });
        this.targetMuscles = Array.from(muscles);
        
        // Update equipment needed
        const equipmentSet = new Set();
        this.exercises.forEach(exercise => {
            if (exercise.equipment) {
                equipmentSet.add(exercise.equipment);
            }
        });
        this.equipment = Array.from(equipmentSet);
        
        // Update difficulty (average of all exercises)
        const avgDifficulty = this.exercises.reduce((sum, exercise) => {
            return sum + (exercise.difficultyLevel || 3);
        }, 0) / this.exercises.length;
        this.difficulty = Math.round(avgDifficulty);
    }

    /**
     * Calculate total estimated calories burned
     */
    calculateTotalCalories(userWeight = 70) {
        return this.exercises.reduce((total, exercise) => {
            const avgSets = typeof exercise.sets === 'number' ? exercise.sets : 3;
            const estimatedDuration = avgSets * 1.5; // Assume 1.5 min per set including rest
            
            if (exercise.caloriesPerMinute) {
                const avgCaloriesPerMinute = (exercise.caloriesPerMinute.min + exercise.caloriesPerMinute.max) / 2;
                const weightFactor = userWeight / 70;
                return total + (avgCaloriesPerMinute * estimatedDuration * weightFactor);
            }
            
            return total;
        }, 0);
    }

    /**
     * Get estimated workout duration in minutes
     */
    getEstimatedDuration() {
        const exerciseTime = this.exercises.reduce((total, exercise) => {
            const sets = typeof exercise.sets === 'number' ? exercise.sets : 3;
            const restTime = this.parseRestTime(exercise.rest || '60s');
            return total + (sets * 1) + ((sets - 1) * restTime / 60); // 1 min per set + rest between sets
        }, 0);
        
        return Math.round(exerciseTime + 10); // Add 10 minutes for warm-up/cool-down
    }

    /**
     * Parse rest time string to seconds
     */
    parseRestTime(restStr) {
        if (typeof restStr === 'number') return restStr;
        
        const match = restStr.match(/(\d+)([smh]?)/i);
        if (!match) return 60; // Default 60 seconds
        
        const value = parseInt(match[1]);
        const unit = match[2]?.toLowerCase() || 's';
        
        switch (unit) {
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 's':
            default: return value;
        }
    }

    /**
     * Check if workout is suitable for specific equipment
     */
    isCompatibleWithEquipment(availableEquipment) {
        return this.equipment.every(required => availableEquipment.includes(required));
    }

    /**
     * Check if workout targets specific muscle groups
     */
    targetsMuscleSGroups(desiredMuscles) {
        return desiredMuscles.some(muscle => this.targetMuscles.includes(muscle));
    }

    /**
     * Get workout difficulty as text
     */
    getDifficultyText() {
        const levels = {
            1: 'Very Easy',
            2: 'Easy',
            3: 'Easy-Medium',
            4: 'Medium',
            5: 'Medium',
            6: 'Medium-Hard',
            7: 'Hard',
            8: 'Very Hard',
            9: 'Extremely Hard',
            10: 'Expert'
        };
        return levels[this.difficulty] || 'Unknown';
    }

    /**
     * Check if workout is suitable for beginners
     */
    isBeginner() {
        return this.difficulty <= 4;
    }

    /**
     * Get workout summary statistics
     */
    getStats() {
        return {
            totalExercises: this.exercises.length,
            estimatedDuration: this.getEstimatedDuration(),
            estimatedCalories: Math.round(this.calculateTotalCalories()),
            difficulty: this.getDifficultyText(),
            targetMuscles: this.targetMuscles.length,
            equipmentNeeded: this.equipment.length
        };
    }

    /**
     * Clone the workout with a new name
     */
    clone(newName) {
        return new Workout({
            ...this.toJSON(),
            id: null,
            name: newName,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            duration: this.duration,
            difficulty: this.difficulty,
            targetMuscles: this.targetMuscles,
            equipment: this.equipment,
            exercises: this.exercises,
            frequency: this.frequency,
            tags: this.tags,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Create Workout instance from plain object
     */
    static fromJSON(data) {
        return new Workout(data);
    }

    /**
     * Create multiple Workout instances from array of plain objects
     */
    static fromJSONArray(dataArray) {
        return dataArray.map(data => Workout.fromJSON(data));
    }
}