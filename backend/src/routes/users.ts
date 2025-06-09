import { Request, Response, Router } from 'express';
import { DatabaseService } from '../services/database/DatabaseService';

const router = Router();
const databaseService = DatabaseService.getInstance();

// GET /api/users - Get all users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await databaseService.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await databaseService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    // Basic validation
    if (!userData.name || !userData.email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email']
      });
    }
    
    const newUser = await databaseService.createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedUser = await databaseService.updateUser(id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await databaseService.deleteUser(id);
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/:id/sessions - Get user's walking sessions
router.get('/:id/sessions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sessions = await databaseService.getWalkingSessionsByUserId(id);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/:id/emergency-incidents - Get user's emergency incidents
router.get('/:id/emergency-incidents', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const incidents = await databaseService.getEmergencyIncidentsByUserId(id);
    res.json(incidents);
  } catch (error) {
    console.error('Error fetching user emergency incidents:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user emergency incidents',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
