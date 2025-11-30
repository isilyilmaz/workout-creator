/**
 * Content Loader
 * Handles dynamic loading of HTML content files
 */
export class ContentLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        
        // File location mapping for content subdirectories
        this.contentMapping = {
            // Main content files
            'home.html': 'main-content/home.html',
            'login.html': 'main-content/login.html',
            'profile-information.html': 'main-content/profile-information.html',
            'workout-creator.html': 'main-content/workout-creator.html',
            
            // Helper content files
            'create-your-workout.html': 'helper-content/create-your-workout.html',
            'workout-summary.html': 'helper-content/workout-summary.html',
            
            // Static content files
            'hero.html': 'static-content/hero.html',
            'hero-standalone.html': 'static-content/hero-standalone.html',
            'feature-workout-creator.html': 'static-content/feature-workout-creator.html',
            
            // Base content files
            'day-card.html': 'base-content/day-card.html'
        };
    }

    /**
     * Load content from HTML file
     */
    async loadContent(contentFile, useCache = true) {
        try {
            const cacheKey = contentFile;

            // Return cached content if available and caching is enabled
            if (useCache && this.cache.has(cacheKey)) {
                return {
                    success: true,
                    content: this.cache.get(cacheKey)
                };
            }

            // Return existing loading promise if already in progress
            if (this.loadingPromises.has(cacheKey)) {
                return await this.loadingPromises.get(cacheKey);
            }

            // Create loading promise
            const loadingPromise = this.fetchContent(contentFile);
            this.loadingPromises.set(cacheKey, loadingPromise);

            const result = await loadingPromise;

            // Remove from loading promises
            this.loadingPromises.delete(cacheKey);

            // Cache the result if successful
            if (result.success && useCache) {
                this.cache.set(cacheKey, result.content);
            }

            return result;

        } catch (error) {
            console.error(`Error loading content from ${contentFile}:`, error);
            return {
                success: false,
                error: `Failed to load ${contentFile}`,
                content: this.getErrorContent(contentFile, error.message)
            };
        }
    }

    /**
     * Resolve content file path using mapping
     */
    resolveContentPath(contentFile) {
        // Check if file is in mapping
        if (this.contentMapping[contentFile]) {
            return this.contentMapping[contentFile];
        }
        
        // If not in mapping, assume it's already a full path
        return contentFile;
    }

    /**
     * Fetch content from file
     */
    async fetchContent(contentFile) {
        try {
            const resolvedPath = this.resolveContentPath(contentFile);
            console.log(`Fetching content: ./content/${resolvedPath}`);
            const response = await fetch(`./content/${resolvedPath}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();
            console.log(`Successfully loaded content: ${contentFile} -> ${resolvedPath} (${content.length} chars)`);
            
            return {
                success: true,
                content: content
            };

        } catch (error) {
            console.error(`Fetch error for ${contentFile}:`, error);
            throw error;
        }
    }

    /**
     * Load home content
     */
    async loadHome() {
        return await this.loadContent('home.html');
    }

    /**
     * Load login content
     */
    async loadLogin() {
        return await this.loadContent('login.html');
    }

    /**
     * Load profile content
     */
    async loadProfile() {
        return await this.loadContent('profile-information.html');
    }
    
    /**
     * Load workout creator content
     */
    async loadWorkoutCreator() {
        return await this.loadContent('workout-creator.html');
    }

    /**
     * Load content and inject into container
     */
    async loadAndInject(contentFile, container) {
        try {
            if (!container) {
                throw new Error('Container element is required');
            }

            // Show loading state
            this.showLoadingState(container);

            const result = await this.loadContent(contentFile);

            if (result.success) {
                // Process includes before injection
                const processedContent = await this.processIncludes(result.content);
                container.innerHTML = processedContent;
                return {
                    success: true,
                    message: `${contentFile} loaded successfully`
                };
            } else {
                container.innerHTML = result.content; // Error content
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            console.error('Error in loadAndInject:', error);
            container.innerHTML = this.getErrorContent(contentFile, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Show loading state in container
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="content-loading">
                <div class="loading-spinner"></div>
                <p>Loading content...</p>
            </div>
        `;
    }

    /**
     * Get error content HTML
     */
    getErrorContent(contentFile, errorMessage) {
        return `
            <div class="content-error">
                <div class="error-icon">⚠️</div>
                <h2>Content Load Error</h2>
                <p>Failed to load <strong>${contentFile}</strong></p>
                <p class="error-details">${errorMessage}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        Refresh Page
                    </button>
                    <button class="btn btn-secondary" onclick="window.app?.navigateTo('home')">
                        Go Home
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Preload content files
     */
    async preloadContent(contentFiles) {
        try {
            const promises = contentFiles.map(file => this.loadContent(file));
            await Promise.all(promises);
            console.log('Content preloading completed');
        } catch (error) {
            console.warn('Some content failed to preload:', error);
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Content cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            files: Array.from(this.cache.keys()),
            loadingInProgress: this.loadingPromises.size
        };
    }

    /**
     * Remove specific file from cache
     */
    invalidateCache(contentFile) {
        this.cache.delete(contentFile);
    }

    /**
     * Check if content is cached
     */
    isCached(contentFile) {
        return this.cache.has(contentFile);
    }

    /**
     * Get content size estimate
     */
    getContentSize(contentFile) {
        const content = this.cache.get(contentFile);
        if (!content) return 0;
        
        return new Blob([content]).size;
    }

    /**
     * Load content with timeout
     */
    async loadContentWithTimeout(contentFile, timeout = 10000) {
        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Content loading timeout')), timeout);
            });

            const contentPromise = this.loadContent(contentFile);
            
            return await Promise.race([contentPromise, timeoutPromise]);

        } catch (error) {
            console.error(`Timeout loading ${contentFile}:`, error);
            return {
                success: false,
                error: `Timeout loading ${contentFile}`,
                content: this.getErrorContent(contentFile, 'Loading timeout')
            };
        }
    }

    /**
     * Batch load multiple content files
     */
    async loadMultipleContent(contentFiles) {
        try {
            const results = {};
            const promises = contentFiles.map(async (file) => {
                const result = await this.loadContent(file);
                results[file] = result;
                return result;
            });

            await Promise.allSettled(promises);
            
            return {
                success: true,
                results
            };

        } catch (error) {
            console.error('Error in batch loading:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Transform content before injection (for customization)
     */
    transformContent(content, transformers = []) {
        try {
            let transformedContent = content;
            
            transformers.forEach(transformer => {
                if (typeof transformer === 'function') {
                    transformedContent = transformer(transformedContent);
                }
            });

            return transformedContent;

        } catch (error) {
            console.warn('Content transformation error:', error);
            return content; // Return original content if transformation fails
        }
    }

    /**
     * Load content with transformers
     */
    async loadAndTransform(contentFile, transformers = []) {
        try {
            const result = await this.loadContent(contentFile);
            
            if (result.success) {
                result.content = this.transformContent(result.content, transformers);
            }
            
            return result;

        } catch (error) {
            console.error('Error in loadAndTransform:', error);
            return {
                success: false,
                error: error.message,
                content: this.getErrorContent(contentFile, error.message)
            };
        }
    }

    /**
     * Process include directives in content
     * Supports syntax: {{include:filename.html}}
     */
    async processIncludes(content) {
        try {
            // Regular expression to match include directives
            const includeRegex = /\{\{include:([^}]+)\}\}/g;
            const includes = [];
            let match;

            // Find all include directives
            while ((match = includeRegex.exec(content)) !== null) {
                includes.push({
                    fullMatch: match[0],
                    filename: match[1].trim()
                });
            }

            // If no includes found, return content as is
            if (includes.length === 0) {
                return content;
            }

            // Load all included files
            const includePromises = includes.map(async (include) => {
                try {
                    const result = await this.loadContent(include.filename, false); // Don't cache includes by default
                    return {
                        ...include,
                        content: result.success ? result.content : this.getIncludeErrorContent(include.filename, result.error)
                    };
                } catch (error) {
                    console.error(`Error loading include ${include.filename}:`, error);
                    return {
                        ...include,
                        content: this.getIncludeErrorContent(include.filename, error.message)
                    };
                }
            });

            const resolvedIncludes = await Promise.all(includePromises);

            // Replace all include directives with their content
            let processedContent = content;
            for (const include of resolvedIncludes) {
                processedContent = processedContent.replace(include.fullMatch, include.content);
            }

            // Also process template includes in the result
            processedContent = await this.processTemplateIncludes(processedContent);

            console.log(`Processed ${includes.length} includes in content`);
            return processedContent;

        } catch (error) {
            console.error('Error processing includes:', error);
            return content; // Return original content if processing fails
        }
    }

    /**
     * Get error content for failed includes
     */
    getIncludeErrorContent(filename, errorMessage) {
        return `
            <div class="include-error" style="border: 2px dashed #dc2626; padding: 16px; margin: 16px 0; border-radius: 8px; background: rgba(220, 38, 38, 0.1);">
                <p style="margin: 0; color: #dc2626; font-weight: 600;">
                    ⚠️ Failed to load include: ${filename}
                </p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 0.875rem;">
                    ${errorMessage}
                </p>
            </div>
        `;
    }

    /**
     * Process template variables in content
     * Supports syntax: {{variableName}}
     */
    processTemplateVariables(content, variables = {}) {
        try {
            let processedContent = content;
            
            // Replace all template variables
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                processedContent = processedContent.replace(regex, variables[key]);
            });
            
            return processedContent;
        } catch (error) {
            console.error('Error processing template variables:', error);
            return content;
        }
    }

    /**
     * Load and process template include with variables
     * Supports syntax: {{include-template:filename.html|var1:value1|var2:value2}}
     */
    async processTemplateIncludes(content) {
        try {
            const templateRegex = /\{\{include-template:([^|}]+)(\|[^}]+)?\}\}/g;
            const templates = [];
            let match;

            // Find all template include directives
            while ((match = templateRegex.exec(content)) !== null) {
                const filename = match[1].trim();
                const variableString = match[2] || '';
                const variables = {};

                // Parse variables from |var1:value1|var2:value2 format
                if (variableString) {
                    const varPairs = variableString.split('|').filter(pair => pair.trim());
                    varPairs.forEach(pair => {
                        const [key, value] = pair.split(':');
                        if (key && value) {
                            variables[key.trim()] = value.trim();
                        }
                    });
                }

                templates.push({
                    fullMatch: match[0],
                    filename: filename,
                    variables: variables
                });
            }

            // If no template includes found, return content as is
            if (templates.length === 0) {
                return content;
            }

            // Load and process all template files
            const templatePromises = templates.map(async (template) => {
                try {
                    const result = await this.loadContent(template.filename, false);
                    if (result.success) {
                        const processedTemplate = this.processTemplateVariables(result.content, template.variables);
                        return {
                            ...template,
                            content: processedTemplate
                        };
                    } else {
                        return {
                            ...template,
                            content: this.getIncludeErrorContent(template.filename, result.error)
                        };
                    }
                } catch (error) {
                    console.error(`Error loading template ${template.filename}:`, error);
                    return {
                        ...template,
                        content: this.getIncludeErrorContent(template.filename, error.message)
                    };
                }
            });

            const resolvedTemplates = await Promise.all(templatePromises);

            // Replace all template directives with their processed content
            let processedContent = content;
            for (const template of resolvedTemplates) {
                processedContent = processedContent.replace(template.fullMatch, template.content);
            }

            console.log(`Processed ${templates.length} template includes in content`);
            return processedContent;

        } catch (error) {
            console.error('Error processing template includes:', error);
            return content;
        }
    }

    /**
     * Load content with includes processed
     */
    async loadContentWithIncludes(contentFile, useCache = true) {
        try {
            const result = await this.loadContent(contentFile, useCache);
            
            if (result.success) {
                // Process both regular includes and template includes
                result.content = await this.processIncludes(result.content);
                result.content = await this.processTemplateIncludes(result.content);
            }
            
            return result;

        } catch (error) {
            console.error('Error in loadContentWithIncludes:', error);
            return {
                success: false,
                error: error.message,
                content: this.getErrorContent(contentFile, error.message)
            };
        }
    }
}
