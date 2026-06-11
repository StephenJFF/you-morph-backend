import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// In-memory database (replace with actual DB in production)
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  subscriptionStatus: 'free' | 'premium';
  createdAt: string;
}

interface CheckIn {
  id: string;
  userId: string;
  weight: number;
  date: string;
  notes?: string;
}

interface Measurement {
  id: string;
  userId: string;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  date: string;
}

const users: Map<string, User> = new Map();
const checkIns: CheckIn[] = [];
const measurements: Measurement[] = [];

// Middleware
app.use(express.json());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// Auth middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const userId = uuidv4();

    const user: User = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      subscriptionStatus: 'free',
      createdAt: new Date().toISOString(),
    };

    users.set(email, user);

    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: userId,
        email,
        name,
        subscriptionStatus: 'free',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// User Routes
app.get('/api/user', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    let user: User | undefined;

    for (const u of users.values()) {
      if (u.id === userId) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/user', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name } = req.body;

    let user: User | undefined;
    let userEmail: string | undefined;

    for (const [email, u] of users.entries()) {
      if (u.id === userId) {
        user = u;
        userEmail = email;
        break;
      }
    }

    if (!user || !userEmail) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) {
      user.name = name;
    }

    users.set(userEmail, user);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Check-in Routes
app.post('/api/checkins', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { weight, notes } = req.body;

    if (!weight) {
      return res.status(400).json({ error: 'Weight is required' });
    }

    const checkIn: CheckIn = {
      id: uuidv4(),
      userId,
      weight,
      date: new Date().toISOString(),
      notes,
    };

    checkIns.push(checkIn);

    res.status(201).json(checkIn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

app.get('/api/checkins', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const userCheckIns = checkIns.filter((c) => c.userId === userId);

    res.json(userCheckIns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

// Measurement Routes
app.post('/api/measurements', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { chest, waist, hips, biceps } = req.body;

    const measurement: Measurement = {
      id: uuidv4(),
      userId,
      chest,
      waist,
      hips,
      biceps,
      date: new Date().toISOString(),
    };

    measurements.push(measurement);

    res.status(201).json(measurement);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create measurement' });
  }
});

app.get('/api/measurements', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const userMeasurements = measurements.filter((m) => m.userId === userId);

    res.json(userMeasurements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

// Subscription Routes
app.post('/api/subscription/upgrade', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    let user: User | undefined;
    let userEmail: string | undefined;

    for (const [email, u] of users.entries()) {
      if (u.id === userId) {
        user = u;
        userEmail = email;
        break;
      }
    }

    if (!user || !userEmail) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.subscriptionStatus = 'premium';
    users.set(userEmail, user);

    res.json({
      subscriptionStatus: 'premium',
      message: 'Subscription upgraded successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

app.get('/api/subscription/status', authenticate, (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    let user: User | undefined;

    for (const u of users.values()) {
      if (u.id === userId) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ YouMorph Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📡 CORS enabled for: ${CORS_ORIGIN}`);
});
