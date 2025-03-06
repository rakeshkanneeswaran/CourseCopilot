from dotenv import load_dotenv
from llama_index.core import Settings, StorageContext, load_index_from_storage
from llama_index.llms.ollama import Ollama
from llama_index.core import PromptTemplate
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
import os
import time

# Load environment variables
load_dotenv()

# Initialize embedding model
embed_model = HuggingFaceEmbedding(
    model_name="BAAI/bge-large-en-v1.5",
    trust_remote_code=True
)

# Initialize LLM
llm = Ollama(model="deepseek-r1:8b", request_timeout=120.0)

# Configure settings
Settings.embed_model = embed_model
Settings.llm = llm

# Define paths
pdf_dir = "/Users/aagamchhajer/Desktop/aagam-projects/DeepSeek-RAG/pdf_dir"
storage_dir = "storage"  # Directory to store the index

# Function to check for new or updated files
def has_new_or_updated_files(pdf_dir, storage_dir):
    # Get the last modification time of the storage directory
    if not os.path.exists(storage_dir):
        return True  # Storage doesn't exist, so we need to process files

    storage_mtime = os.path.getmtime(storage_dir)

    # Check all PDF files in the directory
    for root, _, files in os.walk(pdf_dir):
        for file in files:
            if file.endswith(".pdf"):
                file_path = os.path.join(root, file)
                file_mtime = os.path.getmtime(file_path)
                if file_mtime > storage_mtime:
                    return True  # New or updated file found

    return False  # No new or updated files

# Check if the index needs to be rebuilt
if not os.path.exists(storage_dir) or has_new_or_updated_files(pdf_dir, storage_dir):
    # Load documents
    loader = SimpleDirectoryReader(
        input_dir=pdf_dir,
        required_exts=[".pdf"],
        recursive=True
    )
    docs = loader.load_data()

    # Create index
    index = VectorStoreIndex.from_documents(docs)

    # Save the index to disk
    index.storage_context.persist(persist_dir=storage_dir)
    print("Index created/updated and saved to disk.")
else:
    # Load the index from disk
    storage_context = StorageContext.from_defaults(persist_dir=storage_dir)
    index = load_index_from_storage(storage_context)
    print("Index loaded from disk.")

# Create query engine with streaming enabled
query_engine = index.as_query_engine(
    streaming=True,  # Enable streaming
    similarity_top_k=1  # Number of similar chunks to retrieve
)

# Create and set custom prompt
qa_prompt_tmpl_str = (
    "Context information is below.\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Given the context information above, first think step by step about how to answer the query, "
    "then provide a clear and concise answer. Format your response as follows:\n\n"
    "THINKING:\n"
    "[Your step-by-step reasoning process]\n\n"
    "ANSWER:\n"
    "[Your final, concise answer]\n\n"
    "If you don't know the answer, say 'I don't know!'\n"
    "Query: {query_str}\n"
)
qa_prompt_tmpl = PromptTemplate(qa_prompt_tmpl_str)

query_engine.update_prompts(
    {"response_synthesizer:text_qa_template": qa_prompt_tmpl}
)

# Example query
query = "What is the main topic of the document?"
response = query_engine.query(query)

# Process and display the response
thinking = ""
answer = ""
in_thinking = False

for chunk in response.response_gen:
    if "<think>" in chunk:
        in_thinking = True
        chunk = chunk.replace("<think>", "")
    elif "</think>" in chunk:
        in_thinking = False
        chunk = chunk.replace("</think>", "")
        continue

    if in_thinking:
        thinking += chunk
    else:
        answer += chunk

print("THINKING:")
print(thinking.replace("<think>", "").strip())
print("\nANSWER:")
print(answer.strip())