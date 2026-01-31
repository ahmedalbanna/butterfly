import { WebSocket } from 'ws';

export type ConnectionType = 'customer' | 'admin';

interface Connection {
  ws: WebSocket;
  type: ConnectionType;
  messageId: string;
  userId?: string;
  connectedAt: Date;
}

class WebSocketManager {
  private connections: Map<string, Connection> = new Map();
  private messageRooms: Map<string, Set<string>> = new Map();

  /**
   * Register a new WebSocket connection
   */
  addConnection(
    connectionId: string,
    ws: WebSocket,
    type: ConnectionType,
    messageId: string,
    userId?: string
  ): void {
    const connection: Connection = {
      ws,
      type,
      messageId,
      userId,
      connectedAt: new Date(),
    };

    this.connections.set(connectionId, connection);

    // Add to message room
    if (!this.messageRooms.has(messageId)) {
      this.messageRooms.set(messageId, new Set());
    }
    this.messageRooms.get(messageId)!.add(connectionId);

    console.log(`[WS] ${type} connected to message ${messageId.slice(0, 8)}`);
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): Connection | undefined {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);

      // Remove from message room
      const room = this.messageRooms.get(connection.messageId);
      if (room) {
        room.delete(connectionId);
        if (room.size === 0) {
          this.messageRooms.delete(connection.messageId);
        }
      }

      console.log(`[WS] ${connection.type} disconnected from message ${connection.messageId.slice(0, 8)}`);
    }
    return connection;
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): Connection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections for a message
   */
  getMessageConnections(messageId: string): Connection[] {
    const room = this.messageRooms.get(messageId);
    if (!room) return [];

    return Array.from(room)
      .map(id => this.connections.get(id))
      .filter((conn): conn is Connection => conn !== undefined);
  }

  /**
   * Check if admin is connected to a message
   */
  isAdminConnected(messageId: string): boolean {
    const connections = this.getMessageConnections(messageId);
    return connections.some(conn => conn.type === 'admin');
  }

  /**
   * Check if customer is connected to a message
   */
  isCustomerConnected(messageId: string): boolean {
    const connections = this.getMessageConnections(messageId);
    return connections.some(conn => conn.type === 'customer');
  }

  /**
   * Send message to all connections in a message room
   */
  broadcastToMessage(messageId: string, data: any, excludeId?: string): void {
    const connections = this.getMessageConnections(messageId);
    const message = JSON.stringify(data);

    connections.forEach(conn => {
      if (excludeId && this.getConnectionIdByWs(conn.ws) === excludeId) {
        return;
      }

      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    });
  }

  /**
   * Send message to a specific connection type in a room
   */
  sendToType(messageId: string, type: ConnectionType, data: any): void {
    const connections = this.getMessageConnections(messageId).filter(
      conn => conn.type === type
    );
    const message = JSON.stringify(data);

    connections.forEach(conn => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    });
  }

  /**
   * Get connection ID by WebSocket instance (helper)
   */
  private getConnectionIdByWs(ws: WebSocket): string | undefined {
    for (const [id, conn] of this.connections.entries()) {
      if (conn.ws === ws) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Get all active message IDs
   */
  getActiveMessageIds(): string[] {
    return Array.from(this.messageRooms.keys());
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      activeRooms: this.messageRooms.size,
      customerConnections: Array.from(this.connections.values()).filter(
        c => c.type === 'customer'
      ).length,
      adminConnections: Array.from(this.connections.values()).filter(
        c => c.type === 'admin'
      ).length,
    };
  }

  /**
   * Clean up stale connections
   */
  cleanup(maxIdleMinutes: number = 30): void {
    const now = new Date();
    const staleConnections: string[] = [];

    for (const [id, conn] of this.connections.entries()) {
      const idleMinutes =
        (now.getTime() - conn.connectedAt.getTime()) / 1000 / 60;
      if (idleMinutes > maxIdleMinutes) {
        staleConnections.push(id);
      }
    }

    staleConnections.forEach(id => {
      const conn = this.connections.get(id);
      if (conn && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.close(1000, 'Idle timeout');
      }
      this.removeConnection(id);
    });

    if (staleConnections.length > 0) {
      console.log(`[WS] Cleaned up ${staleConnections.length} stale connections`);
    }
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    wsManager.cleanup(30);
  }, 5 * 60 * 1000);
}
