// File: src/db/Neo4jClient.ts

import neo4j, { Driver, Session } from 'neo4j-driver';

export class Neo4jClient {
  private driver: Driver;

  constructor(uri: string, username: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  async addNode(id: string, data: any) {
    const session: Session = this.driver.session();
    try {
      await session.run(
        'CREATE (n:Node {id: $id, data: $data})',
        { id, data: JSON.stringify(data) }
      );
    } finally {
      await session.close();
    }
  }

  async addEdge(sourceId: string, targetId: string, weight: number) {
    const session: Session = this.driver.session();
    try {
      await session.run(
        'MATCH (a:Node {id: $sourceId}), (b:Node {id: $targetId}) ' +
        'CREATE (a)-[r:CONNECTS {weight: $weight}]->(b)',
        { sourceId, targetId, weight }
      );
    } finally {
      await session.close();
    }
  }

  async getNode(id: string) {
    const session: Session = this.driver.session();
    try {
      const result = await session.run(
        'MATCH (n:Node {id: $id}) RETURN n',
        { id }
      );
      if (result.records.length > 0) {
        const node = result.records[0].get('n');
        return {
          id: node.properties.id,
          data: JSON.parse(node.properties.data)
        };
      }
      return null;
    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }
}