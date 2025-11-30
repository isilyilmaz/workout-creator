/**
 * Form Builder Component System
 * Creates reusable form components to eliminate duplication
 */

export class FormBuilder {
    constructor() {
        this.fieldTypes = {
            text: this.createTextField.bind(this),
            number: this.createNumberField.bind(this),
            email: this.createEmailField.bind(this),
            password: this.createPasswordField.bind(this),
            select: this.createSelectField.bind(this),
            textarea: this.createTextareaField.bind(this),
            checkbox: this.createCheckboxField.bind(this),
            radio: this.createRadioField.bind(this)
        };
    }

    /**
     * Build a complete form from configuration
     */
    buildForm(config) {
        const form = document.createElement('form');
        form.className = config.className || 'form';
        
        if (config.id) {
            form.id = config.id;
        }

        // Add form fields
        if (config.fields && Array.isArray(config.fields)) {
            config.fields.forEach(fieldConfig => {
                const fieldElement = this.buildField(fieldConfig);
                if (fieldElement) {
                    form.appendChild(fieldElement);
                }
            });
        }

        // Add form actions if provided
        if (config.actions && Array.isArray(config.actions)) {
            const actionsContainer = this.createActionsContainer(config.actions);
            form.appendChild(actionsContainer);
        }

        return form;
    }

    /**
     * Build a single form field
     */
    buildField(fieldConfig) {
        if (!fieldConfig.type || !this.fieldTypes[fieldConfig.type]) {
            console.warn(`Unknown field type: ${fieldConfig.type}`);
            return null;
        }

        const container = document.createElement('div');
        container.className = fieldConfig.containerClass || 'form-group';

        // Add label if provided
        if (fieldConfig.label) {
            const label = this.createLabel(fieldConfig);
            container.appendChild(label);
        }

        // Create the field based on type
        const field = this.fieldTypes[fieldConfig.type](fieldConfig);
        container.appendChild(field);

        // Add help text if provided
        if (fieldConfig.helpText) {
            const helpText = this.createHelpText(fieldConfig.helpText);
            container.appendChild(helpText);
        }

        // Add error container for validation messages
        if (fieldConfig.validation) {
            const errorContainer = this.createErrorContainer(fieldConfig.id);
            container.appendChild(errorContainer);
        }

        return container;
    }

    /**
     * Create text field
     */
    createTextField(config) {
        const input = document.createElement('input');
        input.type = 'text';
        this.applyCommonFieldProps(input, config);
        
        if (config.placeholder) input.placeholder = config.placeholder;
        if (config.maxlength) input.maxLength = config.maxlength;
        if (config.pattern) input.pattern = config.pattern;
        
        return input;
    }

    /**
     * Create number field
     */
    createNumberField(config) {
        const input = document.createElement('input');
        input.type = 'number';
        this.applyCommonFieldProps(input, config);
        
        if (config.min !== undefined) input.min = config.min;
        if (config.max !== undefined) input.max = config.max;
        if (config.step !== undefined) input.step = config.step;
        if (config.placeholder) input.placeholder = config.placeholder;
        
        return input;
    }

    /**
     * Create email field
     */
    createEmailField(config) {
        const input = document.createElement('input');
        input.type = 'email';
        this.applyCommonFieldProps(input, config);
        
        if (config.placeholder) input.placeholder = config.placeholder;
        
        return input;
    }

    /**
     * Create password field
     */
    createPasswordField(config) {
        const input = document.createElement('input');
        input.type = 'password';
        this.applyCommonFieldProps(input, config);
        
        if (config.placeholder) input.placeholder = config.placeholder;
        if (config.minlength) input.minLength = config.minlength;
        
        return input;
    }

    /**
     * Create select field
     */
    createSelectField(config) {
        const select = document.createElement('select');
        this.applyCommonFieldProps(select, config);
        
        // Add default option if specified
        if (config.placeholder) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = config.placeholder;
            defaultOption.disabled = true;
            defaultOption.selected = !config.value;
            select.appendChild(defaultOption);
        }

        // Add options
        if (config.options && Array.isArray(config.options)) {
            config.options.forEach(option => {
                const optionElement = document.createElement('option');
                
                if (typeof option === 'string') {
                    optionElement.value = option;
                    optionElement.textContent = option;
                } else if (typeof option === 'object') {
                    optionElement.value = option.value;
                    optionElement.textContent = option.label || option.value;
                    if (option.disabled) optionElement.disabled = true;
                }
                
                if (config.value === optionElement.value) {
                    optionElement.selected = true;
                }
                
                select.appendChild(optionElement);
            });
        }
        
        return select;
    }

    /**
     * Create textarea field
     */
    createTextareaField(config) {
        const textarea = document.createElement('textarea');
        this.applyCommonFieldProps(textarea, config);
        
        if (config.placeholder) textarea.placeholder = config.placeholder;
        if (config.rows) textarea.rows = config.rows;
        if (config.cols) textarea.cols = config.cols;
        if (config.maxlength) textarea.maxLength = config.maxlength;
        
        return textarea;
    }

    /**
     * Create checkbox field
     */
    createCheckboxField(config) {
        const container = document.createElement('div');
        container.className = 'checkbox-container';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        this.applyCommonFieldProps(input, config);
        
        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = config.checkboxLabel || config.label;
        label.className = 'checkbox-label';
        
        container.appendChild(input);
        container.appendChild(label);
        
        return container;
    }

    /**
     * Create radio field group
     */
    createRadioField(config) {
        const container = document.createElement('div');
        container.className = 'radio-group';
        
        if (config.options && Array.isArray(config.options)) {
            config.options.forEach((option, index) => {
                const radioContainer = document.createElement('div');
                radioContainer.className = 'radio-item';
                
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = config.name || config.id;
                input.id = `${config.id}_${index}`;
                input.className = config.className || 'form-input';
                
                if (typeof option === 'string') {
                    input.value = option;
                } else if (typeof option === 'object') {
                    input.value = option.value;
                }
                
                if (config.value === input.value) {
                    input.checked = true;
                }
                
                if (config.required) input.required = true;
                if (config.disabled) input.disabled = true;
                
                const label = document.createElement('label');
                label.htmlFor = input.id;
                label.textContent = typeof option === 'string' ? option : option.label;
                label.className = 'radio-label';
                
                radioContainer.appendChild(input);
                radioContainer.appendChild(label);
                container.appendChild(radioContainer);
            });
        }
        
        return container;
    }

    /**
     * Apply common field properties
     */
    applyCommonFieldProps(element, config) {
        if (config.id) element.id = config.id;
        if (config.name) element.name = config.name;
        if (config.value !== undefined) element.value = config.value;
        if (config.required) element.required = true;
        if (config.disabled) element.disabled = true;
        if (config.readonly) element.readOnly = true;
        
        element.className = config.className || 'form-input';
        
        // Add data attributes
        if (config.dataAttributes) {
            Object.entries(config.dataAttributes).forEach(([key, value]) => {
                element.setAttribute(`data-${key}`, value);
            });
        }
        
        // Add event listeners
        if (config.eventListeners) {
            Object.entries(config.eventListeners).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        }
    }

    /**
     * Create label element
     */
    createLabel(config) {
        const label = document.createElement('label');
        label.textContent = config.label;
        label.className = config.labelClass || 'form-label';
        
        if (config.id) {
            label.htmlFor = config.id;
        }
        
        if (config.required) {
            const requiredIndicator = document.createElement('span');
            requiredIndicator.textContent = ' *';
            requiredIndicator.className = 'required-indicator';
            label.appendChild(requiredIndicator);
        }
        
        return label;
    }

    /**
     * Create help text element
     */
    createHelpText(text) {
        const helpElement = document.createElement('small');
        helpElement.className = 'form-help-text';
        helpElement.textContent = text;
        return helpElement;
    }

    /**
     * Create error container for validation messages
     */
    createErrorContainer(fieldId) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'form-error-message';
        errorContainer.id = `${fieldId}-error`;
        errorContainer.style.display = 'none';
        return errorContainer;
    }

    /**
     * Create actions container with buttons
     */
    createActionsContainer(actions) {
        const container = document.createElement('div');
        container.className = 'form-actions';
        
        actions.forEach(actionConfig => {
            const button = this.createButton(actionConfig);
            container.appendChild(button);
        });
        
        return container;
    }

    /**
     * Create button element
     */
    createButton(config) {
        const button = document.createElement('button');
        button.textContent = config.label || config.text;
        button.type = config.type || 'button';
        button.className = config.className || 'btn btn-primary';
        
        if (config.id) button.id = config.id;
        if (config.disabled) button.disabled = true;
        
        // Add data attributes for action handling
        if (config.action) {
            button.setAttribute('data-action', config.action);
        }
        
        if (config.dataAttributes) {
            Object.entries(config.dataAttributes).forEach(([key, value]) => {
                button.setAttribute(`data-${key}`, value);
            });
        }
        
        if (config.eventListeners) {
            Object.entries(config.eventListeners).forEach(([event, handler]) => {
                button.addEventListener(event, handler);
            });
        }
        
        return button;
    }

    /**
     * Get form data as object
     */
    getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (like checkboxes)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }

    /**
     * Populate form with data
     */
    populateForm(formElement, data) {
        Object.entries(data).forEach(([key, value]) => {
            const field = formElement.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(value);
                } else if (field.type === 'radio') {
                    const radioButton = formElement.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radioButton) radioButton.checked = true;
                } else {
                    field.value = value;
                }
            }
        });
    }

    /**
     * Clear form data
     */
    clearForm(formElement) {
        const inputs = formElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }

    /**
     * Show validation error for a field
     */
    showFieldError(fieldId, message) {
        const errorContainer = document.getElementById(`${fieldId}-error`);
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('form-input-error');
            }
        }
    }

    /**
     * Hide validation error for a field
     */
    hideFieldError(fieldId) {
        const errorContainer = document.getElementById(`${fieldId}-error`);
        if (errorContainer) {
            errorContainer.style.display = 'none';
            
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.remove('form-input-error');
            }
        }
    }

    /**
     * Validate form based on configuration
     */
    validateForm(formElement, validationRules) {
        let isValid = true;
        const errors = {};

        Object.entries(validationRules).forEach(([fieldName, rules]) => {
            const field = formElement.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const fieldErrors = [];

            // Required validation
            if (rules.required && (!field.value || field.value.trim() === '')) {
                fieldErrors.push('This field is required');
            }

            // Min length validation
            if (rules.minLength && field.value.length < rules.minLength) {
                fieldErrors.push(`Must be at least ${rules.minLength} characters`);
            }

            // Max length validation
            if (rules.maxLength && field.value.length > rules.maxLength) {
                fieldErrors.push(`Must be no more than ${rules.maxLength} characters`);
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(field.value)) {
                fieldErrors.push(rules.patternMessage || 'Invalid format');
            }

            // Custom validation function
            if (rules.validate && typeof rules.validate === 'function') {
                const customResult = rules.validate(field.value, formElement);
                if (customResult !== true) {
                    fieldErrors.push(customResult);
                }
            }

            if (fieldErrors.length > 0) {
                isValid = false;
                errors[fieldName] = fieldErrors[0]; // Show first error
                this.showFieldError(field.id || fieldName, fieldErrors[0]);
            } else {
                this.hideFieldError(field.id || fieldName);
            }
        });

        return { isValid, errors };
    }
}