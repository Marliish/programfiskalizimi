import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@fiscalnext/database';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>
  private tenantRooms: Map<string, Set<string>> = new Map(); // tenantId -> Set<userId>
  
  // Initialize WebSocket server
  initialize(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });
    
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`WebSocket client connected: ${socket.id}`);
      
      // Authentication
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          // TODO: Verify JWT token and extract user info
          // For now, we'll accept a simple payload
          const { userId, tenantId } = data as any;
          
          if (!userId || !tenantId) {
            socket.emit('error', { message: 'Invalid authentication' });
            socket.disconnect();
            return;
          }
          
          socket.userId = userId;
          socket.tenantId = tenantId;
          
          // Join tenant room
          socket.join(`tenant:${tenantId}`);
          
          // Track user socket
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
          }
          this.userSockets.get(userId)!.add(socket.id);
          
          // Track tenant users
          if (!this.tenantRooms.has(tenantId)) {
            this.tenantRooms.set(tenantId, new Set());
          }
          this.tenantRooms.get(tenantId)!.add(userId);
          
          // Notify successful authentication
          socket.emit('authenticated', { 
            userId, 
            tenantId,
            onlineUsers: Array.from(this.tenantRooms.get(tenantId) || []).length,
          });
          
          // Broadcast to other users that someone is online
          this.broadcastToTenant(tenantId, 'user:online', { userId }, socket.id);
          
          console.log(`User ${userId} authenticated for tenant ${tenantId}`);
        } catch (error: any) {
          socket.emit('error', { message: error.message });
          socket.disconnect();
        }
      });
      
      // Subscribe to specific channels
      socket.on('subscribe', (data: { channel: string }) => {
        if (!socket.tenantId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }
        
        const room = `${socket.tenantId}:${data.channel}`;
        socket.join(room);
        socket.emit('subscribed', { channel: data.channel });
        console.log(`Socket ${socket.id} subscribed to ${room}`);
      });
      
      // Unsubscribe from channels
      socket.on('unsubscribe', (data: { channel: string }) => {
        if (!socket.tenantId) return;
        
        const room = `${socket.tenantId}:${data.channel}`;
        socket.leave(room);
        socket.emit('unsubscribed', { channel: data.channel });
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
        
        if (socket.userId) {
          const userSockets = this.userSockets.get(socket.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.userSockets.delete(socket.userId);
              
              // Remove from tenant room
              if (socket.tenantId) {
                const tenantUsers = this.tenantRooms.get(socket.tenantId);
                if (tenantUsers) {
                  tenantUsers.delete(socket.userId);
                  
                  // Broadcast offline status
                  this.broadcastToTenant(socket.tenantId, 'user:offline', { 
                    userId: socket.userId 
                  });
                }
              }
            }
          }
        }
      });
    });
    
    console.log('WebSocket server initialized');
  }
  
  // Broadcast to entire tenant
  broadcastToTenant(tenantId: string, event: string, data: any, excludeSocketId?: string) {
    if (!this.io) return;
    
    const room = `tenant:${tenantId}`;
    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit(event, data);
    } else {
      this.io.to(room).emit(event, data);
    }
  }
  
  // Broadcast to specific channel
  broadcastToChannel(tenantId: string, channel: string, event: string, data: any) {
    if (!this.io) return;
    
    const room = `${tenantId}:${channel}`;
    this.io.to(room).emit(event, data);
  }
  
  // Send to specific user
  sendToUser(userId: string, event: string, data: any) {
    if (!this.io) return;
    
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }
  
  // Get online users for a tenant
  getOnlineUsers(tenantId: string): string[] {
    const users = this.tenantRooms.get(tenantId);
    return users ? Array.from(users) : [];
  }
  
  // Get online user count
  getOnlineUserCount(tenantId: string): number {
    return this.getOnlineUsers(tenantId).length;
  }
  
  // Notify about new transaction
  notifyNewTransaction(tenantId: string, transaction: any) {
    this.broadcastToChannel(tenantId, 'sales', 'transaction:new', {
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      total: transaction.total,
      itemCount: transaction.items?.length || 0,
      location: transaction.location?.name,
      createdAt: transaction.createdAt,
    });
  }
  
  // Notify about inventory change
  notifyInventoryChange(tenantId: string, change: any) {
    this.broadcastToChannel(tenantId, 'inventory', 'inventory:changed', {
      productId: change.productId,
      productName: change.productName,
      locationId: change.locationId,
      location: change.location,
      oldQuantity: change.oldQuantity,
      newQuantity: change.newQuantity,
      type: change.type,
      timestamp: new Date(),
    });
  }
  
  // Notify about low stock
  notifyLowStock(tenantId: string, stock: any) {
    this.broadcastToChannel(tenantId, 'inventory', 'inventory:low_stock', {
      productId: stock.productId,
      productName: stock.productName,
      quantity: stock.quantity,
      threshold: stock.threshold,
      location: stock.location,
      timestamp: new Date(),
    });
  }
  
  // Notify about dashboard widget update
  notifyWidgetUpdate(tenantId: string, widgetId: string, data: any) {
    this.broadcastToChannel(tenantId, 'dashboard', 'widget:update', {
      widgetId,
      data,
      timestamp: new Date(),
    });
  }
  
  // Notify about automation execution
  notifyAutomationExecution(tenantId: string, automation: any, result: any) {
    this.broadcastToChannel(tenantId, 'automations', 'automation:executed', {
      automationId: automation.id,
      automationName: automation.name,
      status: result.status,
      timestamp: new Date(),
    });
  }
  
  // Send system notification
  sendNotification(tenantId: string, userId: string | null, notification: any) {
    if (userId) {
      this.sendToUser(userId, 'notification', notification);
    } else {
      this.broadcastToTenant(tenantId, 'notification', notification);
    }
  }
  
  // Heartbeat/ping for widget data
  async sendWidgetHeartbeat(tenantId: string, widgetId: string) {
    // This would be called periodically to update widget data
    try {
      // Fetch fresh widget data (simplified)
      const data = { widgetId, timestamp: new Date() };
      this.broadcastToChannel(tenantId, 'dashboard', 'widget:heartbeat', data);
    } catch (error) {
      console.error('Widget heartbeat error:', error);
    }
  }
}

export const websocketService = new WebSocketService();
