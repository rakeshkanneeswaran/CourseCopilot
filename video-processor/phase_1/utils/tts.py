import os
from google.cloud import texttospeech

def synthesize_speech(text, output_filename, language_code, language_name, ssml_gender):
    """
    Synthesize speech from text using Google Cloud Text-to-Speech API.

    Args:
        text (str): The text to convert to speech.
        output_filename (str): The path to save the generated audio file.
        language_code (str): The language code (e.g., "en-US").
        language_name (str): The voice name (e.g., "en-US-Wavenet-D").
        ssml_gender (str): The gender of the voice ("male" or "female").

    Returns:
        None
    """
    try:
        # Create a Text-to-Speech client
        client = texttospeech.TextToSpeechClient()

        # Set the text input
        input_text = texttospeech.SynthesisInput(text=text)

        # Convert the string ssml_gender to the enum value
        gender_enum = getattr(texttospeech.SsmlVoiceGender, ssml_gender.upper())

        # Configure the voice settings
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=language_name,
            ssml_gender=gender_enum
        )

        # Set the audio configuration
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        # Perform the text-to-speech request
        response = client.synthesize_speech(
            input=input_text, voice=voice, audio_config=audio_config
        )

        # Save the audio to a file
        with open(output_filename, "wb") as out:
            out.write(response.audio_content)
        print(f"Audio content written to '{output_filename}'")

    except Exception as e:
        print(f"Error synthesizing speech: {str(e)}")
        raise

def generate_tts_audio(transcript_path, output_audio_path, gender="male"):
    """
    Generate TTS audio from a transcript file.

    Args:
        transcript_path (str): Path to the transcript JSON file.
        output_audio_path (str): Path to save the generated audio file.
        gender (str): Gender of the voice ("male" or "female").

    Returns:
        None
    """
    try:
        # Load the transcript
        import json
        with open(transcript_path, "r") as f:
            transcript = json.load(f)

        # Extract text from the transcript
        text = " ".join([entry["text"] for entry in transcript])

        # Default language settings (can be customized)
        language_code = "en-US"
        language_name = "en-US-Wavenet-D"  # Example voice name

        # Generate TTS audio
        synthesize_speech(
            text=text,
            output_filename=output_audio_path,
            language_code=language_code,
            language_name=language_name,
            ssml_gender=gender
        )
        print(f"TTS audio generated and saved to {output_audio_path}")

    except Exception as e:
        print(f"Error generating TTS audio: {str(e)}")
        raise