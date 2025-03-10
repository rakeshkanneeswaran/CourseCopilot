class MCQGeneratorService:
    def __init__(self):
        self.llm = OllamaLLM(model="llama3")
        self._setup_llm_chain()
        
    def _setup_llm_chain(self):
        mcq_prompt = PromptTemplate(
            input_variables=["lecture_content", "num_questions", "difficulty"],
            template=(
                "Generate {num_questions} multiple choice questions based on the lecture content below. "
                "The questions should cover various topics from the entire lecture. "
                "Difficulty level: {difficulty}\n\n"
                "Lecture Content:\n{lecture_content}\n\n"
                "Return ONLY a JSON array of question objects with the following structure:\n"
                "[\n"
                "  {\n"
                "    \"question\": \"Question text\",\n"
                "    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
                "    \"correct_answer\": \"The correct option (exactly as written in options)\",\n"
                "    \"explanation\": \"Brief explanation of why this is correct\"\n"
                "  }\n"
                "]\n"
            ),
        )
        self.mcq_chain = LLMChain(llm=self.llm, prompt=mcq_prompt)
    
    def generate_mcq_from_lecture(self, project_id, lecture_id, num_questions=5, difficulty="medium"):
        # Directly fetch the lecture transcript from S3
        lecture_content = self._fetch_lecture_transcript_from_s3(project_id, lecture_id)
        
        # Generate MCQs
        response = self.mcq_chain.invoke({
            "lecture_content": lecture_content,
            "num_questions": num_questions,
            "difficulty": difficulty
        })
        
        try:
            response_text = response['text'] if isinstance(response, dict) else response
            # Extract JSON array
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                mcq_questions = json.loads(json_match.group(0))
            else:
                mcq_questions = json.loads(response_text)
            return mcq_questions
        except Exception as e:
            print(f"Error parsing MCQ response: {e}")
            return {"error": "Failed to generate valid MCQs"}
    
    def _fetch_lecture_transcript_from_s3(self, project_id, lecture_id):
        """Fetch lecture transcript directly from S3"""
        try:
            s3_client = boto3.client('s3')
            s3_bucket = "your-bucket-name"
            s3_key = f"projects/{project_id}/lectures/{lecture_id}/transcript.json"
            
            response = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
            transcript_data = json.loads(response['Body'].read().decode('utf-8'))
            
            # Process transcript data
            full_text = ""
            for segment in transcript_data:
                full_text += segment.get("text", "") + " "
            
            return full_text
        except Exception as e:
            print(f"Error fetching transcript from S3: {e}")
            return "Failed to retrieve lecture content."