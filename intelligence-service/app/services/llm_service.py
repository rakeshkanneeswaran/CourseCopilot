from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv


load_dotenv()

LLM_PROVIDER = os.getenv("openai", "local").lower()

# Initialize the LLM based on the environment variable
# 3 seconds response time
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=os.getenv("OPENAI_API_KEY"),
)

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
