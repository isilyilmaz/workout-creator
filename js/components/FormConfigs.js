/**
 * Pre-defined Form Configurations
 * Common form configurations to eliminate duplication
 */

export const FormConfigs = {
    // Exercise form configuration
    exerciseForm: {
        id: 'exercise-form',
        className: 'exercise-form',
        fields: [
            {
                type: 'select',
                id: 'exercise-name-select',
                name: 'exerciseName',
                label: 'Exercise Name',
                placeholder: 'Select Exercise',
                required: true,
                options: [
                    'Deadlift',
                    'Bench Press',
                    'Squat',
                    'Pull-ups',
                    'Overhead Press',
                    'Barbell Row',
                    'Incline Dumbbell Press',
                    'Triceps Pushdown',
                    'Barbell Curl',
                    'Lateral Raise',
                    'Dips',
                    'Lat Pulldown'
                ]
            },
            {
                type: 'number',
                id: 'sets-input',
                name: 'sets',
                label: 'Sets',
                required: true,
                min: 1,
                max: 10,
                value: 3,
                containerClass: 'form-group form-group-inline'
            },
            {
                type: 'number',
                id: 'reps-input',
                name: 'reps',
                label: 'Reps',
                required: true,
                min: 1,
                max: 50,
                value: 12,
                containerClass: 'form-group form-group-inline'
            },
            {
                type: 'number',
                id: 'intensity-input',
                name: 'intensity',
                label: 'Intensity (%)',
                required: true,
                min: 0,
                max: 100,
                value: 75,
                containerClass: 'form-group form-group-inline'
            }
        ],
        actions: [
            {
                type: 'button',
                label: 'Cancel',
                className: 'btn btn-secondary',
                action: 'close-modal'
            },
            {
                type: 'submit',
                label: 'Add Exercise',
                className: 'btn btn-primary',
                action: 'confirm-add-exercise'
            }
        ]
    },

    // Rest period form configuration
    restForm: {
        id: 'rest-form',
        className: 'rest-form',
        fields: [
            {
                type: 'number',
                id: 'rest-duration-input',
                name: 'duration',
                label: 'Duration (minutes)',
                required: true,
                min: 1,
                max: 60,
                value: 5
            },
            {
                type: 'select',
                id: 'rest-type-select',
                name: 'restType',
                label: 'Rest Type',
                required: true,
                options: [
                    { value: 'active', label: 'Active Rest' },
                    { value: 'passive', label: 'Passive Rest' },
                    { value: 'complete', label: 'Complete Rest' }
                ],
                value: 'active'
            }
        ],
        actions: [
            {
                type: 'button',
                label: 'Cancel',
                className: 'btn btn-secondary',
                action: 'close-modal'
            },
            {
                type: 'submit',
                label: 'Add Rest',
                className: 'btn btn-primary',
                action: 'confirm-add-rest'
            }
        ]
    },

    // Login form configuration
    loginForm: {
        id: 'login-form',
        className: 'login-form',
        fields: [
            {
                type: 'email',
                id: 'email-input',
                name: 'email',
                label: 'Email Address',
                placeholder: 'Enter your email',
                required: true,
                validation: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    patternMessage: 'Please enter a valid email address'
                }
            },
            {
                type: 'password',
                id: 'password-input',
                name: 'password',
                label: 'Password',
                placeholder: 'Enter your password',
                required: true,
                validation: {
                    required: true,
                    minLength: 6
                }
            },
            {
                type: 'checkbox',
                id: 'remember-me',
                name: 'rememberMe',
                checkboxLabel: 'Remember me',
                containerClass: 'form-group checkbox-group'
            }
        ],
        actions: [
            {
                type: 'submit',
                label: 'Sign In',
                className: 'btn btn-primary btn-block',
                action: 'login'
            }
        ]
    },

    // Profile form configuration
    profileForm: {
        id: 'profile-form',
        className: 'profile-form',
        fields: [
            {
                type: 'text',
                id: 'name-input',
                name: 'name',
                label: 'Full Name',
                placeholder: 'Enter your full name',
                required: true,
                validation: {
                    required: true,
                    minLength: 2
                }
            },
            {
                type: 'email',
                id: 'profile-email-input',
                name: 'email',
                label: 'Email Address',
                placeholder: 'Enter your email',
                required: true,
                validation: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    patternMessage: 'Please enter a valid email address'
                }
            },
            {
                type: 'number',
                id: 'age-input',
                name: 'age',
                label: 'Age',
                placeholder: 'Enter your age',
                min: 13,
                max: 120,
                validation: {
                    min: 13,
                    max: 120
                }
            },
            {
                type: 'select',
                id: 'fitness-level-select',
                name: 'fitnessLevel',
                label: 'Fitness Level',
                placeholder: 'Select your fitness level',
                options: [
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                    { value: 'expert', label: 'Expert' }
                ]
            },
            {
                type: 'textarea',
                id: 'bio-input',
                name: 'bio',
                label: 'Bio',
                placeholder: 'Tell us about yourself...',
                rows: 4,
                maxlength: 500,
                helpText: 'Maximum 500 characters'
            }
        ],
        actions: [
            {
                type: 'button',
                label: 'Cancel',
                className: 'btn btn-secondary',
                action: 'cancel-profile'
            },
            {
                type: 'submit',
                label: 'Save Profile',
                className: 'btn btn-primary',
                action: 'save-profile'
            }
        ]
    },

    // Workout metadata form configuration
    workoutMetadataForm: {
        id: 'workout-metadata-form',
        className: 'workout-metadata-form',
        fields: [
            {
                type: 'text',
                id: 'workout-name-input',
                name: 'workoutName',
                label: 'Workout Name',
                placeholder: 'Enter workout name',
                required: true,
                validation: {
                    required: true,
                    minLength: 3
                }
            },
            {
                type: 'textarea',
                id: 'workout-description-input',
                name: 'description',
                label: 'Description',
                placeholder: 'Describe your workout...',
                rows: 3,
                maxlength: 300,
                helpText: 'Brief description of the workout'
            },
            {
                type: 'select',
                id: 'difficulty-select',
                name: 'difficulty',
                label: 'Difficulty Level',
                required: true,
                options: [
                    { value: '1', label: '1 - Very Easy' },
                    { value: '2', label: '2 - Easy' },
                    { value: '3', label: '3 - Moderate' },
                    { value: '4', label: '4 - Moderate+' },
                    { value: '5', label: '5 - Intermediate' },
                    { value: '6', label: '6 - Intermediate+' },
                    { value: '7', label: '7 - Hard' },
                    { value: '8', label: '8 - Very Hard' },
                    { value: '9', label: '9 - Extreme' },
                    { value: '10', label: '10 - Maximum' }
                ],
                value: '5'
            },
            {
                type: 'text',
                id: 'duration-input',
                name: 'duration',
                label: 'Estimated Duration',
                placeholder: 'e.g., 45 minutes',
                helpText: 'How long does this workout typically take?'
            }
        ],
        actions: [
            {
                type: 'button',
                label: 'Cancel',
                className: 'btn btn-secondary',
                action: 'cancel-metadata'
            },
            {
                type: 'submit',
                label: 'Save',
                className: 'btn btn-primary',
                action: 'save-metadata'
            }
        ]
    },

    // Search form configuration
    searchForm: {
        id: 'search-form',
        className: 'search-form',
        fields: [
            {
                type: 'text',
                id: 'search-input',
                name: 'searchQuery',
                label: 'Search',
                placeholder: 'Search exercises, workouts...',
                className: 'form-input search-input'
            }
        ],
        actions: [
            {
                type: 'submit',
                label: 'Search',
                className: 'btn btn-primary',
                action: 'search'
            },
            {
                type: 'button',
                label: 'Clear',
                className: 'btn btn-secondary',
                action: 'clear-search'
            }
        ]
    }
};

/**
 * Get form configuration by name
 */
export function getFormConfig(configName) {
    return FormConfigs[configName] ? { ...FormConfigs[configName] } : null;
}

/**
 * Get field configuration from any form config
 */
export function getFieldConfig(configName, fieldName) {
    const formConfig = getFormConfig(configName);
    if (!formConfig || !formConfig.fields) return null;
    
    return formConfig.fields.find(field => field.name === fieldName || field.id === fieldName);
}

/**
 * Merge custom configuration with base configuration
 */
export function mergeFormConfig(baseConfigName, customConfig) {
    const baseConfig = getFormConfig(baseConfigName);
    if (!baseConfig) return customConfig;
    
    return {
        ...baseConfig,
        ...customConfig,
        fields: customConfig.fields ? 
            [...(baseConfig.fields || []), ...customConfig.fields] : 
            baseConfig.fields,
        actions: customConfig.actions ? 
            [...(baseConfig.actions || []), ...customConfig.actions] : 
            baseConfig.actions
    };
}

/**
 * Create a quick form configuration
 */
export function createQuickForm(fields, actions = []) {
    return {
        id: 'quick-form',
        className: 'quick-form',
        fields: fields.map(field => {
            if (typeof field === 'string') {
                // Convert string to basic text field
                return {
                    type: 'text',
                    id: field.toLowerCase().replace(/\s+/g, '-'),
                    name: field.toLowerCase().replace(/\s+/g, '_'),
                    label: field,
                    required: true
                };
            }
            return field;
        }),
        actions: actions.length > 0 ? actions : [
            {
                type: 'submit',
                label: 'Submit',
                className: 'btn btn-primary',
                action: 'submit'
            }
        ]
    };
}