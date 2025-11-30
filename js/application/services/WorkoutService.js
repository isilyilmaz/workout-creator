/**
 * Workout Service
 * Application service for workout-related business logic
 */
import { WorkoutRepository } from '../../infrastructure/repositories/WorkoutRepository.js';
import { ExerciseService } from './ExerciseService.js';
import { Workout } from '../../domain/entities/Workout.js';

export class WorkoutService {
    constructor() {
        this.workoutRepository = new WorkoutRepository();
        this.exerciseService = new ExerciseService();
    }

    /**
     * Get all workouts (predefined + user-created)
     */
    async getAllWorkouts() {
        try {
            return await this.workoutRepository.getAllWorkouts();
        } catch (error) {
            console.error('Error fetching workouts:', error);
            throw new Error('Failed to load workouts');
        }
    }

    /**
     * Get predefined workouts
     */
    async getPredefinedWorkouts() {
        try {
            return await this.workoutRepository.getPredefinedWorkouts();
        } catch (error) {
            console.error('Error fetching predefined workouts:', error);
            return [];
        }
    }

    /**
     * Get user workouts
     */
    async getUserWorkouts() {
        try {
            return await this.workoutRepository.getUserWorkouts();
        } catch (error) {
            console.error('Error fetching user workouts:', error);
            return [];
        }
    }

    /**
     * Get workout by ID
     */
    async getWorkout(id) {
        try {
            return await this.workoutRepository.getById(id);
        } catch (error) {
            console.error('Error fetching workout:', error);
            return null;
        }
    }

    /**
     * Create new workout
     */
    async createWorkout(workoutData) {
        try {
            const validation = this.validateWorkout(workoutData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const workout = new Workout(workoutData);
            return await this.workoutRepository.saveUserWorkout(workout);
        } catch (error) {
            console.error('Error creating workout:', error);
            throw error;
        }
    }

    /**
     * Update workout
     */
    async updateWorkout(id, updates) {
        try {
            const existing = await this.getWorkout(id);
            if (!existing) {
                throw new Error('Workout not found');
            }

            return await this.workoutRepository.updateUserWorkout(id, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating workout:', error);
            throw error;
        }
    }

    /**
     * Delete workout
     */
    async deleteWorkout(id) {
        try {
            return await this.workoutRepository.deleteUserWorkout(id);
        } catch (error) {
            console.error('Error deleting workout:', error);
            throw error;
        }
    }

    /**
     * Duplicate workout
     */
    async duplicateWorkout(workoutId, newName) {
        try {
            return await this.workoutRepository.duplicateWorkout(workoutId, newName);
        } catch (error) {
            console.error('Error duplicating workout:', error);
            throw error;
        }
    }

    /**
     * Search workouts
     */
    async searchWorkouts(query) {
        try {
            if (!query || query.trim() === '') {
                return await this.getAllWorkouts();
            }
            return await this.workoutRepository.searchWorkouts(query.trim());
        } catch (error) {
            console.error('Error searching workouts:', error);
            return [];
        }
    }

    /**
     * Filter workouts
     */
    async filterWorkouts(filters) {
        try {
            return await this.workoutRepository.advancedFilter(filters);
        } catch (error) {
            console.error('Error filtering workouts:', error);
            return [];
        }
    }

    /**
     * Get workouts by category
     */
    async getWorkoutsByCategory(category) {
        try {
            return await this.workoutRepository.getByCategory(category);
        } catch (error) {
            console.error('Error fetching workouts by category:', error);
            return [];
        }
    }

    /**
     * Get recommended workouts for user
     */
    async getRecommendedWorkouts(userProfile, limit = 5) {
        try {
            return await this.workoutRepository.getRecommendedWorkouts(userProfile, limit);
        } catch (error) {
            console.error('Error getting recommended workouts:', error);
            return [];
        }
    }

    /**
     * Generate workout from exercises
     */
    async generateWorkout(options) {
        try {
            const {
                name,
                targetMuscles = [],
                equipment = [],
                difficulty = 5,
                duration = 45,
                exerciseCount = 6,
                userProfile = {}
            } = options;

            // Get compatible exercises
            let exercises = await this.exerciseService.filterExercises({
                muscleGroups: targetMuscles,
                equipment,
                difficultyRange: [Math.max(1, difficulty - 2), Math.min(10, difficulty + 2)],
                maxResults: exerciseCount * 2 // Get more exercises to choose from
            });

            // If not enough exercises found, expand criteria
            if (exercises.length < exerciseCount) {
                exercises = await this.exerciseService.filterExercises({
                    equipment: equipment.length > 0 ? equipment : ['bodyweight', 'dumbbell'],
                    maxResults: exerciseCount * 2
                });
            }

            // Select diverse exercises (different muscle groups)
            const selectedExercises = this.selectDiverseExercises(exercises, exerciseCount, targetMuscles);

            // Create workout exercises with sets/reps
            const workoutExercises = selectedExercises.map(exercise => ({
                ...exercise.toJSON(),
                sets: this.calculateSets(exercise, difficulty),
                reps: this.calculateReps(exercise, difficulty),
                rest: this.calculateRest(exercise),
                notes: ''
            }));

            // Create workout
            const workoutData = {
                name: name || 'Custom Workout',
                description: `Auto-generated workout targeting ${targetMuscles.join(', ')}`,
                category: 'custom',
                difficulty,
                targetMuscles,
                equipment: [...new Set(selectedExercises.map(e => e.equipment))],
                exercises: workoutExercises,
                duration: `${duration} minutes`,
                tags: ['custom', 'generated']
            };

            return new Workout(workoutData);
        } catch (error) {
            console.error('Error generating workout:', error);
            throw error;
        }
    }

    /**
     * Select diverse exercises from available options
     */
    selectDiverseExercises(exercises, count, targetMuscles) {
        if (exercises.length <= count) {
            return exercises;
        }

        const selected = [];
        const usedMuscles = new Set();
        const remaining = [...exercises];

        // First, try to get one exercise per target muscle
        targetMuscles.forEach(muscle => {
            const exerciseIndex = remaining.findIndex(ex => 
                ex.targetMuscles.includes(muscle) && !usedMuscles.has(ex.getPrimaryMuscleGroup())
            );
            
            if (exerciseIndex !== -1) {
                const exercise = remaining.splice(exerciseIndex, 1)[0];
                selected.push(exercise);
                usedMuscles.add(exercise.getPrimaryMuscleGroup());
            }
        });

        // Fill remaining slots with diverse exercises
        while (selected.length < count && remaining.length > 0) {
            // Prefer exercises that target different muscle groups
            let exerciseIndex = remaining.findIndex(ex => 
                !usedMuscles.has(ex.getPrimaryMuscleGroup())
            );
            
            // If all muscle groups are covered, just take the next exercise
            if (exerciseIndex === -1) {
                exerciseIndex = 0;
            }

            const exercise = remaining.splice(exerciseIndex, 1)[0];
            selected.push(exercise);
            usedMuscles.add(exercise.getPrimaryMuscleGroup());
        }

        return selected;
    }

    /**
     * Calculate sets for exercise based on difficulty
     */
    calculateSets(exercise, workoutDifficulty) {
        if (exercise.isCardio()) {
            return 1; // Cardio typically one continuous set
        }

        const baseSets = 3;
        const difficultyFactor = workoutDifficulty >= 7 ? 1 : 0;
        return baseSets + difficultyFactor;
    }

    /**
     * Calculate reps for exercise based on difficulty
     */
    calculateReps(exercise, workoutDifficulty) {
        if (exercise.isCardio()) {
            const duration = workoutDifficulty >= 7 ? '60s' : '45s';
            return duration;
        }

        const difficulty = exercise.difficultyLevel;
        
        if (difficulty >= 8) {
            return '3-5'; // Heavy compound movements
        } else if (difficulty >= 6) {
            return '6-8'; // Moderate compound movements
        } else if (difficulty >= 4) {
            return '8-12'; // Standard strength/hypertrophy
        } else {
            return '12-15'; // Light/beginner exercises
        }
    }

    /**
     * Calculate rest time for exercise
     */
    calculateRest(exercise) {
        if (exercise.isCardio()) {
            return '30s';
        }

        const difficulty = exercise.difficultyLevel;
        
        if (difficulty >= 8) {
            return '2-3min'; // Heavy compound movements
        } else if (difficulty >= 6) {
            return '90s'; // Moderate exercises
        } else {
            return '60s'; // Light exercises
        }
    }

    /**
     * Get workout statistics
     */
    async getWorkoutStats() {
        try {
            return await this.workoutRepository.getStats();
        } catch (error) {
            console.error('Error fetching workout statistics:', error);
            return {
                total: 0,
                predefined: 0,
                userCreated: 0,
                categories: 0,
                uniqueMuscleGroups: 0,
                categoryDistribution: {},
                difficultyDistribution: {},
                averageDifficulty: 0
            };
        }
    }

    /**
     * Get workout categories
     */
    async getWorkoutCategories() {
        try {
            return await this.workoutRepository.getCategories();
        } catch (error) {
            console.error('Error fetching workout categories:', error);
            return {};
        }
    }

    /**
     * Calculate workout metrics
     */
    calculateWorkoutMetrics(workout, userWeight = 70) {
        try {
            const stats = {
                totalExercises: workout.exercises?.length || 0,
                estimatedDuration: 0,
                estimatedCalories: 0,
                difficulty: workout.difficulty,
                targetMuscles: workout.targetMuscles?.length || 0,
                equipment: workout.equipment?.length || 0
            };

            if (typeof workout.getEstimatedDuration === 'function') {
                stats.estimatedDuration = workout.getEstimatedDuration();
            }

            if (typeof workout.calculateTotalCalories === 'function') {
                stats.estimatedCalories = Math.round(workout.calculateTotalCalories(userWeight));
            }

            return stats;
        } catch (error) {
            console.error('Error calculating workout metrics:', error);
            return {
                totalExercises: 0,
                estimatedDuration: 0,
                estimatedCalories: 0,
                difficulty: 1,
                targetMuscles: 0,
                equipment: 0
            };
        }
    }

    /**
     * Validate workout data
     */
    validateWorkout(workoutData) {
        const errors = [];

        if (!workoutData.name || workoutData.name.trim() === '') {
            errors.push('Workout name is required');
        }

        if (!Number.isInteger(workoutData.difficulty) || 
            workoutData.difficulty < 1 || 
            workoutData.difficulty > 10) {
            errors.push('Difficulty level must be between 1 and 10');
        }

        if (!workoutData.exercises || !Array.isArray(workoutData.exercises)) {
            errors.push('Exercises must be an array');
        } else if (workoutData.exercises.length === 0) {
            errors.push('At least one exercise is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Export workout to different formats
     */
    exportWorkout(workout, format = 'json') {
        try {
            switch (format.toLowerCase()) {
                case 'json':
                    return JSON.stringify(workout.toJSON ? workout.toJSON() : workout, null, 2);
                
                case 'text':
                    return this.exportToText(workout);
                
                case 'markdown':
                    return this.exportToMarkdown(workout);
                
                default:
                    throw new Error('Unsupported export format');
            }
        } catch (error) {
            console.error('Error exporting workout:', error);
            throw error;
        }
    }

    /**
     * Export workout to plain text
     */
    exportToText(workout) {
        let text = `WORKOUT: ${workout.name}\n`;
        text += `Description: ${workout.description}\n`;
        text += `Difficulty: ${workout.difficulty}/10\n`;
        text += `Duration: ${workout.duration}\n`;
        text += `Target Muscles: ${workout.targetMuscles.join(', ')}\n`;
        text += `Equipment: ${workout.equipment.join(', ')}\n\n`;
        
        text += 'EXERCISES:\n';
        workout.exercises.forEach((exercise, index) => {
            text += `${index + 1}. ${exercise.name}\n`;
            text += `   Sets: ${exercise.sets}, Reps: ${exercise.reps}, Rest: ${exercise.rest}\n`;
            if (exercise.notes) {
                text += `   Notes: ${exercise.notes}\n`;
            }
            text += '\n';
        });

        return text;
    }

    /**
     * Export workout to markdown
     */
    exportToMarkdown(workout) {
        let md = `# ${workout.name}\n\n`;
        md += `**Description:** ${workout.description}\n\n`;
        md += `**Details:**\n`;
        md += `- Difficulty: ${workout.difficulty}/10\n`;
        md += `- Duration: ${workout.duration}\n`;
        md += `- Target Muscles: ${workout.targetMuscles.join(', ')}\n`;
        md += `- Equipment: ${workout.equipment.join(', ')}\n\n`;
        
        md += '## Exercises\n\n';
        workout.exercises.forEach((exercise, index) => {
            md += `### ${index + 1}. ${exercise.name}\n`;
            md += `- **Sets:** ${exercise.sets}\n`;
            md += `- **Reps:** ${exercise.reps}\n`;
            md += `- **Rest:** ${exercise.rest}\n`;
            if (exercise.notes) {
                md += `- **Notes:** ${exercise.notes}\n`;
            }
            md += '\n';
        });

        return md;
    }
}