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
    ),
)

mcq_prompt = PromptTemplate(
    input_variables=["context"],
    template=(
        "You are an AI assistant that generates multiple-choice questions (MCQs) based on the provided context.\n\n"
        "### Instructions:\n"
        "- Read the given context carefully.\n"
        "- Generate **10 MCQs** from the context.\n"
        "- Each MCQ should have **4 answer options** (A, B, C, D).\n"
        "- Clearly mark the correct answer.\n"
        "- Provide the output **strictly in JSON format** for frontend use.\n\n"
        "### **Context:**\n"
        "{context}\n\n"
        "### **Output Format:**\n"
        "{{\n"
        '  "questions": [\n'
        "    {{\n"
        '      "question": "What is the main topic discussed in the context?",\n'
        '      "options": {{\n'
        '        "A": "Option 1",\n'
        '        "B": "Option 2",\n'
        '        "C": "Option 3",\n'
        '        "D": "Option 4"\n'
        "      }},\n"
        '      "correct_option": "B"\n'
        "    }},\n"
        "    ... (9 more questions in the same format)\n"
        "  ]\n"
        "}}\n"
    ),
)


chain = LLMChain(llm=llm, prompt=prompt)
mcq_chain = LLMChain(llm=llm, prompt=mcq_prompt)


class LLMService:
    @staticmethod
    def generateResponse(context, query):
        response = chain.invoke({"context": context, "query": query})
        return response

    @staticmethod
    def generateMCQs(context):
        response = mcq_chain.invoke({"context": context})
        return response
