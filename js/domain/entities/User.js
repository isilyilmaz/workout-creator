/**
 * User Domain Entity
 * Represents user profile with fitness data and preferences
 */
export class User {
    constructor({
        id = null,
        name = '',
        email = '',
        age = null,
        height = null, // in cm
        weight = null, // in kg
        gender = null, // 'male', 'female', 'other'
        fitnessLevel = 'beginner', // 'beginner', 'intermediate', 'advanced'
        goals = [], // 'weight-loss', 'muscle-gain', 'strength', 'endurance', 'general-fitness'
        availableEquipment = [],
        workoutFrequency = 3, // times per week
        workoutDuration = 45, // minutes
        preferredMuscleGroups = [],
        createdAt = new Date(),
        updatedAt = new Date()
    }) {
        this.id = id || this.generateId();
        this.name = name;
        this.email = email;
        this.age = age;
        this.height = height;
        this.weight = weight;
        this.gender = gender;
        this.fitnessLevel = fitnessLevel;
        this.goals = goals;
        this.availableEquipment = availableEquipment;
        this.workoutFrequency = workoutFrequency;
        this.workoutDuration = workoutDuration;
        this.preferredMuscleGroups = preferredMuscleGroups;
        this.createdAt = new Date(createdAt);
        this.updatedAt = new Date(updatedAt);
    }

    generateId() {
        return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Update user profile
     */
    updateProfile(updates) {
        const allowedUpdates = [
            'name', 'email', 'age', 'height', 'weight', 'gender', 
            'fitnessLevel', 'goals', 'availableEquipment', 
            'workoutFrequency', 'workoutDuration', 'preferredMuscleGroups'
        ];
        
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                this[key] = updates[key];
            }
        });
        
        this.updatedAt = new Date();
    }

    /**
     * Calculate BMI (Body Mass Index)
     */
    calculateBMI() {
        if (!this.height || !this.weight) {
            throw new Error('Height and weight are required to calculate BMI');
        }
        
        const heightInMeters = this.height / 100;
        return parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
    }

    /**
     * Get BMI category
     */
    getBMICategory() {
        const bmi = this.calculateBMI();
        
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal weight';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    /**
     * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
     */
    calculateBMR() {
        if (!this.age || !this.height || !this.weight || !this.gender) {
            throw new Error('Age, height, weight, and gender are required to calculate BMR');
        }
        
        let bmr = (10 * this.weight) + (6.25 * this.height) - (5 * this.age);
        
        if (this.gender === 'male') {
            bmr += 5;
        } else if (this.gender === 'female') {
            bmr -= 161;
        }
        
        return Math.round(bmr);
    }

    /**
     * Calculate daily calorie needs based on activity level
     */
    calculateDailyCalorieNeeds(activityLevel = 'moderate') {
        const bmr = this.calculateBMR();
        const multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        };
        
        return Math.round(bmr * (multipliers[activityLevel] || multipliers['moderate']));
    }

    /**
     * Get recommended workout difficulty based on fitness level
     */
    getRecommendedDifficulty() {
        const difficultyMap = {
            'beginner': { min: 1, max: 4 },
            'intermediate': { min: 4, max: 7 },
            'advanced': { min: 6, max: 10 }
        };
        
        return difficultyMap[this.fitnessLevel] || difficultyMap['beginner'];
    }

    /**
     * Check if user has specific equipment available
     */
    hasEquipment(equipmentType) {
        return this.availableEquipment.includes(equipmentType);
    }

    /**
     * Check if user wants to target specific muscle group
     */
    prefersMuslceGroup(muscleGroup) {
        return this.preferredMuscleGroups.includes(muscleGroup);
    }

    /**
     * Check if user has specific fitness goal
     */
    hasGoal(goal) {
        return this.goals.includes(goal);
    }

    /**
     * Get user's fitness profile summary
     */
    getFitnessProfile() {
        const profile = {
            fitnessLevel: this.fitnessLevel,
            goals: this.goals,
            workoutFrequency: this.workoutFrequency,
            workoutDuration: this.workoutDuration,
            preferredMuscleGroups: this.preferredMuscleGroups,
            availableEquipment: this.availableEquipment
        };
        
        try {
            profile.bmi = this.calculateBMI();
            profile.bmiCategory = this.getBMICategory();
            profile.bmr = this.calculateBMR();
            profile.dailyCalories = this.calculateDailyCalorieNeeds();
        } catch (error) {
            // BMI/BMR calculations require complete data
            console.warn('Could not calculate BMI/BMR:', error.message);
        }
        
        return profile;
    }

    /**
     * Validate user data completeness
     */
    isProfileComplete() {
        const requiredFields = ['name', 'age', 'height', 'weight', 'gender', 'fitnessLevel'];
        return requiredFields.every(field => this[field] !== null && this[field] !== '');
    }

    /**
     * Get recommended weekly calorie burn based on goals
     */
    getRecommendedWeeklyCalorieBurn() {
        const baseCalories = this.workoutFrequency * 300; // Base 300 calories per workout
        
        if (this.hasGoal('weight-loss')) {
            return baseCalories * 1.5; // Higher calorie burn for weight loss
        } else if (this.hasGoal('muscle-gain')) {
            return baseCalories * 0.8; // Lower calorie burn to preserve energy for muscle building
        }
        
        return baseCalories;
    }

    /**
     * Convert to plain object for serialization
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            age: this.age,
            height: this.height,
            weight: this.weight,
            gender: this.gender,
            fitnessLevel: this.fitnessLevel,
            goals: this.goals,
            availableEquipment: this.availableEquipment,
            workoutFrequency: this.workoutFrequency,
            workoutDuration: this.workoutDuration,
            preferredMuscleGroups: this.preferredMuscleGroups,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Create User instance from plain object
     */
    static fromJSON(data) {
        return new User(data);
    }
}