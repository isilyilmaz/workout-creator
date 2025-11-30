/**
 * JSON File Repository Implementation
 * Handles data access for JSON files and localStorage
 */
import { IRepository } from '../../domain/repositories/IRepository.js';

export class JsonRepository extends IRepository {
    constructor(dataFileName, entityClass = null, localStorageKey = null) {
        super();
        this.dataFileName = dataFileName;
        this.entityClass = entityClass;
        this.localStorageKey = localStorageKey;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.lastFetch = null;
    }

    /**
     * Load data from JSON file
     */
    async loadFromFile() {
        const now = Date.now();
        const cacheKey = `file-${this.dataFileName}`;
        
        if (this.cache.has(cacheKey) && this.lastFetch && (now - this.lastFetch < this.cacheExpiry)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`./data/${this.dataFileName}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${this.dataFileName}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.cache.set(cacheKey, data);
            this.lastFetch = now;
            
            return data;
        } catch (error) {
            console.error(`Error loading ${this.dataFileName}:`, error);
            throw error;
        }
    }

    /**
     * Load data from localStorage
     */
    loadFromStorage() {
        if (!this.localStorageKey) {
            return null;
        }

        try {
            const data = localStorage.getItem(this.localStorageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading from localStorage (${this.localStorageKey}):`, error);
            return null;
        }
    }

    /**
     * Save data to localStorage
     */
    saveToStorage(data) {
        if (!this.localStorageKey) {
            return false;
        }

        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving to localStorage (${this.localStorageKey}):`, error);
            return false;
        }
    }

    /**
     * Get all entities
     */
    async getAll() {
        const data = await this.loadFromFile();
        let entities = [];

        if (Array.isArray(data)) {
            entities = data;
        } else if (data && typeof data === 'object') {
            const keys = Object.keys(data);
            if (keys.length === 1 && Array.isArray(data[keys[0]])) {
                entities = data[keys[0]];
            } else {
                entities = [data];
            }
        }

        if (this.entityClass) {
            return entities.map(item => this.entityClass.fromJSON ? this.entityClass.fromJSON(item) : new this.entityClass(item));
        }

        return entities;
    }

    /**
     * Get entity by ID
     */
    async getById(id) {
        const entities = await this.getAll();
        return entities.find(entity => entity.id === id || entity.name === id) || null;
    }

    /**
     * Find entities by criteria
     */
    async findBy(criteria) {
        const entities = await this.getAll();
        
        return entities.filter(entity => {
            return Object.keys(criteria).every(key => {
                const criteriaValue = criteria[key];
                const entityValue = entity[key];

                if (typeof criteriaValue === 'string' && typeof entityValue === 'string') {
                    return entityValue.toLowerCase().includes(criteriaValue.toLowerCase());
                }

                if (Array.isArray(entityValue)) {
                    if (Array.isArray(criteriaValue)) {
                        return criteriaValue.some(cv => entityValue.includes(cv));
                    } else {
                        return entityValue.includes(criteriaValue);
                    }
                }

                if (Array.isArray(criteriaValue)) {
                    return criteriaValue.includes(entityValue);
                }

                return entityValue === criteriaValue;
            });
        });
    }

    /**
     * Create new entity (localStorage only)
     */
    async create(entity) {
        if (!this.localStorageKey) {
            throw new Error('Create operation requires localStorage key');
        }

        let data = this.loadFromStorage() || [];
        if (!Array.isArray(data)) {
            data = [];
        }

        const newEntity = this.entityClass && entity instanceof this.entityClass 
            ? entity.toJSON() 
            : { ...entity, id: entity.id || this.generateId() };

        data.push(newEntity);
        this.saveToStorage(data);

        return this.entityClass ? this.entityClass.fromJSON(newEntity) : newEntity;
    }

    /**
     * Update existing entity (localStorage only)
     */
    async update(id, updates) {
        if (!this.localStorageKey) {
            throw new Error('Update operation requires localStorage key');
        }

        let data = this.loadFromStorage() || [];
        if (!Array.isArray(data)) {
            return null;
        }

        const index = data.findIndex(item => item.id === id);
        if (index === -1) {
            return null;
        }

        data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
        this.saveToStorage(data);

        return this.entityClass ? this.entityClass.fromJSON(data[index]) : data[index];
    }

    /**
     * Delete entity (localStorage only)
     */
    async delete(id) {
        if (!this.localStorageKey) {
            throw new Error('Delete operation requires localStorage key');
        }

        let data = this.loadFromStorage() || [];
        if (!Array.isArray(data)) {
            return false;
        }

        const initialLength = data.length;
        data = data.filter(item => item.id !== id);
        
        if (data.length !== initialLength) {
            this.saveToStorage(data);
            return true;
        }

        return false;
    }

    /**
     * Count entities
     */
    async count(criteria = {}) {
        if (Object.keys(criteria).length === 0) {
            const entities = await this.getAll();
            return entities.length;
        }

        const filteredEntities = await this.findBy(criteria);
        return filteredEntities.length;
    }

    /**
     * Check if entity exists
     */
    async exists(id) {
        const entity = await this.getById(id);
        return entity !== null;
    }

    /**
     * Search entities with text query
     */
    async search(query, fields = ['name']) {
        const entities = await this.getAll();
        const searchTerm = query.toLowerCase();

        return entities.filter(entity => {
            return fields.some(field => {
                const value = entity[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(searchTerm);
                }
                if (Array.isArray(value)) {
                    return value.some(v => 
                        typeof v === 'string' && v.toLowerCase().includes(searchTerm)
                    );
                }
                return false;
            });
        });
    }

    /**
     * Filter entities with multiple criteria
     */
    async filter(filters) {
        const entities = await this.getAll();

        return entities.filter(entity => {
            return Object.keys(filters).every(filterKey => {
                const filterValue = filters[filterKey];
                
                if (filterValue === null || filterValue === undefined) {
                    return true;
                }

                switch (filterKey) {
                    case 'equipment':
                        return filterValue.includes('all') || filterValue.includes(entity.equipment);
                    
                    case 'difficulty':
                        if (Array.isArray(filterValue) && filterValue.length === 2) {
                            const [min, max] = filterValue;
                            return entity.difficultyLevel >= min && entity.difficultyLevel <= max;
                        }
                        return entity.difficultyLevel === filterValue;
                    
                    case 'targetMuscles':
                        if (!entity.targetMuscles || !Array.isArray(entity.targetMuscles)) {
                            return false;
                        }
                        return filterValue.some(muscle => entity.targetMuscles.includes(muscle));
                    
                    case 'category':
                        return entity.category === filterValue;
                    
                    default:
                        return entity[filterKey] === filterValue;
                }
            });
        });
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        this.lastFetch = null;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            lastFetch: this.lastFetch,
            isExpired: this.lastFetch ? (Date.now() - this.lastFetch) > this.cacheExpiry : true
        };
    }
}