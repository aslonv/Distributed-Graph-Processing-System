// File: src/kafka/KafkaClient.ts

import { Kafka, Producer, Consumer } from 'kafkajs';

export class KafkaClient {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;

  constructor(brokers: string[], clientId: string) {
    this.kafka = new Kafka({ brokers, clientId });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: `${clientId}-group` });
  }

  async connect() {
    await this.producer.connect();
    await this.consumer.connect();
  }

  async disconnect() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async sendMessage(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async consumeMessages(topic: string, callback: (message: any) => Promise<void>) {
    await this.consumer.subscribe({ topic, fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const parsedMessage = JSON.parse(message.value!.toString());
        await callback(parsedMessage);
      },
    });
  }
}