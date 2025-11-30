/**
 * User Service
 * Application service for user authentication and management
 */
import { UserRepository } from '../../infrastructure/repositories/UserRepository.js';

export class UserService {
    constructor() {
        this.userRepository = new UserRepository();
        this.currentUser = null;
        this.authCallbacks = [];
        this.initializeAuth();
    }

    /**
     * Initialize authentication on service creation
     */
    async initializeAuth() {
        try {
            const session = this.userRepository.loadSession();
            if (session && session.user) {
                this.currentUser = session.user;
                this.notifyAuthChange(true, this.currentUser);
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
        }
    }

    /**
     * Authenticate user with username/email and password
     */
    async authenticate(usernameOrEmail, password, rememberMe = false) {
        try {
            if (!usernameOrEmail || !password) {
                return {
                    success: false,
                    error: 'Username/email and password are required'
                };
            }

            const validation = await this.userRepository.validateCredentials(
                usernameOrEmail.trim(), 
                password
            );

            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid credentials'
                };
            }

            // Set current user
            this.currentUser = validation.user;

            // Save session
            const sessionSaved = this.userRepository.saveSession(validation.user, rememberMe);
            if (!sessionSaved) {
                return {
                    success: false,
                    error: 'Failed to save session'
                };
            }

            // Notify auth change
            this.notifyAuthChange(true, this.currentUser);

            return {
                success: true,
                user: this.currentUser,
                message: 'Login successful'
            };

        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: 'Authentication failed. Please try again.'
            };
        }
    }

    /**
     * Logout current user
     */
    async logout() {
        try {
            const wasLoggedIn = this.isLoggedIn();
            
            // Clear current user
            this.currentUser = null;
            
            // Clear session
            this.userRepository.clearSession();
            
            // Notify auth change
            if (wasLoggedIn) {
                this.notifyAuthChange(false, null);
            }

            return {
                success: true,
                message: 'Logout successful'
            };

        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: 'Logout failed'
            };
        }
    }

    /**
     * Get current logged in user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is currently logged in
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Check if current user is admin
     */
    isAdmin() {
        return this.currentUser && this.currentUser.isAdmin === "1";
    }

    /**
     * Get current user's subscription info
     */
    getSubscriptionInfo() {
        if (!this.currentUser) return null;
        return this.userRepository.getSubscriptionInfo(this.currentUser);
    }

    /**
     * Check if current user's subscription is active
     */
    hasActiveSubscription() {
        const subscriptionInfo = this.getSubscriptionInfo();
        return subscriptionInfo ? subscriptionInfo.isActive : false;
    }

    /**
     * Update current user's profile
     */
    async updateProfile(updates) {
        try {
            if (!this.currentUser) {
                return {
                    success: false,
                    error: 'No user logged in'
                };
            }

            // Validate updates
            const validatedUpdates = this.validateProfileUpdates(updates);
            if (!validatedUpdates.valid) {
                return {
                    success: false,
                    error: validatedUpdates.error
                };
            }

            // Update profile
            const result = await this.userRepository.updateUserProfile(
                this.currentUser.username, 
                validatedUpdates.data
            );

            if (result.success) {
                this.currentUser = result.user;
                this.notifyAuthChange(true, this.currentUser);
            }

            return result;

        } catch (error) {
            console.error('Profile update error:', error);
            return {
                success: false,
                error: 'Profile update failed'
            };
        }
    }

    /**
     * Validate profile update data
     */
    validateProfileUpdates(updates) {
        try {
            const errors = [];
            const validatedData = {};

            // Validate name
            if (updates.namesurname !== undefined) {
                if (typeof updates.namesurname !== 'string' || updates.namesurname.trim().length < 2) {
                    errors.push('Name must be at least 2 characters long');
                } else {
                    validatedData.namesurname = updates.namesurname.trim();
                }
            }

            // Validate email
            if (updates.email !== undefined) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(updates.email)) {
                    errors.push('Invalid email format');
                } else {
                    validatedData.email = updates.email.toLowerCase().trim();
                }
            }

            if (errors.length > 0) {
                return {
                    valid: false,
                    error: errors.join(', ')
                };
            }

            return {
                valid: true,
                data: validatedData
            };

        } catch (error) {
            return {
                valid: false,
                error: 'Validation failed'
            };
        }
    }

    /**
     * Get user display name
     */
    getUserDisplayName() {
        if (!this.currentUser) return '';
        return this.currentUser.namesurname || this.currentUser.username || 'User';
    }

    /**
     * Get user initials for avatar
     */
    getUserInitials() {
        if (!this.currentUser) return 'U';
        
        const name = this.currentUser.namesurname || this.currentUser.username || 'User';
        const parts = name.split(' ');
        
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        
        return name.substring(0, 2).toUpperCase();
    }

    /**
     * Get user role display text
     */
    getUserRole() {
        if (!this.currentUser) return 'Guest';
        return this.currentUser.isAdmin === "1" ? 'Administrator' : 'User';
    }

    /**
     * Add authentication state change callback
     */
    onAuthChange(callback) {
        if (typeof callback === 'function') {
            this.authCallbacks.push(callback);
        }
    }

    /**
     * Remove authentication state change callback
     */
    removeAuthCallback(callback) {
        const index = this.authCallbacks.indexOf(callback);
        if (index > -1) {
            this.authCallbacks.splice(index, 1);
        }
    }

    /**
     * Notify all callbacks of auth state change
     */
    notifyAuthChange(isLoggedIn, user) {
        this.authCallbacks.forEach(callback => {
            try {
                callback(isLoggedIn, user);
            } catch (error) {
                console.error('Error in auth callback:', error);
            }
        });
    }

    /**
     * Refresh user session
     */
    async refreshSession() {
        try {
            const session = this.userRepository.loadSession();
            if (session && session.user) {
                this.currentUser = session.user;
                return true;
            } else {
                this.currentUser = null;
                return false;
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
            this.currentUser = null;
            return false;
        }
    }

    /**
     * Check session validity
     */
    isSessionValid() {
        const session = this.userRepository.loadSession();
        return session !== null;
    }

    /**
     * Get session info
     */
    getSessionInfo() {
        const session = this.userRepository.loadSession();
        if (!session) return null;

        return {
            user: session.user,
            loginTime: new Date(session.timestamp),
            expiresAt: new Date(session.expiresAt),
            rememberMe: session.rememberMe,
            isExpired: Date.now() > session.expiresAt
        };
    }

    /**
     * Get all users (admin only)
     */
    async getAllUsers() {
        try {
            if (!this.isAdmin()) {
                return {
                    success: false,
                    error: 'Admin access required'
                };
            }

            const users = await this.userRepository.getAllUsers();
            return {
                success: true,
                users
            };

        } catch (error) {
            console.error('Error getting all users:', error);
            return {
                success: false,
                error: 'Failed to load users'
            };
        }
    }

    /**
     * Get user statistics
     */
    getUserStats() {
        // This would typically come from workout tracking data
        // For now, return mock data
        return {
            totalWorkouts: 0,
            totalTime: '0h',
            caloriesBurned: 0,
            favoriteMuscleGroup: '-',
            weeklyGoal: 3,
            weeklyProgress: 0
        };
    }
}