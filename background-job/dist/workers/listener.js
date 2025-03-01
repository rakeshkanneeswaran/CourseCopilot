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
const kafka_config_1 = require("./kafka-config");
const consumer = kafka_config_1.kafka_consumer.consumer({ groupId: "process-video-listener" });
function listener() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`🟡 Initializing listener`);
        yield consumer.connect();
        console.log(`✅ Successfully connected to kafka server`);
        yield consumer.subscribe({
            topic: "process-video", fromBeginning: true
        });
        console.log(`✅ Successfully subscribed process-video topic`);
        yield consumer.run({
            eachMessage: (_a) => __awaiter(this, [_a], void 0, function* ({ topic, partition, message }) {
                var _b;
                console.log(`🟡 Message received at ${topic}`);
                console.log({
                    offset: message.offset,
                    value: (_b = message === null || message === void 0 ? void 0 : message.value) === null || _b === void 0 ? void 0 : _b.toString(),
                });
            }),
        });
    });
}
listener();
