import { storeEvent, replayEvents, getAggregateHistory, getAggregateSnapshot } from './event-store';

/**
 * Event Sourcing Patterns Implementation
 * Provides CQRS, Event Replay, Time Travel, and Aggregate Reconstruction
 */

/**
 * Command: Represents an intent to change state
 */
export interface Command {
  type: string;
  aggregateId: string;
  payload: any;
  metadata?: any;
}

/**
 * Event: Represents something that happened
 */
export interface DomainEvent {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: any;
  metadata?: any;
}

/**
 * Aggregate: Domain object reconstructed from events
 */
export abstract class Aggregate {
  protected id: string;
  protected version: number = 0;
  protected uncommittedEvents: DomainEvent[] = [];

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Apply event to aggregate
   */
  protected abstract applyEvent(event: DomainEvent): void;

  /**
   * Load aggregate from event history
   */
  async loadFromHistory(): Promise<void> {
    const state = await replayEvents(this.getAggregateType(), this.id);
    if (state) {
      Object.assign(this, state);
    }
  }

  /**
   * Get aggregate type
   */
  protected abstract getAggregateType(): string;

  /**
   * Add uncommitted event
   */
  protected addEvent(event: DomainEvent): void {
    this.applyEvent(event);
    this.uncommittedEvents.push(event);
    this.version++;
  }

  /**
   * Commit events to store
   */
  async commit(): Promise<void> {
    for (const event of this.uncommittedEvents) {
      await storeEvent({
        eventType: event.type,
        aggregateType: this.getAggregateType(),
        aggregateId: this.id,
        operation: this.inferOperation(event.type),
        payload: event.payload,
        metadata: event.metadata,
      });
    }
    this.uncommittedEvents = [];
  }

  /**
   * Infer database operation from event type
   */
  private inferOperation(eventType: string): 'INSERT' | 'UPDATE' | 'DELETE' {
    if (eventType.includes('Created')) return 'INSERT';
    if (eventType.includes('Deleted')) return 'DELETE';
    return 'UPDATE';
  }

  /**
   * Get current version
   */
  getVersion(): number {
    return this.version;
  }
}

/**
 * Product Aggregate (Example Implementation)
 */
export class ProductAggregate extends Aggregate {
  private name?: string;
  private price?: number;
  private stock?: number;
  private featured?: boolean;

  protected getAggregateType(): string {
    return 'Product';
  }

  protected applyEvent(event: DomainEvent): void {
    switch (event.type) {
      case 'ProductCreated':
        this.name = event.payload.new.name;
        this.price = event.payload.new.price;
        this.stock = event.payload.new.stock;
        this.featured = event.payload.new.featured;
        break;

      case 'ProductPriceChanged':
        this.price = event.payload.new.price;
        break;

      case 'ProductStockUpdated':
        this.stock = event.payload.new.stock;
        break;

      case 'ProductFeatured':
        this.featured = true;
        break;

      case 'ProductUnfeatured':
        this.featured = false;
        break;

      case 'ProductDeleted':
        // Mark as deleted
        break;
    }
  }

  // Commands
  changePrice(newPrice: number, changedBy: string): void {
    const event: DomainEvent = {
      type: 'ProductPriceChanged',
      aggregateType: 'Product',
      aggregateId: this.id,
      payload: { new: { price: newPrice }, old: { price: this.price } },
      metadata: { changedBy, timestamp: new Date().toISOString() },
    };
    this.addEvent(event);
  }

  updateStock(newStock: number, reason: string): void {
    const event: DomainEvent = {
      type: 'ProductStockUpdated',
      aggregateType: 'Product',
      aggregateId: this.id,
      payload: { new: { stock: newStock }, old: { stock: this.stock } },
      metadata: { reason, timestamp: new Date().toISOString() },
    };
    this.addEvent(event);
  }

  // Getters
  getName(): string | undefined {
    return this.name;
  }

  getPrice(): number | undefined {
    return this.price;
  }

  getStock(): number | undefined {
    return this.stock;
  }

  isFeatured(): boolean {
    return this.featured || false;
  }
}

/**
 * Order Aggregate (Example Implementation)
 */
export class OrderAggregate extends Aggregate {
  private status?: string;
  private total?: number;
  private items?: any[];

  protected getAggregateType(): string {
    return 'Order';
  }

  protected applyEvent(event: DomainEvent): void {
    switch (event.type) {
      case 'OrderCreated':
        this.status = 'pending';
        this.total = event.payload.new.total;
        this.items = event.payload.new.items;
        break;

      case 'OrderConfirmed':
        this.status = 'confirmed';
        break;

      case 'OrderShipped':
        this.status = 'shipped';
        break;

      case 'OrderDelivered':
        this.status = 'delivered';
        break;

      case 'OrderCancelled':
        this.status = 'cancelled';
        break;
    }
  }

  // Commands
  confirm(confirmedBy: string): void {
    if (this.status !== 'pending') {
      throw new Error('Order can only be confirmed from pending state');
    }

    const event: DomainEvent = {
      type: 'OrderConfirmed',
      aggregateType: 'Order',
      aggregateId: this.id,
      payload: { new: { status: 'confirmed' }, old: { status: this.status } },
      metadata: { confirmedBy, timestamp: new Date().toISOString() },
    };
    this.addEvent(event);
  }

  ship(shippedBy: string, trackingNumber: string): void {
    if (this.status !== 'confirmed') {
      throw new Error('Order must be confirmed before shipping');
    }

    const event: DomainEvent = {
      type: 'OrderShipped',
      aggregateType: 'Order',
      aggregateId: this.id,
      payload: { new: { status: 'shipped' }, old: { status: this.status } },
      metadata: { shippedBy, trackingNumber, timestamp: new Date().toISOString() },
    };
    this.addEvent(event);
  }

  cancel(cancelledBy: string, reason: string): void {
    if (this.status === 'delivered') {
      throw new Error('Cannot cancel delivered order');
    }

    const event: DomainEvent = {
      type: 'OrderCancelled',
      aggregateType: 'Order',
      aggregateId: this.id,
      payload: { new: { status: 'cancelled' }, old: { status: this.status } },
      metadata: { cancelledBy, reason, timestamp: new Date().toISOString() },
    };
    this.addEvent(event);
  }

  // Getters
  getStatus(): string | undefined {
    return this.status;
  }

  getTotal(): number | undefined {
    return this.total;
  }

  getItems(): any[] | undefined {
    return this.items;
  }
}

/**
 * Command Handler: Processes commands and generates events
 */
export class CommandHandler {
  async handle(command: Command): Promise<void> {
    // Create or load aggregate
    const aggregate = await this.createAggregate(command);

    // Execute command
    await this.executeCommand(aggregate, command);

    // Commit events
    await aggregate.commit();
  }

  private async createAggregate(command: Command): Promise<Aggregate> {
    // Determine aggregate type from command
    let aggregate: Aggregate;

    if (command.type.startsWith('Product')) {
      aggregate = new ProductAggregate(command.aggregateId);
    } else if (command.type.startsWith('Order')) {
      aggregate = new OrderAggregate(command.aggregateId);
    } else {
      throw new Error(`Unknown aggregate type for command: ${command.type}`);
    }

    // Load existing state
    await aggregate.loadFromHistory();

    return aggregate;
  }

  private async executeCommand(aggregate: Aggregate, command: Command): Promise<void> {
    // Execute command on aggregate
    if (aggregate instanceof ProductAggregate) {
      this.handleProductCommand(aggregate, command);
    } else if (aggregate instanceof OrderAggregate) {
      this.handleOrderCommand(aggregate, command);
    }
  }

  private handleProductCommand(aggregate: ProductAggregate, command: Command): void {
    switch (command.type) {
      case 'ChangeProductPrice':
        aggregate.changePrice(command.payload.price, command.metadata?.changedBy || 'system');
        break;

      case 'UpdateProductStock':
        aggregate.updateStock(command.payload.stock, command.metadata?.reason || 'manual update');
        break;

      default:
        throw new Error(`Unknown product command: ${command.type}`);
    }
  }

  private handleOrderCommand(aggregate: OrderAggregate, command: Command): void {
    switch (command.type) {
      case 'ConfirmOrder':
        aggregate.confirm(command.metadata?.confirmedBy || 'system');
        break;

      case 'ShipOrder':
        aggregate.ship(
          command.metadata?.shippedBy || 'system',
          command.payload.trackingNumber
        );
        break;

      case 'CancelOrder':
        aggregate.cancel(
          command.metadata?.cancelledBy || 'system',
          command.payload.reason
        );
        break;

      default:
        throw new Error(`Unknown order command: ${command.type}`);
    }
  }
}

/**
 * Query Service: Read model for CQRS pattern
 */
export class QueryService {
  /**
   * Get current state of aggregate
   */
  async getAggregate(aggregateType: string, aggregateId: string): Promise<any> {
    return await replayEvents(aggregateType, aggregateId);
  }

  /**
   * Get aggregate history (audit trail)
   */
  async getHistory(aggregateType: string, aggregateId: string): Promise<any[]> {
    return await getAggregateHistory(aggregateType, aggregateId);
  }

  /**
   * Time travel: Get aggregate state at specific point in time
   */
  async getAggregateAtTime(
    aggregateType: string,
    aggregateId: string,
    timestamp: Date
  ): Promise<any> {
    return await getAggregateSnapshot(aggregateType, aggregateId, timestamp);
  }
}

/**
 * Projection: Denormalized read model
 */
export interface Projection {
  name: string;
  handle(event: DomainEvent): Promise<void>;
}

/**
 * Example: ProductCatalogProjection
 */
export class ProductCatalogProjection implements Projection {
  name = 'ProductCatalog';

  async handle(event: DomainEvent): Promise<void> {
    if (event.aggregateType !== 'Product') return;

    switch (event.type) {
      case 'ProductCreated':
        await this.addToReadModel(event.payload.new);
        break;

      case 'ProductPriceChanged':
        await this.updatePrice(event.aggregateId, event.payload.new.price);
        break;

      case 'ProductDeleted':
        await this.removeFromReadModel(event.aggregateId);
        break;
    }
  }

  private async addToReadModel(product: any): Promise<void> {
    // Add to optimized read model (e.g., Redis, Elasticsearch)
    console.log('[Projection] Adding product to catalog:', product);
  }

  private async updatePrice(productId: string, newPrice: number): Promise<void> {
    console.log('[Projection] Updating price:', productId, newPrice);
  }

  private async removeFromReadModel(productId: string): Promise<void> {
    console.log('[Projection] Removing product from catalog:', productId);
  }
}

/**
 * Projection Manager: Coordinates multiple projections
 */
export class ProjectionManager {
  private projections: Projection[] = [];

  register(projection: Projection): void {
    this.projections.push(projection);
    console.log(`[Projection Manager] Registered projection: ${projection.name}`);
  }

  async process(event: DomainEvent): Promise<void> {
    for (const projection of this.projections) {
      try {
        await projection.handle(event);
      } catch (error) {
        console.error(`[Projection Manager] Error in ${projection.name}:`, error);
      }
    }
  }
}

// Export instances
export const commandHandler = new CommandHandler();
export const queryService = new QueryService();
export const projectionManager = new ProjectionManager();

// Register default projections
projectionManager.register(new ProductCatalogProjection());

export default {
  commandHandler,
  queryService,
  projectionManager,
  ProductAggregate,
  OrderAggregate,
};
