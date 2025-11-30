/**
 * Workout Repository
 * Specialized repository for workout data (both predefined and user-created)
 */
import { JsonRepository } from './JsonRepository.js';
import { Workout } from '../../domain/entities/Workout.js';

export class WorkoutRepository extends JsonRepository {
    constructor() {
        super('ready-workouts-data.json', Workout, 'user-workouts');
    }

    /**
     * Get all workouts (both predefined and user-created)
     */
    async getAllWorkouts() {
        const [predefined, userWorkouts] = await Promise.all([
            this.getPredefinedWorkouts(),
            this.getUserWorkouts()
        ]);

        return [...predefined, ...userWorkouts];
    }

    /**
     * Get predefined workouts from JSON file
     */
    async getPredefinedWorkouts() {
        const data = await this.loadFromFile();
        const workouts = data.workouts || [];
        
        return workouts.map(workout => 
            this.entityClass ? this.entityClass.fromJSON(workout) : workout
        );
    }

    /**
     * Get user-created workouts from localStorage
     */
    async getUserWorkouts() {
        const data = this.loadFromStorage() || [];
        return Array.isArray(data) ? 
            data.map(workout => this.entityClass ? this.entityClass.fromJSON(workout) : workout) : 
            [];
    }

    /**
     * Get workouts by category
     */
    async getByCategory(category) {
        const workouts = await this.getAllWorkouts();
        return workouts.filter(workout => workout.category === category);
    }

    /**
     * Get workouts by difficulty range
     */
    async getByDifficultyRange(minDifficulty, maxDifficulty) {
        const workouts = await this.getAllWorkouts();
        return workouts.filter(workout => 
            workout.difficulty >= minDifficulty && 
            workout.difficulty <= maxDifficulty
        );
    }

    /**
     * Get beginner workouts
     */
    async getBeginnerWorkouts() {
        return this.getByDifficultyRange(1, 4);
    }

    /**
     * Get intermediate workouts
     */
    async getIntermediateWorkouts() {
        return this.getByDifficultyRange(4, 7);
    }

    /**
     * Get advanced workouts
     */
    async getAdvancedWorkouts() {
        return this.getByDifficultyRange(7, 10);
    }

    /**
     * Get workouts by target muscle groups
     */
    async getByMuscleGroups(muscleGroups) {
        const workouts = await this.getAllWorkouts();
        return workouts.filter(workout => 
            muscleGroups.some(muscle => workout.targetMuscles.includes(muscle))
        );
    }

    /**
     * Get workouts compatible with available equipment
     */
    async getCompatibleWorkouts(availableEquipment) {
        const workouts = await this.getAllWorkouts();
        return workouts.filter(workout => 
            workout.equipment.every(required => availableEquipment.includes(required))
        );
    }

    /**
     * Get workouts by estimated duration
     */
    async getByDurationRange(minMinutes, maxMinutes) {
        const workouts = await this.getAllWorkouts();
        return workouts.filter(workout => {
            const duration = typeof workout.getEstimatedDuration === 'function' 
                ? workout.getEstimatedDuration() 
                : this.parseDuration(workout.duration);
            
            return duration >= minMinutes && duration <= maxMinutes;
        });
    }

    /**
     * Parse duration string to minutes
     */
    parseDuration(durationStr) {
        if (typeof durationStr === 'number') return durationStr;
        
        const match = durationStr.match(/(\d+)(?:-(\d+))?\s*minutes?/i);
        if (!match) return 45; // Default 45 minutes
        
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min;
        return (min + max) / 2;
    }

    /**
     * Search workouts by name and description
     */
    async searchWorkouts(query) {
        const workouts = await this.getAllWorkouts();
        const searchTerm = query.toLowerCase();
        
        return workouts.filter(workout => 
            workout.name.toLowerCase().includes(searchTerm) ||
            workout.description.toLowerCase().includes(searchTerm) ||
            workout.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    /**
     * Get recommended workouts for user
     */
    async getRecommendedWorkouts(userProfile, limit = 5) {
        const {
            fitnessLevel,
            goals = [],
            availableEquipment = [],
            workoutDuration = 45,
            preferredMuscleGroups = []
        } = userProfile;

        let workouts = await this.getAllWorkouts();

        // Filter by fitness level
        if (fitnessLevel) {
            const difficultyRanges = {
                'beginner': [1, 4],
                'intermediate': [4, 7],
                'advanced': [7, 10]
            };
            const [min, max] = difficultyRanges[fitnessLevel] || [1, 10];
            workouts = workouts.filter(workout => 
                workout.difficulty >= min && workout.difficulty <= max
            );
        }

        // Filter by available equipment
        if (availableEquipment.length > 0) {
            workouts = workouts.filter(workout => 
                workout.equipment.every(required => availableEquipment.includes(required))
            );
        }

        // Filter by preferred muscle groups
        if (preferredMuscleGroups.length > 0) {
            workouts = workouts.filter(workout =>
                preferredMuscleGroups.some(muscle => workout.targetMuscles.includes(muscle))
            );
        }

        // Filter by workout duration (within 15 minutes of preferred)
        workouts = workouts.filter(workout => {
            const duration = typeof workout.getEstimatedDuration === 'function' 
                ? workout.getEstimatedDuration() 
                : this.parseDuration(workout.duration);
            
            return Math.abs(duration - workoutDuration) <= 15;
        });

        // Score workouts based on goals
        workouts = workouts.map(workout => {
            let score = 0;
            
            goals.forEach(goal => {
                switch (goal) {
                    case 'weight-loss':
                        if (workout.targetMuscles.includes('cardio') || workout.category === 'cardio') {
                            score += 10;
                        }
                        break;
                    case 'muscle-gain':
                        if (workout.tags.includes('hypertrophy') || workout.category === 'strength') {
                            score += 10;
                        }
                        break;
                    case 'strength':
                        if (workout.category === 'strength' || workout.tags.includes('strength')) {
                            score += 10;
                        }
                        break;
                    case 'endurance':
                        if (workout.targetMuscles.includes('cardio') || workout.tags.includes('endurance')) {
                            score += 10;
                        }
                        break;
                }
            });

            return { ...workout, recommendationScore: score };
        });

        // Sort by recommendation score and return top results
        workouts.sort((a, b) => b.recommendationScore - a.recommendationScore);
        return workouts.slice(0, limit);
    }

    /**
     * Save user workout
     */
    async saveUserWorkout(workout) {
        return this.create(workout);
    }

    /**
     * Update user workout
     */
    async updateUserWorkout(id, updates) {
        return this.update(id, updates);
    }

    /**
     * Delete user workout
     */
    async deleteUserWorkout(id) {
        return this.delete(id);
    }

    /**
     * Duplicate workout (create copy)
     */
    async duplicateWorkout(workoutId, newName) {
        const workout = await this.getById(workoutId);
        if (!workout) {
            throw new Error('Workout not found');
        }

        const duplicated = workout.clone ? workout.clone(newName) : { 
            ...workout, 
            id: this.generateId(),
            name: newName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return this.create(duplicated);
    }

    /**
     * Get workout statistics
     */
    async getStats() {
        const [predefined, userWorkouts] = await Promise.all([
            this.getPredefinedWorkouts(),
            this.getUserWorkouts()
        ]);

        const allWorkouts = [...predefined, ...userWorkouts];
        
        const categories = [...new Set(allWorkouts.map(w => w.category))];
        const difficulties = allWorkouts.map(w => w.difficulty);
        const targetMuscles = [...new Set(allWorkouts.flatMap(w => w.targetMuscles))];

        const categoryDistribution = allWorkouts.reduce((acc, workout) => {
            acc[workout.category] = (acc[workout.category] || 0) + 1;
            return acc;
        }, {});

        const difficultyDistribution = difficulties.reduce((acc, difficulty) => {
            acc[difficulty] = (acc[difficulty] || 0) + 1;
            return acc;
        }, {});

        return {
            total: allWorkouts.length,
            predefined: predefined.length,
            userCreated: userWorkouts.length,
            categories: categories.length,
            uniqueMuscleGroups: targetMuscles.length,
            categoryDistribution,
            difficultyDistribution,
            averageDifficulty: difficulties.reduce((sum, d) => sum + d, 0) / difficulties.length
        };
    }

    /**
     * Get workout categories with metadata
     */
    async getCategories() {
        const data = await this.loadFromFile();
        return data.categories || {};
    }

    /**
     * Advanced workout filtering
     */
    async advancedFilter({
        categories = [],
        difficultyRange = [1, 10],
        durationRange = [15, 120],
        muscleGroups = [],
        equipment = [],
        tags = [],
        excludeUserWorkouts = false,
        maxResults = null
    }) {
        let workouts = excludeUserWorkouts 
            ? await this.getPredefinedWorkouts()
            : await this.getAllWorkouts();

        workouts = workouts.filter(workout => {
            // Category filter
            if (categories.length > 0 && !categories.includes(workout.category)) {
                return false;
            }

            // Difficulty filter
            if (workout.difficulty < difficultyRange[0] || workout.difficulty > difficultyRange[1]) {
                return false;
            }

            // Duration filter
            const duration = typeof workout.getEstimatedDuration === 'function' 
                ? workout.getEstimatedDuration() 
                : this.parseDuration(workout.duration);
            if (duration < durationRange[0] || duration > durationRange[1]) {
                return false;
            }

            // Muscle group filter
            if (muscleGroups.length > 0) {
                const hasTargetMuscle = muscleGroups.some(muscle => 
                    workout.targetMuscles.includes(muscle)
                );
                if (!hasTargetMuscle) return false;
            }

            // Equipment filter
            if (equipment.length > 0) {
                const hasRequiredEquipment = workout.equipment.every(required => 
                    equipment.includes(required)
                );
                if (!hasRequiredEquipment) return false;
            }

            // Tags filter
            if (tags.length > 0) {
                const hasTag = tags.some(tag => workout.tags.includes(tag));
                if (!hasTag) return false;
            }

            return true;
        });

        // Limit results if specified
        if (maxResults && maxResults > 0) {
            workouts = workouts.slice(0, maxResults);
        }

        return workouts;
    }
}