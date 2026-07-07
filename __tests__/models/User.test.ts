import mongoose from 'mongoose'
import { User, hashPassword, verifyPassword } from '@/models/User'

describe('User Model', () => {
  describe('Password Utils', () => {
    it('should generate hash and salt', () => {
      const result = hashPassword('mysecret')
      expect(result).toHaveProperty('hash')
      expect(result).toHaveProperty('salt')
      expect(result.hash.length).toBeGreaterThan(0)
      expect(result.salt.length).toBeGreaterThan(0)
    })

    it('should verify correct password', () => {
      const { hash, salt } = hashPassword('mysecret')
      expect(verifyPassword('mysecret', hash, salt)).toBe(true)
    })

    it('should reject incorrect password', () => {
      const { hash, salt } = hashPassword('mysecret')
      expect(verifyPassword('wrongpassword', hash, salt)).toBe(false)
    })

    it('should reject with wrong salt', () => {
      const { hash } = hashPassword('mysecret')
      expect(verifyPassword('mysecret', hash, 'wrong_salt')).toBe(false)
    })
  })

  describe('Schema Validation', () => {
    it('should be valid with all required fields', () => {
      const user = new User({
        userId: 'U001',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'somesalt',
        fullName: 'Test User',
      })
      
      const error = user.validateSync()
      expect(error).toBeUndefined()
    })

    it('should set default values correctly', () => {
      const user = new User({
        userId: 'U001',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        salt: 'somesalt',
        fullName: 'Test User',
      })

      expect(user.role).toBe('user')
      expect(user.isActive).toBe(true)
      expect(user.phone).toBe('')
    })

    it('should be invalid if required fields are missing', () => {
      const user = new User({
        username: 'testuser'
      })

      const error = user.validateSync()
      expect(error).toBeDefined()
      expect(error?.errors['email']).toBeDefined()
      expect(error?.errors['userId']).toBeDefined()
      expect(error?.errors['password']).toBeDefined()
    })
  })
})
