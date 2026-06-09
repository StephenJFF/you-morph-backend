export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  age?: number
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Program {
  id: string
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  category: string
  instructor: string
  createdAt: Date
}

export interface Workout {
  id: string
  programId: string
  userId: string
  name: string
  exercises: Exercise[]
  duration: number
  difficulty: string
  completedAt?: Date
}

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight?: number
  duration?: number
  description: string
}

export interface NutritionPlan {
  id: string
  userId: string
  goal: string
  calories: number
  macros: {
    protein: number
    carbs: number
    fat: number
  }
  meals: Meal[]
}

export interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
}
