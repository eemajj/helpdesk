// JWT Token Blacklist Service
// In production, this should use Redis for distributed systems
// For development, we use in-memory storage

interface BlacklistedToken {
  token: string
  expiresAt: number
  userId: number
  reason: 'logout' | 'password_change' | 'security'
}

class TokenBlacklistService {
  private blacklist: Map<string, BlacklistedToken> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired tokens every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  // Add token to blacklist
  blacklistToken(token: string, userId: number, reason: BlacklistedToken['reason'] = 'logout', expiresIn: number = 60 * 60 * 1000): void {
    const expiresAt = Date.now() + expiresIn
    
    this.blacklist.set(token, {
      token,
      expiresAt,
      userId,
      reason
    })

    console.log(`🚫 Token blacklisted for user ${userId}, reason: ${reason}`)
  }

  // Check if token is blacklisted
  isBlacklisted(token: string): boolean {
    const blacklistedToken = this.blacklist.get(token)
    
    if (!blacklistedToken) {
      return false
    }

    // If token has expired in blacklist, remove it
    if (Date.now() > blacklistedToken.expiresAt) {
      this.blacklist.delete(token)
      return false
    }

    return true
  }

  // Blacklist all tokens for a user (useful for password changes)
  blacklistAllUserTokens(userId: number, reason: BlacklistedToken['reason'] = 'security'): void {
    // In a real Redis implementation, we would store user token mappings
    // For now, we'll add a special marker for user-level blacklisting
    const userBlacklistKey = `user:${userId}:all`
    this.blacklist.set(userBlacklistKey, {
      token: userBlacklistKey,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days (max refresh token life)
      userId,
      reason
    })

    console.log(`🚫 All tokens blacklisted for user ${userId}, reason: ${reason}`)
  }

  // Check if all user tokens are blacklisted
  isUserBlacklisted(userId: number): boolean {
    const userBlacklistKey = `user:${userId}:all`
    const blacklistedUser = this.blacklist.get(userBlacklistKey)
    
    if (!blacklistedUser) {
      return false
    }

    // If blacklist has expired, remove it
    if (Date.now() > blacklistedUser.expiresAt) {
      this.blacklist.delete(userBlacklistKey)
      return false
    }

    return true
  }

  // Remove token from blacklist (rarely needed)
  removeToken(token: string): void {
    this.blacklist.delete(token)
  }

  // Clean up expired tokens
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [token, blacklistedToken] of this.blacklist.entries()) {
      if (now > blacklistedToken.expiresAt) {
        this.blacklist.delete(token)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired blacklisted tokens`)
    }
  }

  // Get blacklist stats
  getStats(): { total: number; byReason: Record<string, number> } {
    const stats = {
      total: this.blacklist.size,
      byReason: {} as Record<string, number>
    }

    for (const blacklistedToken of this.blacklist.values()) {
      stats.byReason[blacklistedToken.reason] = (stats.byReason[blacklistedToken.reason] || 0) + 1
    }

    return stats
  }

  // Shutdown cleanup
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.blacklist.clear()
  }
}

// Export singleton instance
export const tokenBlacklist = new TokenBlacklistService()