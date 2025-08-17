import { describe, test, expect } from 'vitest'

// Simple utility functions to test
const add = (a, b) => a + b
const multiply = (a, b) => a * b
const isEven = (num) => num % 2 === 0

describe('Example Utility Functions', () => {
  describe('add function', () => {
    test('adds two positive numbers', () => {
      expect(add(2, 3)).toBe(5)
    })

    test('adds negative numbers', () => {
      expect(add(-1, -2)).toBe(-3)
    })

    test('adds zero', () => {
      expect(add(5, 0)).toBe(5)
    })
  })

  describe('multiply function', () => {
    test('multiplies two positive numbers', () => {
      expect(multiply(3, 4)).toBe(12)
    })

    test('multiplies by zero', () => {
      expect(multiply(5, 0)).toBe(0)
    })

    test('multiplies negative numbers', () => {
      expect(multiply(-2, 3)).toBe(-6)
    })
  })

  describe('isEven function', () => {
    test('returns true for even numbers', () => {
      expect(isEven(2)).toBe(true)
      expect(isEven(4)).toBe(true)
      expect(isEven(0)).toBe(true)
    })

    test('returns false for odd numbers', () => {
      expect(isEven(1)).toBe(false)
      expect(isEven(3)).toBe(false)
      expect(isEven(5)).toBe(false)
    })
  })
})
