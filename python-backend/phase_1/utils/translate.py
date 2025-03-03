import os
import json
import vertexai
from vertexai.generative_models import (
    GenerationConfig,
    GenerativeModel,
    HarmBlockThreshold,
    HarmCategory,
)
from loguru import logger

# Constants
PROJECT_ID = "gen-lang-client-0666499294"
LOCATION = "us-central1"
MODEL_ID = "gemini-1.5-flash-002"

def init_vertex_ai():
    """Initialize Vertex AI with project and location settings."""
    try:
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        logger.info(f"Vertex AI initialized with project: {PROJECT_ID}, location: {LOCATION}")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize Vertex AI: {str(e)}")
        return False

def get_translation_model(target_language):
    """Get a configured Gemini model for translation to the specified language."""
    try:
        # Create translation model with system instructions
        translation_model = GenerativeModel(
            MODEL_ID,
            system_instruction=[
                "You are a helpful language translator.",
                f"Your mission is to translate text from English to {target_language} where I will provide you a json format data which contains start_time, end_time, text, and confidence.",
                "The output should be in the same format where only the text field is modified and all other fields are kept the same.",
                "Maintain the exact same JSON structure and formatting in your response."
            ],
        )
        
        # Set model parameters
        generation_config = GenerationConfig(
            temperature=0.2,  # Lower temperature for more consistent translations
            top_p=0.95,
            top_k=40,
            candidate_count=1,
            max_output_tokens=8192,
        )
        
        # Set safety settings
        safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        }
        
        return translation_model, generation_config, safety_settings
    
    except Exception as e:
        logger.error(f"Failed to create translation model: {str(e)}")
        return None, None, None

def translate_transcript(input_file, output_file, target_language):
    """
    Translate transcript from English to the target language using Vertex AI Gemini model.
    
    Args:
        input_file (str): Path to the input transcript JSON file
        output_file (str): Path to save the translated transcript
        target_language (str): Target language for translation (e.g., 'Hindi', 'French', 'German')
    
    Returns:
        bool: True if translation was successful, False otherwise
    """
    try:
        # Initialize Vertex AI
        if not init_vertex_ai():
            return False
        
        # Load the transcript file
        with open(input_file, 'r', encoding='utf-8') as f:
            transcript_data = json.load(f)
        
        # Get translation model
        translation_model, generation_config, safety_settings = get_translation_model(target_language)
        if not translation_model:
            return False
        
        # For large transcripts, process in batches to avoid token limits
        batch_size = 20  # Process 20 transcript segments at a time
        translated_transcript = []
        
        for i in range(0, len(transcript_data), batch_size):
            batch = transcript_data[i:i+batch_size]
            
            # Prepare prompt for the batch
            prompt = f"""
            User input: {json.dumps(batch)}
            Answer:
            """
            
            # Send to model for translation
            logger.info(f"Translating batch {i//batch_size + 1} to {target_language}")
            response = translation_model.generate_content(
                [prompt],
                generation_config=generation_config,
                safety_settings=safety_settings,
            )
            
            # Process response
            if hasattr(response, 'text') and response.text:
                try:
                    # Extract the translated JSON from the response
                    response_text = response.text.strip()
                    # Handle potential markdown code block formatting in response
                    if response_text.startswith("```") and response_text.endswith("```"):
                        response_text = response_text[3:-3].strip()
                    if response_text.startswith("json") and "```" in response_text:
                        response_text = response_text[4:].strip()
                        
                    translated_batch = json.loads(response_text)
                    translated_transcript.extend(translated_batch)
                    
                    logger.info(f"Successfully translated batch {i//batch_size + 1}")
                except json.JSONDecodeError as je:
                    logger.error(f"Failed to parse translation response: {je}")
                    logger.error(f"Response text: {response.text}")
                    return False
            else:
                logger.error("Translation failed: Empty or invalid response")
                return False
        
        # Save the translated transcript
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(translated_transcript, f, ensure_ascii=False, indent=2)
        
        logger.success(f"Translation to {target_language} completed and saved to {output_file}")
        return True
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        return False

# Example usage
if __name__ == "__main__":
    # Example for testing the function independently
    input_path = "transcript.json"
    output_path = "transcript_translated.json"
    target_lang = "Hindi"
    
    success = translate_transcript(input_path, output_path, target_lang)
    if success:
        logger.info("Translation completed successfully")
    else:
        logger.error("Translation failed")