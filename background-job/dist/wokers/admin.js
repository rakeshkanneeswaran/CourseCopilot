"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
const checkTopicExists = (topicName) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = client_1.kafka_admin.admin();
    yield admin.connect();
    const topics = yield admin.listTopics(); // Get all topics
    if (topics.includes(topicName)) {
        console.log(`✅ Topic "${topicName}" exists.`);
    }
    else {
        console.log(`Topic "${topicName}" does NOT exist.`);
        yield admin.createTopics({
            topics: [
                {
                    topic: 'process-video',
                    numPartitions: 1,
                    replicationFactor: 1,
                },
            ],
        });
    }
    ;
    yield admin.disconnect();
    console.log(`✅ admin disconnect from kafka server`);
});
checkTopicExists('process-video').catch(console.error);
