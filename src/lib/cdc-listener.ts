import { Pool } from 'pg';
import { getRedisClient, publishAdminNotification } from './redis';
import {
  cacheProduct,
  invalidateProduct,
  cacheCategory,
  invalidateCategory,
  cacheOrder,
  invalidateOrder,
  cacheMessage,
  invalidateMessage,
  invalidateMessageReplies,
  cacheCallSession,
  invalidateCallSession,
  cacheActiveChatSession,
  invalidateActiveChatSession,
  cacheCustomOrder,
  invalidateCustomOrder,
  invalidateStatistics,
} from './redis-cache';
import {
  alertCDCListenerFailed,
  alertCDCReconnecting,
  alertSystemHealthy,
} from './cdc-alerts';
import {
  recordCDCEvent,
  setCDCListenerStatus,
} from './metrics';

/**
 * CDC Listener Service
 * Listens to PostgreSQL NOTIFY events and synchronizes data to Redis
 * Maintains real-time consistency between PostgreSQL and Redis
 */

export interface CDCEvent {
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  timestamp: number;
  old?: any;
  new?: any;
}

class CDCListener {
  private pool: Pool | null = null;
  private client: any = null;
  private isListening = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  /**
   * Initialize CDC listener
   */
  async start(): Promise<void> {
    if (this.isListening) {
      console.log('[CDC] Listener already running');
      return;
    }

    try {
      // Create dedicated PostgreSQL connection for LISTEN
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 1, // Single connection for listening
      });

      this.client = await this.pool.connect();
      console.log('[CDC] Connected to PostgreSQL for CDC listening');

      // Subscribe to all CDC channels
      await this.subscribeToChannels();

      // Handle notifications
      this.client.on('notification', this.handleNotification.bind(this));

      // Handle connection errors
      this.client.on('error', (err: Error) => {
        console.error('[CDC] Client error:', err);
        this.handleDisconnect();
      });

      this.isListening = true;
      this.reconnectAttempts = 0;
      console.log('[CDC] Listener started successfully');
      
      // Update metrics
      setCDCListenerStatus(true);
      
      // Send healthy alert
      await alertSystemHealthy();
    } catch (error) {
      console.error('[CDC] Failed to start listener:', error);
      await alertCDCListenerFailed(error);
      this.handleDisconnect();
    }
  }

  /**
   * Subscribe to PostgreSQL NOTIFY channels
   */
  private async subscribeToChannels(): Promise<void> {
    const channels = [
      'cdc:all',           // All changes
      'cdc:Product',
      'cdc:Category',
      'cdc:Order',
      'cdc:OrderItem',
      'cdc:CustomerMessage',
      'cdc:MessageReply',
      'cdc:VoiceCallSession',
      'cdc:ActiveChatSession',
      'cdc:CustomOrder',
      'cdc:SocialMediaPost',
    ];

    for (const channel of channels) {
      await this.client.query(`LISTEN "${channel}"`);
      console.log(`[CDC] Subscribed to channel: ${channel}`);
    }
  }

  /**
   * Handle incoming CDC notification
   */
  private async handleNotification(msg: any): Promise<void> {
    try {
      const event: CDCEvent = JSON.parse(msg.payload);
      
      console.log(`[CDC] Event: ${event.operation} on ${event.table} (id: ${event.new?.id || event.old?.id})`);

      // Record CDC event metric
      recordCDCEvent(event.operation, event.table);

      // Process based on table
      await this.processCDCEvent(event);

      // Broadcast to real-time subscribers via Redis Pub/Sub
      await this.broadcastRealtimeUpdate(event);
    } catch (error) {
      console.error('[CDC] Error handling notification:', error);
    }
  }

  /**
   * Process CDC event and update Redis cache
   */
  private async processCDCEvent(event: CDCEvent): Promise<void> {
    const { operation, table, old, new: newData } = event;

    switch (table) {
      case 'Product':
        await this.handleProductChange(operation, old, newData);
        break;

      case 'Category':
        await this.handleCategoryChange(operation, old, newData);
        break;

      case 'Order':
        await this.handleOrderChange(operation, old, newData);
        break;

      case 'OrderItem':
        await this.handleOrderItemChange(operation, old, newData);
        break;

      case 'CustomerMessage':
        await this.handleCustomerMessageChange(operation, old, newData);
        break;

      case 'MessageReply':
        await this.handleMessageReplyChange(operation, old, newData);
        break;

      case 'VoiceCallSession':
        await this.handleVoiceCallChange(operation, old, newData);
        break;

      case 'ActiveChatSession':
        await this.handleActiveChatChange(operation, old, newData);
        break;

      case 'CustomOrder':
        await this.handleCustomOrderChange(operation, old, newData);
        break;

      case 'SocialMediaPost':
        await this.handleSocialMediaPostChange(operation, old, newData);
        break;

      default:
        console.log(`[CDC] Unhandled table: ${table}`);
    }
  }

  /**
   * Table-specific handlers
   */

  private async handleProductChange(operation: string, old: any, newData: any): Promise<void> {
    if (operation === 'DELETE') {
      await invalidateProduct(old.id);
    } else if (operation === 'INSERT' || operation === 'UPDATE') {
      await cacheProduct(newData);
    }
    
    // Invalidate statistics
    await invalidateStatistics('products');
  }

  private async handleCategoryChange(operation: string, old: any, newData: any): Promise<void> {
    if (operation === 'DELETE') {
      await invalidateCategory(old.id);
    } else if (operation === 'INSERT' || operation === 'UPDATE') {
      await cacheCategory(newData);
    }
  }

  private async handleOrderChange(operation: string, old: any, newData: any): Promise<void> {
    if (operation === 'DELETE') {
      await invalidateOrder(old.id);
    } else if (operation === 'INSERT' || operation === 'UPDATE') {
      await cacheOrder(newData);
      
      // Send admin notification for new orders
      if (operation === 'INSERT') {
        await publishAdminNotification('new-order', {
          orderId: newData.id,
          customerName: newData.customerName,
          total: newData.total,
        });
      }
    }
    
    await invalidateStatistics('orders');
  }

  private async handleOrderItemChange(operation: string, old: any, newData: any): Promise<void> {
    // OrderItem changes affect the parent order
    const orderId = operation === 'DELETE' ? old.orderId : newData.orderId;
    if (orderId) {
      await invalidateOrder(orderId);
    }
  }

  private async handleCustomerMessageChange(operation: string, old: any, newData: any): Promise<void> {
    if (operation === 'DELETE') {
      await invalidateMessage(old.id);
    } else if (operation === 'INSERT' || operation === 'UPDATE') {
      await cacheMessage(newData);
      
      // Send admin notification for new messages
      if (operation === 'INSERT') {
        await publishAdminNotification('new-message', {
          messageId: newData.id,
          customerName: newData.customerName,
          subject: newData.subject,
        });
      }
    }
    
    await invalidateStatistics('messages');
  }

  private async handleMessageReplyChange(operation: string, old: any, newData: any): Promise<void> {
    const messageId = operation === 'DELETE' ? old.messageId : newData.messageId;
    if (messageId) {
      await invalidateMessageReplies(messageId);
      await invalidateMessage(messageId);
    }
  }

  private async handleVoiceCallChange(operation: string, old: any, newData: any): Promise<void> {
    if (operation === 'DELETE') {
      await invalidateCallSession(old.id);
    } else if (operation === 'INSERT' || operation === 'UPDATE') {
      await cacheCallSession(newData);
      
      // Handle call status changes
      if (operation === 'UPDATE' && old.status !== newData.status) {
        // Call status changed - notify admins
        if (newData.status === 'ringing') {
          await publishAdminNotification('new-call', {
            callId: newData.id,
            customerName: newData.customerName,
          });
        } else if (newData.status === 'ended' || newData.status === 'missed') {
          await publishAdminNotification('call-ended', {
            callId: newData.id,
            status: newData.status,
            duration: newData.duration,
          });
        }
      }
    }
    
    await invalidateStatistics('calls');
  }

  private async handleActiveChatChange(operation: string, old: any, newData: any): Promise<void> {
    if (operation === 'DELETE') {
      await invalidateActiveChatSession(old.messageId);
    } else if (operation === 'INSERT' || operation === 'UPDATE') {
      await cacheActiveChatSession(newData.messageId, newData);
    }
  }

  private async handleCustomOrderChange(operation: string, old: any, newData: any): Promise<void> {
    if (operation === 'DELETE') {
      await invalidateCustomOrder(old.id);
    } else if (operation === 'INSERT' || operation === 'UPDATE') {
      await cacheCustomOrder(newData);
      
      // Notify admins of new custom order requests
      if (operation === 'INSERT') {
        await publishAdminNotification('new-custom-order', {
          orderId: newData.id,
          customerName: newData.customerName,
        });
      }
    }
  }

  private async handleSocialMediaPostChange(operation: string, old: any, newData: any): Promise<void> {
    // Social media posts don't need caching, but we can track status changes
    if (operation === 'UPDATE' && old.status !== newData.status && newData.status === 'failed') {
      await publishAdminNotification('social-post-failed', {
        postId: newData.id,
        productId: newData.productId,
        platform: newData.platform,
        error: newData.errorMessage,
      });
    }
  }

  /**
   * Broadcast real-time update to connected clients via Redis Pub/Sub
   */
  private async broadcastRealtimeUpdate(event: CDCEvent): Promise<void> {
    try {
      const redis = getRedisClient();
      
      const message = JSON.stringify({
        type: 'cdc',
        table: event.table,
        operation: event.operation,
        timestamp: event.timestamp,
        data: event.new || event.old,
      });

      // Publish to general realtime channel
      await redis.publish('realtime:updates', message);

      // Also publish to table-specific channel
      await redis.publish(`realtime:${event.table.toLowerCase()}`, message);
    } catch (error) {
      console.error('[CDC] Error broadcasting realtime update:', error);
    }
  }

  /**
   * Handle disconnect and attempt reconnection
   */
  private handleDisconnect(): void {
    this.isListening = false;
    setCDCListenerStatus(false);

    if (this.client) {
      try {
        this.client.release();
      } catch (err) {
        // Ignore errors during cleanup
      }
      this.client = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;
      
      console.log(`[CDC] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // Send reconnection alert
      alertCDCReconnecting(this.reconnectAttempts, this.maxReconnectAttempts);
      
      this.reconnectTimeout = setTimeout(() => {
        this.start();
      }, delay);
    } else {
      console.error('[CDC] Max reconnection attempts reached. CDC listener stopped.');
    }
  }

  /**
   * Stop CDC listener gracefully
   */
  async stop(): Promise<void> {
    console.log('[CDC] Stopping listener...');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      try {
        // Unsubscribe from all channels
        await this.client.query('UNLISTEN *');
        this.client.release();
      } catch (err) {
        console.error('[CDC] Error during cleanup:', err);
      }
      this.client = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }

    this.isListening = false;
    console.log('[CDC] Listener stopped');
  }

  /**
   * Check if listener is running
   */
  isActive(): boolean {
    return this.isListening;
  }
}

// Singleton instance
let cdcListener: CDCListener | null = null;

export function getCDCListener(): CDCListener {
  if (!cdcListener) {
    cdcListener = new CDCListener();
  }
  return cdcListener;
}

export default getCDCListener;
