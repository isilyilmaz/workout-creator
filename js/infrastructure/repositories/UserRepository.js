/**
 * User Repository
 * Specialized repository for user authentication and management
 */
import { JsonRepository } from './JsonRepository.js';

export class UserRepository extends JsonRepository {
    constructor() {
        super('user-info.json', null, 'user-sessions');
    }

    /**
     * Load user data from JSON file
     */
    async loadUserData() {
        try {
            const data = await this.loadFromFile();
            return data.users || {};
        } catch (error) {
            console.error('Error loading user data:', error);
            return {};
        }
    }

    /**
     * Find user by username
     */
    async findByUsername(username) {
        try {
            const users = await this.loadUserData();
            return Object.values(users).find(user => 
                user.username === username
            ) || null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            return null;
        }
    }

    /**
     * Find user by email
     */
    async findByEmail(email) {
        try {
            const users = await this.loadUserData();
            return Object.values(users).find(user => 
                user.email.toLowerCase() === email.toLowerCase()
            ) || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            return null;
        }
    }

    /**
     * Find user by username or email
     */
    async findByUsernameOrEmail(usernameOrEmail) {
        try {
            const users = await this.loadUserData();
            const searchTerm = usernameOrEmail.toLowerCase();
            
            return Object.values(users).find(user => 
                user.username === usernameOrEmail || 
                user.email.toLowerCase() === searchTerm
            ) || null;
        } catch (error) {
            console.error('Error finding user by username or email:', error);
            return null;
        }
    }

    /**
     * Get user by ID (user key in the JSON)
     */
    async findById(userId) {
        try {
            const users = await this.loadUserData();
            return users[userId] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            return null;
        }
    }

    /**
     * Validate user credentials
     */
    async validateCredentials(usernameOrEmail, password) {
        try {
            const user = await this.findByUsernameOrEmail(usernameOrEmail);
            
            if (!user) {
                return { valid: false, error: 'User not found' };
            }

            // Simple password validation (in production, use proper hashing)
            if (user.password !== password) {
                return { valid: false, error: 'Invalid password' };
            }

            return { valid: true, user };
        } catch (error) {
            console.error('Error validating credentials:', error);
            return { valid: false, error: 'Authentication error' };
        }
    }

    /**
     * Get all users (admin only)
     */
    async getAllUsers() {
        try {
            const users = await this.loadUserData();
            // Remove passwords from the response
            const sanitizedUsers = Object.keys(users).map(key => ({
                id: key,
                ...users[key],
                password: undefined
            }));
            return sanitizedUsers;
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }

    /**
     * Check if user is admin
     */
    async isAdmin(userId) {
        try {
            const user = await this.findById(userId);
            return user && user.isAdmin === "1";
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Check if user subscription is active
     */
    isSubscriptionActive(user) {
        try {
            if (!user.subscriptionenddate) return false;
            
            const currentDate = new Date();
            const endDate = this.parseDate(user.subscriptionenddate);
            
            return currentDate <= endDate;
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    }

    /**
     * Parse date string (format: YYYYMMDD)
     */
    parseDate(dateString) {
        if (!dateString || dateString.length !== 8) {
            return new Date();
        }
        
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1; // Month is 0-indexed
        const day = parseInt(dateString.substring(6, 8));
        
        return new Date(year, month, day);
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        try {
            const date = this.parseDate(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Get subscription info
     */
    getSubscriptionInfo(user) {
        try {
            const isActive = this.isSubscriptionActive(user);
            const startDate = this.formatDate(user.subscriptionstartdate);
            const endDate = this.formatDate(user.subscriptionenddate);
            
            return {
                isActive,
                startDate,
                endDate,
                renewalFee: user.renewalfee ? `$${user.renewalfee}` : 'Free',
                freeTrial: user.freetrial === "1",
                daysRemaining: this.getDaysRemaining(user.subscriptionenddate)
            };
        } catch (error) {
            console.error('Error getting subscription info:', error);
            return {
                isActive: false,
                startDate: 'Unknown',
                endDate: 'Unknown',
                renewalFee: 'Unknown',
                freeTrial: false,
                daysRemaining: 0
            };
        }
    }

    /**
     * Calculate days remaining in subscription
     */
    getDaysRemaining(endDateString) {
        try {
            const currentDate = new Date();
            const endDate = this.parseDate(endDateString);
            const timeDiff = endDate.getTime() - currentDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            return Math.max(0, daysDiff);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Save user session
     */
    saveSession(user, rememberMe = false) {
        try {
            const session = {
                user: {
                    ...user,
                    password: undefined // Never store password in session
                },
                timestamp: Date.now(),
                rememberMe,
                expiresAt: rememberMe 
                    ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
                    : Date.now() + (8 * 60 * 60 * 1000) // 8 hours
            };

            localStorage.setItem('user-session', JSON.stringify(session));
            return true;
        } catch (error) {
            console.error('Error saving session:', error);
            return false;
        }
    }

    /**
     * Load user session
     */
    loadSession() {
        try {
            const sessionData = localStorage.getItem('user-session');
            if (!sessionData) return null;

            const session = JSON.parse(sessionData);
            
            // Check if session has expired
            if (Date.now() > session.expiresAt) {
                this.clearSession();
                return null;
            }

            return session;
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
            return null;
        }
    }

    /**
     * Clear user session
     */
    clearSession() {
        try {
            localStorage.removeItem('user-session');
            return true;
        } catch (error) {
            console.error('Error clearing session:', error);
            return false;
        }
    }

    /**
     * Update user profile (basic info only)
     */
    async updateUserProfile(userId, updates) {
        try {
            // In a real application, this would update the user data
            // For now, we'll just update the session if the user is currently logged in
            const session = this.loadSession();
            if (session && session.user.username === userId) {
                session.user = { ...session.user, ...updates };
                localStorage.setItem('user-session', JSON.stringify(session));
                return { success: true, user: session.user };
            }
            
            return { success: false, error: 'Cannot update user profile' };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: 'Update failed' };
        }
    }
}