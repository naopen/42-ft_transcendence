import db from "../config/database"
import { ConflictError, NotFoundError } from "../middleware/error-handler"

interface User {
  id: number
  google_id: string
  email: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface CreateUserData {
  googleId: string
  email: string
  displayName: string
  avatarUrl?: string
}

export class UserService {
  /**
   * Create a new user
   */
  createUser(data: CreateUserData): User {
    // Check if user already exists
    const existingUser = this.findByGoogleId(data.googleId)
    if (existingUser) {
      throw new ConflictError("User already exists")
    }

    const result = db
      .prepare(
        `
      INSERT INTO users (google_id, email, display_name, avatar_url)
      VALUES (?, ?, ?, ?)
    `,
      )
      .run(data.googleId, data.email, data.displayName, data.avatarUrl || null)

    const userId = result.lastInsertRowid as number
    return this.getUserById(userId)
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): User {
    const user = db
      .prepare(
        `
      SELECT * FROM users WHERE id = ?
    `,
      )
      .get(id) as User | undefined

    if (!user) {
      throw new NotFoundError("User not found")
    }

    return user
  }

  /**
   * Find user by Google ID
   */
  findByGoogleId(googleId: string): User | null {
    const user = db
      .prepare(
        `
      SELECT * FROM users WHERE google_id = ?
    `,
      )
      .get(googleId) as User | undefined

    return user || null
  }

  /**
   * Find user by email
   */
  findByEmail(email: string): User | null {
    const user = db
      .prepare(
        `
      SELECT * FROM users WHERE email = ?
    `,
      )
      .get(email) as User | undefined

    return user || null
  }

  /**
   * Find or create user (for OAuth)
   */
  findOrCreate(data: CreateUserData): User {
    const existingUser = this.findByGoogleId(data.googleId)

    if (existingUser) {
      // Update user info if changed
      db.prepare(
        `
        UPDATE users
        SET email = ?,
            display_name = ?,
            avatar_url = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(
        data.email,
        data.displayName,
        data.avatarUrl || null,
        existingUser.id,
      )

      return this.getUserById(existingUser.id)
    }

    return this.createUser(data)
  }

  /**
   * Update user profile
   */
  updateUser(userId: number, updates: Partial<User>): User {
    const user = this.getUserById(userId)

    const allowedUpdates = ["display_name", "avatar_url"]
    const updateFields: string[] = []
    const updateValues: any[] = []

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedUpdates.includes(key)) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    })

    if (updateFields.length === 0) {
      return user
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    updateValues.push(userId)

    db.prepare(
      `
      UPDATE users
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `,
    ).run(...updateValues)

    return this.getUserById(userId)
  }

  /**
   * Get user public profile
   */
  getPublicProfile(userId: number) {
    const user = this.getUserById(userId)

    // Remove sensitive information
    const { google_id: _google_id, email: _email, ...publicProfile } = user

    return publicProfile
  }

  /**
   * Get all users (for admin/testing)
   */
  getAllUsers(limit = 50, offset = 0): User[] {
    return db
      .prepare(
        `
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      )
      .all(limit, offset) as User[]
  }

  /**
   * Search users by display name
   */
  searchUsers(query: string, limit = 10): User[] {
    return db
      .prepare(
        `
      SELECT id, display_name, avatar_url, created_at
      FROM users
      WHERE display_name LIKE ?
      ORDER BY display_name
      LIMIT ?
    `,
      )
      .all(`%${query}%`, limit) as User[]
  }
}

export const userService = new UserService()
