// File: src/graph/Graph.ts

import { KafkaClient } from '../kafka/KafkaClient';
import { RedisCache } from '../cache/RedisCache';
import { Neo4jClient } from '../db/Neo4jClient';
import { v4 as uuidv4 } from 'uuid';

class Node {
  constructor(public id: string, public data: any = {}) {}
}

class Edge {
  constructor(public source: string, public target: string, public weight: number = 1) {}
}

export class Graph {
  private kafka: KafkaClient;
  private cache: RedisCache;
  private db: Neo4jClient;

  constructor() {
    this.kafka = new KafkaClient(['localhost:9092'], 'graph-main');
    this.cache = new RedisCache();
    this.db = new Neo4jClient('neo4j://localhost', 'neo4j', 'password'); // Replace with actual credentials
  }

  async init() {
    await this.kafka.connect();
    await this.cache.connect();
    // Neo4j connection is established per session, so no need to connect here
  }

  async addNode(id: string, data: any = {}): Promise<void> {
    const task = { type: 'ADD_NODE', id, data };
    await this.kafka.sendMessage('graph-tasks', task);
    await this.cache.set(`node:${id}`, JSON.stringify(new Node(id, data)));
    await this.db.addNode(id, data);
  }

  async addEdge(sourceId: string, targetId: string, weight: number = 1): Promise<void> {
    const task = { type: 'ADD_EDGE', sourceId, targetId, weight };
    await this.kafka.sendMessage('graph-tasks', task);
    await this.db.addEdge(sourceId, targetId, weight);
  }

  async getNode(id: string): Promise<Node | null> {
    const cachedNode = await this.cache.get(`node:${id}`);
    if (cachedNode) {
      return JSON.parse(cachedNode);
    }
    const node = await this.db.getNode(id);
    if (node) {
      await this.cache.set(`node:${id}`, JSON.stringify(node));
    }
    return node;
  }

  async bfs(startId: string): Promise<string[]> {
    const taskId = uuidv4();
    const task = { type: 'BFS', startId, taskId };
    await this.kafka.sendMessage('graph-tasks', task);

    return new Promise((resolve) => {
      this.kafka.consumeMessages('graph-results', async (message) => {
        if (message.taskId === taskId) {
          resolve(message.result);
        }
      });
    });
  }

  async close() {
    await this.kafka.disconnect();
    await this.cache.close();
    await this.db.close();
  }
}