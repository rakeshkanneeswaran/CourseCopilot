"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kafka_consumer = exports.kafka_admin = void 0;
const kafkajs_1 = require("kafkajs");
const kafka_consumer = new kafkajs_1.Kafka({
    clientId: "video-processor-consumer",
    brokers: ["localhost:9092"]
});
exports.kafka_consumer = kafka_consumer;
const kafka_admin = new kafkajs_1.Kafka({
    clientId: "video-processor-admin",
    brokers: ["localhost:9092"]
});
exports.kafka_admin = kafka_admin;
