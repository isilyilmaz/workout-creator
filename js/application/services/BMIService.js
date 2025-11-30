/**
 * BMI Service
 * Application service for BMI calculations and health metrics
 */

export class BMIService {
    constructor() {
        this.bmiCategories = {
            'underweight': { min: 0, max: 18.5, color: '#3b82f6', description: 'Below normal weight' },
            'normal': { min: 18.5, max: 25, color: '#10b981', description: 'Healthy weight range' },
            'overweight': { min: 25, max: 30, color: '#f59e0b', description: 'Above normal weight' },
            'obese': { min: 30, max: 100, color: '#ef4444', description: 'Significantly above normal weight' }
        };
    }

    /**
     * Calculate BMI (Body Mass Index)
     */
    calculateBMI(weight, height, unit = 'metric') {
        try {
            if (!weight || !height || weight <= 0 || height <= 0) {
                throw new Error('Weight and height must be positive numbers');
            }

            let bmi;
            if (unit === 'imperial') {
                // weight in pounds, height in inches
                bmi = (weight / (height * height)) * 703;
            } else {
                // weight in kg, height in cm
                const heightInMeters = height / 100;
                bmi = weight / (heightInMeters * heightInMeters);
            }

            return {
                value: parseFloat(bmi.toFixed(1)),
                category: this.getBMICategory(bmi),
                isHealthy: this.isHealthyBMI(bmi)
            };
        } catch (error) {
            console.error('Error calculating BMI:', error);
            throw error;
        }
    }

    /**
     * Get BMI category
     */
    getBMICategory(bmi) {
        for (const [category, range] of Object.entries(this.bmiCategories)) {
            if (bmi >= range.min && bmi < range.max) {
                return {
                    name: category,
                    ...range
                };
            }
        }
        return {
            name: 'unknown',
            min: 0,
            max: 0,
            color: '#6b7280',
            description: 'Unable to categorize'
        };
    }

    /**
     * Check if BMI is in healthy range
     */
    isHealthyBMI(bmi) {
        return bmi >= 18.5 && bmi < 25;
    }

    /**
     * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
     */
    calculateBMR(weight, height, age, gender, unit = 'metric') {
        try {
            if (!weight || !height || !age || !gender) {
                throw new Error('Weight, height, age, and gender are required');
            }

            let bmr;
            if (unit === 'imperial') {
                // Convert imperial to metric
                weight = weight * 0.453592; // pounds to kg
                height = height * 2.54; // inches to cm
            }

            // Mifflin-St Jeor Equation
            bmr = (10 * weight) + (6.25 * height) - (5 * age);

            if (gender.toLowerCase() === 'male') {
                bmr += 5;
            } else if (gender.toLowerCase() === 'female') {
                bmr -= 161;
            } else {
                // For non-binary, use average
                bmr -= 78;
            }

            return {
                value: Math.round(bmr),
                description: 'Calories needed per day at rest'
            };
        } catch (error) {
            console.error('Error calculating BMR:', error);
            throw error;
        }
    }

    /**
     * Calculate TDEE (Total Daily Energy Expenditure)
     */
    calculateTDEE(bmr, activityLevel) {
        const activityMultipliers = {
            'sedentary': 1.2,        // Little or no exercise
            'light': 1.375,          // Light exercise 1-3 days/week
            'moderate': 1.55,        // Moderate exercise 3-5 days/week
            'active': 1.725,         // Heavy exercise 6-7 days/week
            'very_active': 1.9       // Very heavy exercise, physical job
        };

        const multiplier = activityMultipliers[activityLevel] || activityMultipliers['moderate'];
        const tdee = bmr * multiplier;

        return {
            value: Math.round(tdee),
            activityLevel,
            description: 'Total daily calories needed to maintain current weight'
        };
    }

    /**
     * Calculate ideal weight range
     */
    calculateIdealWeightRange(height, gender, unit = 'metric') {
        try {
            if (!height || height <= 0) {
                throw new Error('Height must be a positive number');
            }

            if (unit === 'imperial') {
                height = height * 2.54; // inches to cm
            }

            const heightInMeters = height / 100;
            
            // Using BMI range of 18.5-24.9 for healthy weight
            const minWeight = 18.5 * heightInMeters * heightInMeters;
            const maxWeight = 24.9 * heightInMeters * heightInMeters;

            if (unit === 'imperial') {
                return {
                    min: Math.round(minWeight * 2.20462), // kg to pounds
                    max: Math.round(maxWeight * 2.20462),
                    unit: 'lbs'
                };
            }

            return {
                min: Math.round(minWeight),
                max: Math.round(maxWeight),
                unit: 'kg'
            };
        } catch (error) {
            console.error('Error calculating ideal weight range:', error);
            throw error;
        }
    }

    /**
     * Calculate calorie goals for weight management
     */
    calculateCalorieGoals(tdee, goal, rate = 'moderate') {
        const rates = {
            'slow': 250,      // 0.5 lbs per week
            'moderate': 500,  // 1 lb per week
            'fast': 750       // 1.5 lbs per week
        };

        const calorieAdjustment = rates[rate] || rates['moderate'];
        let targetCalories = tdee;

        switch (goal) {
            case 'lose':
                targetCalories = tdee - calorieAdjustment;
                break;
            case 'gain':
                targetCalories = tdee + calorieAdjustment;
                break;
            case 'maintain':
            default:
                targetCalories = tdee;
                break;
        }

        // Ensure minimum safe calories
        const minCalories = 1200; // Generally accepted minimum for women
        targetCalories = Math.max(targetCalories, minCalories);

        return {
            maintenance: tdee,
            target: Math.round(targetCalories),
            deficit: goal === 'lose' ? calorieAdjustment : 0,
            surplus: goal === 'gain' ? calorieAdjustment : 0,
            rate,
            goal
        };
    }

    /**
     * Get BMI visualization data
     */
    getBMIVisualization(bmi) {
        const categories = Object.entries(this.bmiCategories);
        const totalRange = 50; // Display range from 0 to 50

        return categories.map(([name, category]) => {
            const rangeWidth = Math.min(category.max, totalRange) - Math.max(category.min, 0);
            const position = (Math.max(category.min, 0) / totalRange) * 100;
            const width = (rangeWidth / totalRange) * 100;
            
            return {
                name: name.charAt(0).toUpperCase() + name.slice(1),
                color: category.color,
                description: category.description,
                position,
                width,
                range: `${category.min} - ${category.max === 100 ? '50+' : category.max}`,
                isActive: bmi >= category.min && bmi < category.max
            };
        });
    }

    /**
     * Get health recommendations based on BMI
     */
    getHealthRecommendations(bmi, userProfile = {}) {
        const category = this.getBMICategory(bmi);
        const recommendations = [];

        switch (category.name) {
            case 'underweight':
                recommendations.push({
                    type: 'nutrition',
                    title: 'Increase Caloric Intake',
                    description: 'Focus on nutrient-dense, calorie-rich foods to gain weight healthily.'
                });
                recommendations.push({
                    type: 'exercise',
                    title: 'Strength Training',
                    description: 'Include resistance training to build muscle mass and healthy weight.'
                });
                break;

            case 'normal':
                recommendations.push({
                    type: 'maintain',
                    title: 'Maintain Current Habits',
                    description: 'Continue with your current healthy lifestyle to maintain optimal weight.'
                });
                recommendations.push({
                    type: 'exercise',
                    title: 'Regular Exercise',
                    description: 'Keep up with regular physical activity for overall health and fitness.'
                });
                break;

            case 'overweight':
                recommendations.push({
                    type: 'nutrition',
                    title: 'Caloric Deficit',
                    description: 'Create a moderate caloric deficit through diet and exercise.'
                });
                recommendations.push({
                    type: 'exercise',
                    title: 'Cardio + Strength',
                    description: 'Combine cardiovascular exercise with strength training for optimal results.'
                });
                break;

            case 'obese':
                recommendations.push({
                    type: 'medical',
                    title: 'Consult Healthcare Provider',
                    description: 'Consider consulting with a healthcare professional for personalized guidance.'
                });
                recommendations.push({
                    type: 'nutrition',
                    title: 'Structured Diet Plan',
                    description: 'Follow a structured, sustainable eating plan with professional guidance.'
                });
                break;
        }

        return recommendations;
    }

    /**
     * Calculate body fat percentage estimate (rough estimation)
     */
    estimateBodyFatPercentage(bmi, age, gender) {
        try {
            if (!bmi || !age || !gender) {
                throw new Error('BMI, age, and gender are required');
            }

            let bodyFat;
            if (gender.toLowerCase() === 'male') {
                bodyFat = (1.20 * bmi) + (0.23 * age) - 16.2;
            } else if (gender.toLowerCase() === 'female') {
                bodyFat = (1.20 * bmi) + (0.23 * age) - 5.4;
            } else {
                // Average for non-binary
                bodyFat = (1.20 * bmi) + (0.23 * age) - 10.8;
            }

            return {
                value: Math.max(0, Math.round(bodyFat * 10) / 10),
                note: 'This is a rough estimation. For accurate body fat measurement, use specialized equipment.'
            };
        } catch (error) {
            console.error('Error estimating body fat percentage:', error);
            throw error;
        }
    }

    /**
     * Validate input data
     */
    validateInputs(weight, height, age, gender, unit = 'metric') {
        const errors = [];

        if (!weight || weight <= 0) {
            errors.push('Weight must be a positive number');
        } else if (unit === 'metric' && (weight < 20 || weight > 300)) {
            errors.push('Weight should be between 20-300 kg');
        } else if (unit === 'imperial' && (weight < 44 || weight > 661)) {
            errors.push('Weight should be between 44-661 lbs');
        }

        if (!height || height <= 0) {
            errors.push('Height must be a positive number');
        } else if (unit === 'metric' && (height < 100 || height > 250)) {
            errors.push('Height should be between 100-250 cm');
        } else if (unit === 'imperial' && (height < 39 || height > 98)) {
            errors.push('Height should be between 39-98 inches');
        }

        if (age !== null && age !== undefined) {
            if (!Number.isInteger(age) || age < 13 || age > 120) {
                errors.push('Age should be between 13-120 years');
            }
        }

        if (gender && !['male', 'female', 'other'].includes(gender.toLowerCase())) {
            errors.push('Gender should be male, female, or other');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Convert units
     */
    convertUnits(value, fromUnit, toUnit, type = 'weight') {
        if (type === 'weight') {
            if (fromUnit === 'kg' && toUnit === 'lbs') {
                return value * 2.20462;
            } else if (fromUnit === 'lbs' && toUnit === 'kg') {
                return value * 0.453592;
            }
        } else if (type === 'height') {
            if (fromUnit === 'cm' && toUnit === 'in') {
                return value * 0.393701;
            } else if (fromUnit === 'in' && toUnit === 'cm') {
                return value * 2.54;
            }
        }
        
        return value; // No conversion needed
    }
}