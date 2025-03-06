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
const ollama_1 = require("@llamaindex/ollama");
const llamaindex_1 = require("llamaindex");
llamaindex_1.Settings.embedModel = new ollama_1.OllamaEmbedding({ model: "nomic-embed-text" });
llamaindex_1.Settings.llm = new ollama_1.Ollama({
    model: "llama3.2",
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const essay = 'Diabetes is a chronic disease that affects millions of people worldwide. It occurs when the body either does not produce enough insulin or cannot effectively use the insulin it produces. Insulin is a hormone responsible for regulating blood sugar (glucose) levels. Without proper management, diabetes can lead to serious health complications, including heart disease, kidney failure, nerve damage, and vision problems.';
        llamaindex_1.Settings.embedModel = new ollama_1.OllamaEmbedding({ model: "nomic-embed-text" });
        const document = new llamaindex_1.Document({ text: essay, id_: "essay" });
        const index = yield llamaindex_1.VectorStoreIndex.fromDocuments([document]);
        const queryEngine = index.asQueryEngine();
        const query = "what is the cause of diabetes";
        const results = yield queryEngine.query({
            query,
        });
        console.log(results);
    });
}
main().catch(console.error);
