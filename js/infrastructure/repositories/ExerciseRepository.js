/**
 * Exercise Repository
 * Specialized repository for exercise data
 */
import { JsonRepository } from './JsonRepository.js';
import { Exercise } from '../../domain/entities/Exercise.js';

export class ExerciseRepository extends JsonRepository {
    constructor() {
        super('exercise-data.json', Exercise);
    }

    /**
     * Get exercises by muscle group
     */
    async getByMuscleGroup(muscleGroup) {
        return this.findBy({ targetMuscles: [muscleGroup] });
    }

    /**
     * Get exercises by equipment type
     */
    async getByEquipment(equipment) {
        return this.findBy({ equipment });
    }

    /**
     * Get exercises by difficulty range
     */
    async getByDifficultyRange(minDifficulty, maxDifficulty) {
        const exercises = await this.getAll();
        return exercises.filter(exercise => 
            exercise.difficultyLevel >= minDifficulty && 
            exercise.difficultyLevel <= maxDifficulty
        );
    }

    /**
     * Get beginner-friendly exercises
     */
    async getBeginnerExercises() {
        return this.getByDifficultyRange(1, 4);
    }

    /**
     * Get advanced exercises
     */
    async getAdvancedExercises() {
        return this.getByDifficultyRange(7, 10);
    }

    /**
     * Get cardio exercises
     */
    async getCardioExercises() {
        return this.findBy({ targetMuscles: ['cardio'] });
    }

    /**
     * Get bodyweight exercises
     */
    async getBodyweightExercises() {
        const bodyweightEquipment = ['bodyweight', 'noEquipment'];
        const exercises = await this.getAll();
        return exercises.filter(exercise => 
            bodyweightEquipment.includes(exercise.equipment)
        );
    }

    /**
     * Search exercises by name and description
     */
    async searchByName(query) {
        return this.search(query, ['name']);
    }

    /**
     * Get random exercises
     */
    async getRandomExercises(count = 5, criteria = {}) {
        const exercises = Object.keys(criteria).length > 0 
            ? await this.findBy(criteria)
            : await this.getAll();
        
        const shuffled = exercises.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Get exercises compatible with available equipment
     */
    async getCompatibleExercises(availableEquipment) {
        const exercises = await this.getAll();
        return exercises.filter(exercise => 
            availableEquipment.includes(exercise.equipment)
        );
    }

    /**
     * Get exercises for specific workout goal
     */
    async getExercisesForGoal(goal, userEquipment = []) {
        let criteria = {};
        
        switch (goal) {
            case 'weight-loss':
                criteria = { targetMuscles: ['cardio'] };
                break;
            case 'muscle-gain':
                criteria = { equipment: ['barbell', 'dumbbell', 'machine'] };
                break;
            case 'strength':
                criteria = { equipment: ['barbell'] };
                break;
            case 'endurance':
                criteria = { targetMuscles: ['cardio'] };
                break;
            default:
                criteria = {};
        }

        let exercises = await this.findBy(criteria);
        
        // Filter by available equipment if provided
        if (userEquipment.length > 0) {
            exercises = exercises.filter(exercise => 
                userEquipment.includes(exercise.equipment)
            );
        }

        return exercises;
    }

    /**
     * Get exercise statistics
     */
    async getStats() {
        const exercises = await this.getAll();
        const equipmentTypes = [...new Set(exercises.map(e => e.equipment))];
        const muscleGroups = [...new Set(exercises.flatMap(e => e.targetMuscles))];
        
        const difficultyDistribution = exercises.reduce((acc, exercise) => {
            const level = exercise.difficultyLevel;
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});

        const equipmentDistribution = exercises.reduce((acc, exercise) => {
            const equipment = exercise.equipment;
            acc[equipment] = (acc[equipment] || 0) + 1;
            return acc;
        }, {});

        return {
            total: exercises.length,
            equipmentTypes: equipmentTypes.length,
            muscleGroups: muscleGroups.length,
            difficultyDistribution,
            equipmentDistribution,
            averageDifficulty: exercises.reduce((sum, e) => sum + e.difficultyLevel, 0) / exercises.length
        };
    }

    /**
     * Filter exercises with advanced criteria
     */
    async advancedFilter({
        muscleGroups = [],
        equipment = [],
        difficultyRange = [1, 10],
        calorieRange = null,
        excludeEquipment = [],
        maxResults = null
    }) {
        const exercises = await this.getAll();
        
        let filtered = exercises.filter(exercise => {
            // Muscle group filter
            if (muscleGroups.length > 0) {
                const hasTargetMuscle = muscleGroups.some(muscle => 
                    exercise.targetMuscles.includes(muscle)
                );
                if (!hasTargetMuscle) return false;
            }

            // Equipment filter
            if (equipment.length > 0 && !equipment.includes(exercise.equipment)) {
                return false;
            }

            // Exclude equipment filter
            if (excludeEquipment.length > 0 && excludeEquipment.includes(exercise.equipment)) {
                return false;
            }

            // Difficulty range filter
            if (exercise.difficultyLevel < difficultyRange[0] || 
                exercise.difficultyLevel > difficultyRange[1]) {
                return false;
            }

            // Calorie range filter
            if (calorieRange) {
                const avgCalories = (exercise.caloriesPerMinute.min + exercise.caloriesPerMinute.max) / 2;
                if (avgCalories < calorieRange[0] || avgCalories > calorieRange[1]) {
                    return false;
                }
            }

            return true;
        });

        // Limit results if specified
        if (maxResults && maxResults > 0) {
            filtered = filtered.slice(0, maxResults);
        }

        return filtered;
    }
}