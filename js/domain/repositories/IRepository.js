/**
 * Generic Repository Interface
 * Defines the contract for data access operations
 */
export class IRepository {
    /**
     * Get all entities
     * @returns {Promise<Array>}
     */
    async getAll() {
        throw new Error('Method getAll must be implemented');
    }

    /**
     * Get entity by ID
     * @param {string} id 
     * @returns {Promise<Object|null>}
     */
    async getById(id) {
        throw new Error('Method getById must be implemented');
    }

    /**
     * Find entities by criteria
     * @param {Object} criteria 
     * @returns {Promise<Array>}
     */
    async findBy(criteria) {
        throw new Error('Method findBy must be implemented');
    }

    /**
     * Create new entity
     * @param {Object} entity 
     * @returns {Promise<Object>}
     */
    async create(entity) {
        throw new Error('Method create must be implemented');
    }

    /**
     * Update existing entity
     * @param {string} id 
     * @param {Object} entity 
     * @returns {Promise<Object|null>}
     */
    async update(id, entity) {
        throw new Error('Method update must be implemented');
    }

    /**
     * Delete entity by ID
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        throw new Error('Method delete must be implemented');
    }

    /**
     * Count entities
     * @param {Object} criteria 
     * @returns {Promise<number>}
     */
    async count(criteria = {}) {
        throw new Error('Method count must be implemented');
    }

    /**
     * Check if entity exists
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async exists(id) {
        throw new Error('Method exists must be implemented');
    }
}