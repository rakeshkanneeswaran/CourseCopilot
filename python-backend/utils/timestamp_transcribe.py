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
from format_transcriptions import format_transcriptions
import model_utils
import whisper_timestamped as whisper

model = whisper.load_model("base")
from format_transcriptions import format_transcriptions  # Assuming format_transcription is in this file
def format_transcriptions(transcriptions):
    formatted = []
    for transcription in transcriptions:
        formatted_entry = {
            "id": transcription["id"],
            "start_time": f"{transcription['start']:.2f}s",
            "end_time": f"{transcription['end']:.2f}s",
            "text": transcription["text"],
            "confidence": transcription.get("confidence", "N/A"),
        }
        formatted.append(formatted_entry)
    return formatted

def transcribe_video_with_timestamps(video_path, model):
    try:
        # Extract audio from video
        video_clip = VideoFileClip(video_path)
        print("video_clip")
        audio_clip = video_clip.audio
        audio_output_path = "output_audio.mp3"
        audio_clip.write_audiofile(audio_output_path)
        print("audio_output_path", audio_output_path) 
        audio_clip.close()
        video_clip.close()

        # Transcribe audio using Whisper
        print("model")
        result = model.transcribe(audio_output_path)
        print("result")
        transcription_segments = result.get("segments", [])

        # Format transcription with timestamps
        transcription_filtered = format_transcriptions(transcription_segments)

        # Clean up the audio file after processing
        os.remove(audio_output_path)

        return transcription_filtered

    except Exception as e:
        raise e  # Re-raise the exception for handling in app.py