from langchain_ollama.llms import OllamaLLM
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
import os
from langchain_openai import ChatOpenAI

LLM_PROVIDER = os.getenv("openai", "local").lower()

# Initialize the LLM based on the environment variable
#25 seconds response time
if LLM_PROVIDER == "openai":
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
else:
    #50 seconds response time
    llm = OllamaLLM(model="llama3")

# Define the data structure using Pydantic
class QuestionItem(BaseModel):
    question: str = Field(description="The question text")
    options: dict = Field(description="Dictionary of answer options with keys A, B, C, D")
    correct_option: str = Field(description="The correct answer option, e.g., 'B'")
    explanation: str = Field(description="Explanation for why the answer is correct")

class MCQSet(BaseModel):
    questions: list[QuestionItem] = Field(description="List of questions with options, correct answer, and explanation")

parser = JsonOutputParser(pydantic_object=MCQSet)

mcq_prompt = PromptTemplate(
    input_variables=["context"],
    partial_variables={"format_instructions": parser.get_format_instructions()},
    template=(
        "You are an AI assistant that generates multiple-choice questions (MCQs) based on the provided context.\n\n"
        "### Instructions:\n"
        "- Generate 10 MCQs from the context.\n"
        "- Each MCQ should have 4 options (A, B, C, D).\n"
        "- Clearly mention the correct answer as 'correct_option'.\n"
        "- Provide an explanation for the correct answer.\n"
        "- Output must be in JSON format as per the structure below.\n\n"
        "{format_instructions}\n"
        "### Context:\n{context}\n"
    ),
)

mcq_chain = mcq_prompt | llm | parser

class MCQService:
    @staticmethod
    def generateMCQs(context):
        response = mcq_chain.invoke({"context": context})
        return response