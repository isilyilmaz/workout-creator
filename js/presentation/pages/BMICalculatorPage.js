/**
 * BMI Calculator Page Component
 * Page for calculating BMI and health metrics
 */
import { BMIService } from '../../application/services/BMIService.js';

export class BMICalculatorPage {
    constructor(container, appController) {
        this.container = container;
        this.appController = appController;
        this.bmiService = new BMIService();
    }

    async render() {
        this.container.innerHTML = `
            <div class="bmi-calculator-page">
                <div class="page-header">
                    <h1>BMI Calculator</h1>
                    <p>Calculate your Body Mass Index and get health insights</p>
                </div>
                <div class="page-content">
                    <div class="calculator-placeholder">
                        <h2>🧮 BMI Calculator</h2>
                        <p>The BMI calculator will help you:</p>
                        <ul>
                            <li>Calculate your Body Mass Index (BMI)</li>
                            <li>Determine your BMI category (underweight, normal, overweight, obese)</li>
                            <li>Calculate Basal Metabolic Rate (BMR)</li>
                            <li>Estimate daily calorie needs</li>
                            <li>Get personalized health recommendations</li>
                            <li>Track your progress over time</li>
                        </ul>
                        
                        <div class="quick-bmi-demo">
                            <h3>Quick BMI Demo</h3>
                            <div class="demo-inputs">
                                <input type="number" id="demo-weight" placeholder="Weight (kg)" min="30" max="300">
                                <input type="number" id="demo-height" placeholder="Height (cm)" min="100" max="250">
                                <button class="btn btn-primary" id="calculate-demo">Calculate</button>
                            </div>
                            <div id="demo-result" class="demo-result"></div>
                        </div>
                        
                        <button class="btn btn-secondary" onclick="history.back()">
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const calculateBtn = document.getElementById('calculate-demo');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateDemo());
        }
        
        // Enter key support
        const inputs = document.querySelectorAll('#demo-weight, #demo-height');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.calculateDemo();
                }
            });
        });
    }
    
    calculateDemo() {
        const weightInput = document.getElementById('demo-weight');
        const heightInput = document.getElementById('demo-height');
        const resultDiv = document.getElementById('demo-result');
        
        if (!weightInput || !heightInput || !resultDiv) return;
        
        const weight = parseFloat(weightInput.value);
        const height = parseFloat(heightInput.value);
        
        if (!weight || !height) {
            resultDiv.innerHTML = '<p class="error">Please enter valid weight and height values.</p>';
            return;
        }
        
        try {
            const validation = this.bmiService.validateInputs(weight, height, null, null, 'metric');
            if (!validation.isValid) {
                resultDiv.innerHTML = `<p class="error">${validation.errors.join(', ')}</p>`;
                return;
            }
            
            const bmiResult = this.bmiService.calculateBMI(weight, height, 'metric');
            const category = bmiResult.category;
            
            resultDiv.innerHTML = `
                <div class="bmi-result">
                    <h4>Your BMI Result</h4>
                    <div class="bmi-value" style="color: ${category.color}">
                        ${bmiResult.value}
                    </div>
                    <div class="bmi-category" style="color: ${category.color}">
                        ${category.name.toUpperCase()}
                    </div>
                    <div class="bmi-description">
                        ${category.description}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error calculating BMI:', error);
            resultDiv.innerHTML = '<p class="error">Error calculating BMI. Please try again.</p>';
        }
    }

    destroy() {
        // Cleanup if needed
    }
}