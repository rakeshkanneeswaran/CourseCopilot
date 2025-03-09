from langchain_ollama.llms import OllamaLLM
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

llm = OllamaLLM(model="llama3")

prompt = PromptTemplate(
    input_variables=["context", "query"],
    template=(
        "Answer the query using only the provided context. "
        "Do not assume information beyond the context. "
        "Respond concisely and in a structured manner without phrases like 'Based on the given context' or 'I can infer'.\n\n"
        "Context:\n{context}\n\n"
        "Query:\n{query}\n\n"
        "Answer:"
    ),
)


chain = LLMChain(llm=llm, prompt=prompt)


class LLMService:
    @staticmethod
    def generateResponse(context, query):
        response = chain.invoke({"context": context, "query": query})
        return response
