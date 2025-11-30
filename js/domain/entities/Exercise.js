/**
 * Exercise Domain Entity
 * Represents an exercise with all its properties and business logic
 */
export class Exercise {
    constructor({
        name,
        video,
        targetMuscles = [],
        equipment,
        caloriesPerMinute = { min: 0, max: 0 },
        difficultyLevel = 1
    }) {
        this.validateInputs({ name, video, equipment, difficultyLevel });
        
        this.name = name;
        this.video = video;
        this.targetMuscles = targetMuscles;
        this.equipment = equipment;
        this.caloriesPerMinute = caloriesPerMinute;
        this.difficultyLevel = difficultyLevel;
        this.id = this.generateId();
    }

    validateInputs({ name, video, equipment, difficultyLevel }) {
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Exercise name is required and must be a non-empty string');
        }
        
        if (!video || typeof video !== 'string' || video.trim() === '') {
            throw new Error('Exercise video is required and must be a non-empty string');
        }
        
        if (!equipment || typeof equipment !== 'string') {
            throw new Error('Exercise equipment is required and must be a string');
        }
        
        if (!Number.isInteger(difficultyLevel) || difficultyLevel < 1 || difficultyLevel > 10) {
            throw new Error('Difficulty level must be an integer between 1 and 10');
        }
    }

    generateId() {
        return this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    }

    /**
     * Get YouTube video URL from video ID
     */
    getYouTubeUrl() {
        return `https://www.youtube.com/embed/${this.video}`;
    }

    /**
     * Get YouTube thumbnail URL
     */
    getThumbnailUrl() {
        return `https://img.youtube.com/vi/${this.video}/mqdefault.jpg`;
    }

    /**
     * Calculate calories burned for a given duration in minutes
     */
    calculateCaloriesBurned(durationMinutes, userWeight = 70) {
        if (durationMinutes <= 0) return 0;
        
        const avgCaloriesPerMinute = (this.caloriesPerMinute.min + this.caloriesPerMinute.max) / 2;
        const weightFactor = userWeight / 70; // Base weight of 70kg
        
        return Math.round(avgCaloriesPerMinute * durationMinutes * weightFactor);
    }

    /**
     * Check if exercise targets a specific muscle group
     */
    targetsMuscleGroup(muscleGroup) {
        return this.targetMuscles.includes(muscleGroup.toLowerCase());
    }

    /**
     * Check if exercise uses specific equipment
     */
    usesEquipment(equipmentType) {
        return this.equipment.toLowerCase() === equipmentType.toLowerCase();
    }

    /**
     * Get difficulty level as text
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
        return levels[this.difficultyLevel] || 'Unknown';
    }

    /**
     * Get primary muscle group (first in the target muscles array)
     */
    getPrimaryMuscleGroup() {
        return this.targetMuscles.length > 0 ? this.targetMuscles[0] : 'unknown';
    }

    /**
     * Check if exercise is suitable for beginners (difficulty <= 4)
     */
    isBeginner() {
        return this.difficultyLevel <= 4;
    }

    /**
     * Check if exercise is cardio-focused
     */
    isCardio() {
        return this.targetMuscles.includes('cardio') || this.equipment === 'cardio';
    }

    /**
     * Check if exercise requires no equipment
     */
    isBodyweight() {
        return this.equipment === 'bodyweight' || this.equipment === 'noEquipment';
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            video: this.video,
            targetMuscles: this.targetMuscles,
            equipment: this.equipment,
            caloriesPerMinute: this.caloriesPerMinute,
            difficultyLevel: this.difficultyLevel
        };
    }

    /**
     * Create Exercise instance from plain object
     */
    static fromJSON(data) {
        return new Exercise(data);
    }

    /**
     * Create multiple Exercise instances from array of plain objects
     */
    static fromJSONArray(dataArray) {
        return dataArray.map(data => Exercise.fromJSON(data));
    }
}