import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', (req: Request, res: Response) => {
  res.json({ message: 'Auth routes coming soon' })
})

app.use('/api/users', (req: Request, res: Response) => {
  res.json({ message: 'User routes coming soon' })
})

app.use('/api/programs', (req: Request, res: Response) => {
  res.json({ message: 'Program routes coming soon' })
})

app.use('/api/workouts', (req: Request, res: Response) => {
  res.json({ message: 'Workout routes coming soon' })
})

app.use('/api/nutrition', (req: Request, res: Response) => {
  res.json({ message: 'Nutrition routes coming soon' })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
