/**
 * Exercise Service
 * Application service for exercise-related business logic
 */
import { ExerciseRepository } from '../../infrastructure/repositories/ExerciseRepository.js';

export class ExerciseService {
    constructor() {
        this.exerciseRepository = new ExerciseRepository();
    }

    /**
     * Get all exercises
     */
    async getAllExercises() {
        try {
            return await this.exerciseRepository.getAll();
        } catch (error) {
            console.error('Error fetching exercises:', error);
            throw new Error('Failed to load exercises');
        }
    }

    /**
     * Get exercise by ID
     */
    async getExercise(id) {
        try {
            return await this.exerciseRepository.getById(id);
        } catch (error) {
            console.error('Error fetching exercise:', error);
            return null;
        }
    }

    /**
     * Search exercises
     */
    async searchExercises(query) {
        try {
            if (!query || query.trim() === '') {
                return await this.getAllExercises();
            }
            return await this.exerciseRepository.searchByName(query.trim());
        } catch (error) {
            console.error('Error searching exercises:', error);
            return [];
        }
    }

    /**
     * Filter exercises with advanced criteria
     */
    async filterExercises(filters) {
        try {
            return await this.exerciseRepository.advancedFilter(filters);
        } catch (error) {
            console.error('Error filtering exercises:', error);
            return [];
        }
    }

    /**
     * Get exercises by muscle group
     */
    async getExercisesByMuscleGroup(muscleGroup) {
        try {
            return await this.exerciseRepository.getByMuscleGroup(muscleGroup);
        } catch (error) {
            console.error('Error fetching exercises by muscle group:', error);
            return [];
        }
    }

    /**
     * Get exercises by equipment
     */
    async getExercisesByEquipment(equipment) {
        try {
            return await this.exerciseRepository.getByEquipment(equipment);
        } catch (error) {
            console.error('Error fetching exercises by equipment:', error);
            return [];
        }
    }

    /**
     * Get exercises by difficulty level
     */
    async getExercisesByDifficulty(minDifficulty, maxDifficulty) {
        try {
            return await this.exerciseRepository.getByDifficultyRange(minDifficulty, maxDifficulty);
        } catch (error) {
            console.error('Error fetching exercises by difficulty:', error);
            return [];
        }
    }

    /**
     * Get beginner exercises
     */
    async getBeginnerExercises() {
        try {
            return await this.exerciseRepository.getBeginnerExercises();
        } catch (error) {
            console.error('Error fetching beginner exercises:', error);
            return [];
        }
    }

    /**
     * Get cardio exercises
     */
    async getCardioExercises() {
        try {
            return await this.exerciseRepository.getCardioExercises();
        } catch (error) {
            console.error('Error fetching cardio exercises:', error);
            return [];
        }
    }

    /**
     * Get bodyweight exercises
     */
    async getBodyweightExercises() {
        try {
            return await this.exerciseRepository.getBodyweightExercises();
        } catch (error) {
            console.error('Error fetching bodyweight exercises:', error);
            return [];
        }
    }

    /**
     * Get random exercises
     */
    async getRandomExercises(count = 5, criteria = {}) {
        try {
            return await this.exerciseRepository.getRandomExercises(count, criteria);
        } catch (error) {
            console.error('Error fetching random exercises:', error);
            return [];
        }
    }

    /**
     * Get exercises compatible with user's equipment
     */
    async getCompatibleExercises(availableEquipment) {
        try {
            return await this.exerciseRepository.getCompatibleExercises(availableEquipment);
        } catch (error) {
            console.error('Error fetching compatible exercises:', error);
            return [];
        }
    }

    /**
     * Get exercises for specific goal
     */
    async getExercisesForGoal(goal, userEquipment = []) {
        try {
            return await this.exerciseRepository.getExercisesForGoal(goal, userEquipment);
        } catch (error) {
            console.error('Error fetching exercises for goal:', error);
            return [];
        }
    }

    /**
     * Get exercise statistics
     */
    async getExerciseStats() {
        try {
            return await this.exerciseRepository.getStats();
        } catch (error) {
            console.error('Error fetching exercise statistics:', error);
            return {
                total: 0,
                equipmentTypes: 0,
                muscleGroups: 0,
                difficultyDistribution: {},
                equipmentDistribution: {},
                averageDifficulty: 0
            };
        }
    }

    /**
     * Recommend exercises for user
     */
    async recommendExercises(userProfile, count = 10) {
        try {
            const {
                fitnessLevel,
                goals = [],
                availableEquipment = [],
                preferredMuscleGroups = []
            } = userProfile;

            let exercises = [];

            // Get base exercises based on fitness level
            if (fitnessLevel === 'beginner') {
                exercises = await this.getBeginnerExercises();
            } else if (fitnessLevel === 'advanced') {
                exercises = await this.exerciseRepository.getAdvancedExercises();
            } else {
                exercises = await this.getAllExercises();
            }

            // Filter by available equipment
            if (availableEquipment.length > 0) {
                exercises = exercises.filter(exercise => 
                    availableEquipment.includes(exercise.equipment)
                );
            }

            // Filter by preferred muscle groups
            if (preferredMuscleGroups.length > 0) {
                exercises = exercises.filter(exercise =>
                    preferredMuscleGroups.some(muscle => exercise.targetMuscles.includes(muscle))
                );
            }

            // Score exercises based on goals
            exercises = exercises.map(exercise => {
                let score = Math.random(); // Add some randomization
                
                goals.forEach(goal => {
                    switch (goal) {
                        case 'weight-loss':
                            if (exercise.isCardio()) score += 2;
                            if (exercise.caloriesPerMinute.max > 8) score += 1;
                            break;
                        case 'muscle-gain':
                            if (!exercise.isCardio() && exercise.difficultyLevel >= 5) score += 2;
                            if (['barbell', 'dumbbell'].includes(exercise.equipment)) score += 1;
                            break;
                        case 'strength':
                            if (exercise.equipment === 'barbell' && exercise.difficultyLevel >= 6) score += 2;
                            break;
                        case 'endurance':
                            if (exercise.isCardio()) score += 2;
                            break;
                    }
                });

                return { ...exercise, recommendationScore: score };
            });

            // Sort by score and return top results
            exercises.sort((a, b) => b.recommendationScore - a.recommendationScore);
            return exercises.slice(0, count);

        } catch (error) {
            console.error('Error recommending exercises:', error);
            return [];
        }
    }

    /**
     * Get exercises grouped by muscle group
     */
    async getExercisesGroupedByMuscle() {
        try {
            const exercises = await this.getAllExercises();
            const grouped = {};

            exercises.forEach(exercise => {
                exercise.targetMuscles.forEach(muscle => {
                    if (!grouped[muscle]) {
                        grouped[muscle] = [];
                    }
                    grouped[muscle].push(exercise);
                });
            });

            return grouped;
        } catch (error) {
            console.error('Error grouping exercises by muscle:', error);
            return {};
        }
    }

    /**
     * Get exercises grouped by equipment
     */
    async getExercisesGroupedByEquipment() {
        try {
            const exercises = await this.getAllExercises();
            const grouped = {};

            exercises.forEach(exercise => {
                const equipment = exercise.equipment;
                if (!grouped[equipment]) {
                    grouped[equipment] = [];
                }
                grouped[equipment].push(exercise);
            });

            return grouped;
        } catch (error) {
            console.error('Error grouping exercises by equipment:', error);
            return {};
        }
    }

    /**
     * Calculate total calories for exercise list
     */
    calculateTotalCalories(exercises, durationMinutes = 30, userWeight = 70) {
        try {
            return exercises.reduce((total, exercise) => {
                const exerciseDuration = durationMinutes / exercises.length;
                return total + exercise.calculateCaloriesBurned(exerciseDuration, userWeight);
            }, 0);
        } catch (error) {
            console.error('Error calculating total calories:', error);
            return 0;
        }
    }

    /**
     * Get popular exercises (most commonly used)
     */
    async getPopularExercises(limit = 10) {
        try {
            // This could be enhanced to track actual usage
            // For now, we'll use exercises with moderate difficulty and common equipment
            return await this.filterExercises({
                difficultyRange: [3, 7],
                equipment: ['bodyweight', 'dumbbell', 'barbell'],
                maxResults: limit
            });
        } catch (error) {
            console.error('Error fetching popular exercises:', error);
            return [];
        }
    }

    /**
     * Validate exercise data
     */
    validateExercise(exerciseData) {
        const errors = [];

        if (!exerciseData.name || exerciseData.name.trim() === '') {
            errors.push('Exercise name is required');
        }

        if (!exerciseData.video) {
            errors.push('Exercise video is required');
        }

        if (!exerciseData.equipment) {
            errors.push('Exercise equipment is required');
        }

        if (!exerciseData.targetMuscles || exerciseData.targetMuscles.length === 0) {
            errors.push('At least one target muscle is required');
        }

        if (!Number.isInteger(exerciseData.difficultyLevel) || 
            exerciseData.difficultyLevel < 1 || 
            exerciseData.difficultyLevel > 10) {
            errors.push('Difficulty level must be between 1 and 10');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}