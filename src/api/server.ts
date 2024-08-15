// File: src/api/server.ts

import fastify, { FastifyInstance } from 'fastify';
import { Graph } from '../graph/Graph';

const graph = new Graph();

const server: FastifyInstance = fastify({ logger: true });

server.post<{
  Body: { id: string; data: any };
}>('/node', async (request, reply) => {
  const { id, data } = request.body;
  await graph.addNode(id, data);
  return { message: 'Node addition task sent' };
});

server.post<{
  Body: { source: string; target: string; weight?: number };
}>('/edge', async (request, reply) => {
  const { source, target, weight } = request.body;
  await graph.addEdge(source, target, weight);
  return { message: 'Edge addition task sent' };
});

server.get<{
  Params: { startId: string };
}>('/bfs/:startId', async (request, reply) => {
  const { startId } = request.params;
  const result = await graph.bfs(startId);
  return { traversal: result };
});

const start = async () => {
  try {
    await graph.init();
    await server.listen({ port: 3000 });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing server...');
  await server.close();
  await graph.close();
  process.exit(0);
});