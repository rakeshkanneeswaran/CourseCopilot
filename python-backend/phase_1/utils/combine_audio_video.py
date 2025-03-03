import os
import subprocess
from pydub import AudioSegment
from moviepy.editor import VideoFileClip
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

def generate_tts(video_path, language_code, language_name, ssml_gender, transcription):
    """
    Generate TTS audio for each line in the transcription and combine it into a single audio file.

    Args:
        video_path (str): Path to the input video file.
        language_code (str): Language code for TTS (e.g., "en-US").
        language_name (str): Voice name for TTS (e.g., "en-US-Wavenet-D").
        ssml_gender (str): Gender of the voice ("male" or "female").
        transcription (list): List of transcription segments with text and timestamps.

    Returns:
        str: Path to the final combined audio file.
    """
    try:
        # Load the video to get its duration
        video_clip = VideoFileClip(video_path)
        video_duration = video_clip.duration
        video_clip.close()

        # Initialize final audio as silence
        final_audio = AudioSegment.silent(duration=0)
        temp_files = []

        # Process each transcription segment
        for i, segment in enumerate(transcription):
            print(f"Processing segment {i + 1}/{len(transcription)}")
            # Generate TTS for the text using Google Cloud Text-to-Speech API
            temp_file = f'temp_audio_{i}.mp3'
            synthesize_speech(segment['text'], temp_file, language_code, language_name, ssml_gender)
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
        final_output_path = os.path.join(os.path.dirname(video_path), "final_output.mp3")
        final_audio.export(final_output_path, format="mp3")
        print(f"Final audio saved to {final_output_path}")

        # Clean up temporary files
        for temp_file in temp_files:
            os.remove(temp_file)

        return final_output_path

    except Exception as e:
        print(f"Error generating TTS: {str(e)}")
        raise

def combine_video_audio(video_path, transcription, output_path, language_code="en-US", language_name="en-US-Wavenet-D", ssml_gender="male", subtitle_path=None):
    """
    Generate TTS audio, combine it with the video, and optionally add subtitles.

    Args:
        video_path (str): Path to the input video file.
        transcription (list): List of transcription segments with text and timestamps.
        output_path (str): Path to save the final output video.
        language_code (str): Language code for TTS (e.g., "en-US").
        language_name (str): Voice name for TTS (e.g., "en-US-Wavenet-D").
        ssml_gender (str): Gender of the voice ("male" or "female").
        subtitle_path (str, optional): Path to the subtitle file (SRT format). Defaults to None.

    Returns:
        str: Path to the final output video.
    """
    try:
        # Generate TTS audio
        audio_path = generate_tts(video_path, language_code, language_name, ssml_gender, transcription)

        # Prepare FFmpeg command based on whether subtitles are provided
        if subtitle_path:
            # FFmpeg command with subtitles
            ffmpeg_command = [
                "ffmpeg",
                "-i", video_path,  # Input video
                "-i", audio_path,  # Input audio
                "-i", subtitle_path,  # Input subtitles
                "-c:v", "libx264",  # Video codec
                "-c:a", "aac",  # Audio codec
                "-vf", f"subtitles='{subtitle_path.replace('\\', '/')}'",  # Add subtitles
                "-map", "0:v",  # Map video stream
                "-map", "1:a",  # Map audio stream
                "-shortest",  # Ensure output matches the shortest input
                output_path  # Output file
            ]
        else:
            # FFmpeg command without subtitles
            ffmpeg_command = [
                "ffmpeg",
                "-i", video_path,  # Input video
                "-i", audio_path,  # Input audio
                "-c:v", "copy",  # Copy video stream
                "-c:a", "aac",  # Audio codec
                "-shortest",  # Ensure output matches the shortest input
                output_path  # Output file
            ]

        # Execute the FFmpeg command
        subprocess.run(ffmpeg_command, check=True)
        print(f"Video and audio combined successfully: {output_path}")

        # Clean up the generated audio file
        os.remove(audio_path)

        return output_path

    except subprocess.CalledProcessError as e:
        print(f"Error combining video and audio: {str(e)}")
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise