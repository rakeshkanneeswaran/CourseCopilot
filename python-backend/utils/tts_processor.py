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
from synthesize_speech import synthesize_speech
from generate_srt import generate_srt

def generate_tts(video_path, language_code,language_name,ssml_gender, transcription):

        video_clip = VideoFileClip(video_path)
        video_duration = video_clip.duration
        final_audio = AudioSegment.silent(duration=0)
        temp_files = []

        # Process each transcription segment
        for i, segment in enumerate(transcription):
            print("helo.")
            # Generate TTS for the text using Google Cloud Text-to-Speech API
            temp_file = f'temp_audio_{i}.mp3'  # Ensure filename is correct

            synthesize_speech(segment['text'], temp_file , language_code, language_name, ssml_gender)
            temp_files.append(temp_file)

            # Load the generated audio and concatenate it to final audio
            current_segment = AudioSegment.from_file(temp_file)
            final_audio += current_segment

            # Add silence between segments if applicable
            if i < len(transcription) - 1:
                current_end = float(segment['end_time'].replace('s', '')) * 1000
                next_start = float(transcription[i + 1]['start_time'].replace('s', '')) * 1000
                silence_duration = next_start - current_end
                silence = AudioSegment.silent(duration=max(silence_duration, 0))
                final_audio += silence
        
        # Export the final combined audio
        final_output_path = "C:\\Users\\singh\\Course_Copilot_Pro\\python_structured\\final_output.mp3"
        final_audio.export(final_output_path, format="mp3")
        for temp_file in temp_files:
            os.remove(temp_file)
        

        # Calculate the speed factor for audio sync with video
        speed_factor = final_audio.duration_seconds / video_duration

        # Prepare FFmpeg command to combine audio with video
        output_file = video_path
        # ffmpeg_command = f'ffmpeg -y -i "{final_output_path}" -i "{video_path}" -filter_complex "[0:a]aresample=async=1,atempo={speed_factor}" -c:v copy "{output_file}"'
        # print(ffmpeg_command)
        # # Run the FFmpeg command using subprocess
        # subprocess.run(ffmpeg_command, shell=True, check=True)
        srt_file = "C:\\Users\\singh\\Course_Copilot_Pro\\primary-backend\\final-text\\temp.txt"
        generate_srt(srt_file)
        print("check2")
        input_subtitle_path = "C:\\Users\\singh\\Course_Copilot_Pro\\python_structured\\output.srt"
        output_video_path = "C:\\Users\\singh\\Course_Copilot_Pro\\python_structured\\final_video.mp4"


# Construct the FFmpeg command
#         ffmpeg_command = [
#     "ffmpeg",
#     "-i", output_file,
#     "-i", input_subtitle_path,
#     "-c:v", "libx264",
#     "-c:a", "copy",
#     "-vf", f"subtitles='{input_subtitle_path}'",
#     output_video_path
# ]

        ffmpeg_command = [
    "ffmpeg",
    "-i", "C:\\Users\\singh\\Course_Copilot_Pro\\python_structured\\input_video.mp4",
    "-i", "C:\\Users\\singh\\Course_Copilot_Pro\\python_structured\\final_output.mp3",
    "-i", "C:\\Users\\singh\\Course_Copilot_Pro\\python_structured\\output.srt",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-vf", "subtitles='C\\:/Users/singh/Course_Copilot_Pro/python_structured/output.srt'",
    "-map", "0:v",
    "-map", "1:a",
    "-shortest",
    "C:\\Users\\singh\\Course_Copilot_Pro\\python_structured\\final_video.mp4"
]

        subprocess.call(ffmpeg_command, shell=True)
        print("FFmpeg command executed successfully")

        return (output_video_path)