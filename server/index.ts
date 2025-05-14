import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocketServer } from 'ws';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Setup WebSocket server for live game updates
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    log('WebSocket client connected');
    
    ws.on('message', (message) => {
      log(`Received WebSocket message: ${message}`);
      
      try {
        const parsedMessage = JSON.parse(message.toString());
        
        // Handle different message types
        if (parsedMessage.type === 'subscribe') {
          // Subscribe to events
          ws.send(JSON.stringify({ type: 'subscribed', channel: parsedMessage.channel }));
        }
      } catch (err) {
        log(`Error processing WebSocket message: ${err}`);
      }
    });
    
    ws.on('close', () => {
      log('WebSocket client disconnected');
    });
  });

  // Broadcast game events to connected clients
  global.broadcastGameEvent = (event: string, data: any) => {
    const message = JSON.stringify({ type: 'game_event', event, data });
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  };

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup vite in development or serve static files in production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Piglet Gambling Bot server running on port ${port}`);
  });
})();

// Extend global variable for broadcasting game events
declare global {
  var broadcastGameEvent: (event: string, data: any) => void;
}
