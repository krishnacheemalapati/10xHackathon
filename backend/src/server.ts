// Main server entry point
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { Environment } from './utils/environment';

// Services
import { CohereAIService } from './services/CohereAIService';
import { GoogleVisionService } from './services/GoogleVisionService';
import { TwilioNotificationService } from './services/TwilioNotificationService';

// Routes
import { createChatRoutes } from './routes/chat';
import { createCallRoutes } from './routes/calls';
import { createEmergencyRoutes } from './routes/emergency';
import safewalkRoutes from './routes/safewalk';
import usersRoutes from './routes/users';

// Socket handlers
import { setupSocketHandlers } from './socket/handlers';

class Server {
  private readonly app: express.Application;
  private readonly server: http.Server;
  private readonly io: SocketIOServer;
    // Services
  private readonly aiService: CohereAIService;
  private readonly visionService: GoogleVisionService;
  private readonly notificationService: TwilioNotificationService;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: [
          Environment.FRONTEND_WEB_URL,
          Environment.FRONTEND_MOBILE_URL,
          "http://localhost:3001",
          "http://localhost:19006"
        ],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Initialize services first
    this.aiService = new CohereAIService();
    this.visionService = new GoogleVisionService();
    this.notificationService = new TwilioNotificationService();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupErrorHandling();  }

  private setupMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: [
        Environment.FRONTEND_WEB_URL,
        Environment.FRONTEND_MOBILE_URL,
        "http://localhost:3001",
        "http://localhost:19006"
      ],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' })); // Large limit for base64 images
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: Environment.NODE_ENV,
        services: {
          ai: 'cohere',
          vision: 'google-cloud',
          notifications: 'twilio'
        }
      });
    });
  }

  private setupRoutes(): void {
    console.log('🛣️  Setting up routes...');

    // Make io available to routes
    this.app.locals.io = this.io;    // API routes
    this.app.use('/api/chat', createChatRoutes(this.aiService, this.visionService));
    this.app.use('/api/calls', createCallRoutes(this.aiService, this.notificationService));
    this.app.use('/api/emergency', createEmergencyRoutes(this.notificationService));
    this.app.use('/api/safewalk', safewalkRoutes);
    this.app.use('/api/users', usersRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: '🤖 AI Video Call Platform API',
        version: '1.0.0',        endpoints: {
          health: '/health',
          chat: '/api/chat',
          calls: '/api/calls',
          emergency: '/api/emergency',
          safewalk: '/api/safewalk',
          users: '/api/users'
        },
        websocket: 'Available on /socket.io',
        documentation: 'See README.md for API documentation'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Routes configured successfully');
  }

  private setupSocketHandlers(): void {
    console.log('🔌 Setting up WebSocket handlers...');
    
    setupSocketHandlers(this.io, {
      aiService: this.aiService,
      visionService: this.visionService,
      notificationService: this.notificationService
    });
    
    console.log('✅ WebSocket handlers configured');
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('❌ Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: Environment.isDevelopment() ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });

    // Process error handlers
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public start(): void {
    const port = Environment.PORT;
    
    this.server.listen(port, () => {
      console.log('\n🚀 AI Video Call Platform Backend Started!');
      console.log(`📡 Server running on port ${port}`);
      console.log(`🌐 Environment: ${Environment.NODE_ENV}`);
      console.log(`🔗 API Base URL: http://localhost:${port}`);
      console.log(`🔌 WebSocket URL: http://localhost:${port}/socket.io`);
      
      if (Environment.isDevelopment()) {
        console.log('\n📚 Available endpoints:');
        console.log(`   GET  /health - Health check`);
        console.log(`   POST /api/chat/message - Send chat message`);
        console.log(`   POST /api/calls/schedule - Schedule a call`);
        console.log(`   POST /api/emergency/escalate - Emergency escalation`);
        console.log(`   WebSocket events: join-call, chat-message, video-frame`);
      }
      
      console.log('\n✅ Server is ready to accept connections\n');
    });
  }
}

// Start the server
const server = new Server();
server.start();
