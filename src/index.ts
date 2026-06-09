import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import orgRoutes from './routes/orgRoutes';
import checkinRoutes from './routes/checkinRoutes';
import coachRoutes from './routes/coachRoutes';
import brandingRoutes from './routes/brandingRoutes';
import authRoutes from './routes/authRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import premiumRoutes from './routes/premiumRoutes';
import { authenticateToken } from './utils/authMiddleware';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Public routes
app.use('/auth', authRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/premium', premiumRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes
app.use('/users', authenticateToken, userRoutes);
app.use('/organizations', authenticateToken, orgRoutes);
app.use('/checkins', authenticateToken, checkinRoutes);
app.use('/coaches', authenticateToken, coachRoutes);
app.use('/branding', authenticateToken, brandingRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
