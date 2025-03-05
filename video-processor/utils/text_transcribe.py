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
from flask_cors import CORS
import model_utils

model = model_utils.get_model()
def transcribe_video(video_path, model):
    try:
        # Extract audio from video
        video_clip = VideoFileClip(video_path)
        audio_clip = video_clip.audio
        audio_output_path = "output_audio.mp3"
        audio_clip.write_audiofile(audio_output_path)
        audio_clip.close()
        video_clip.close()

        # Transcribe audio using Whisper
        result = model.transcribe(audio_output_path)
        transcription = result["text"]

        # Clean up the audio file after processing
        os.remove(audio_output_path)

        return transcription

    except Exception as e:
        raise e 
