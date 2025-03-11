from langchain_ollama.llms import OllamaLLM
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

import os
from langchain_openai import ChatOpenAI

LLM_PROVIDER = os.getenv("openai", "local").lower()

# Initialize the LLM based on the environment variable
#3 seconds response time
if LLM_PROVIDER == "openai":
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
else:
    #4 seconds response time
    llm = OllamaLLM(model="llama3")

prompt = PromptTemplate(
    input_variables=["context", "query"],
    template=(
        "Answer the query using only the provided context. "
        "Do not assume information beyond the context. "
        "Respond concisely and in a structured manner without phrases like 'Based on the given context' or 'I can infer'.\n\n"
        "Context:\n{context}\n\n"
        "Query:\n{query}\n\n"
    ),
)

chain = LLMChain(llm=llm, prompt=prompt)


class LLMService:
    @staticmethod
    def generateResponse(context, query):
        response = chain.invoke({"context": context, "query": query})
        return response
