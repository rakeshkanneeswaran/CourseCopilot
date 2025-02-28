from flask import Flask, request, jsonify
from moviepy import VideoFileClip
import whisper_timestamped as whisper
import os
import moviepy as mp
from gtts import gTTS
import tqdm as tqdm
import subprocess
from pydub import AudioSegment
from google.cloud import texttospeech

# def synthesize_speech(text, output_filename, language_code, language_name, ssml_gender):
#     # Create a Text-to-Speech client
#     client = texttospeech.TextToSpeechClient()

#     # Set the text input
#     input_text = texttospeech.SynthesisInput(text=text)

#     # Configure the voice settings
#     voice = texttospeech.VoiceSelectionParams(
#         language_code=language_code,
#         name=language_name,
#         ssml_gender=texttospeech.SsmlVoiceGender.MALE
#     )

def synthesize_speech(text, output_filename, language_code, language_name, ssml_gender):
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