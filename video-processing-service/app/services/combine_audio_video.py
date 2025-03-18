import os
import subprocess
from pydub import AudioSegment
from moviepy.video.io.VideoFileClip import VideoFileClip
from google.cloud import texttospeech
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from functools import wraps

# Disable gRPC fork support to prevent the warnings
os.environ["GRPC_FORK_SUPPORT_ENABLED"] = "0"

# Create a semaphore to limit concurrent API calls
# This helps prevent overwhelming the gRPC service
api_semaphore = threading.Semaphore(10)  # Limit to 2 concurrent requests


def retry_on_error(max_attempts=4, delay_seconds=2):
    """Decorator to retry a function on failure with exponential backoff."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            current_delay = delay_seconds

            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts == max_attempts:
                        print(f"Failed after {max_attempts} attempts: {str(e)}")
                        raise

                    print(
                        f"Attempt {attempts} failed with error: {str(e)}. Retrying in {current_delay} seconds..."
                    )
                    time.sleep(current_delay)
                    # Exponential backoff
                    current_delay *= 2

        return wrapper

    return decorator


@retry_on_error(max_attempts=4, delay_seconds=2)
def synthesize_speech(text, output_filename, language_code, language_name, ssml_gender):
    """
    Synthesize speech from text using Google Cloud Text-to-Speech API.
    Includes semaphore to limit concurrent API calls.

    Args:
        text (str): The text to convert to speech.
        output_filename (str): The path to save the generated audio file.
        language_code (str): The language code (e.g., "en-US").
        language_name (str): The voice name (e.g., "en-US-Wavenet-D").
        ssml_gender (str): The gender of the voice ("male" or "female").

    Returns:
        None
    """
    # Use semaphore to limit concurrent API calls
    with api_semaphore:
        try:
            # Create a new client for each request to avoid conflicts
            client = texttospeech.TextToSpeechClient()

            # Handle excessively long text by chunking if needed
            if len(text) > 5000:  # Google has a ~5000 character limit
                chunks = [text[i : i + 4500] for i in range(0, len(text), 4500)]
                audio_segments = []

                for i, chunk in enumerate(chunks):
                    chunk_filename = f"{output_filename}.chunk{i}.mp3"
                    # Process each chunk
                    input_text = texttospeech.SynthesisInput(text=chunk)
                    gender_enum = getattr(
                        texttospeech.SsmlVoiceGender, ssml_gender.upper()
                    )
                    voice = texttospeech.VoiceSelectionParams(
                        language_code=language_code,
                        name=language_name,
                        ssml_gender=gender_enum,
                    )
                    audio_config = texttospeech.AudioConfig(
                        audio_encoding=texttospeech.AudioEncoding.MP3
                    )

                    response = client.synthesize_speech(
                        input=input_text, voice=voice, audio_config=audio_config
                    )

                    with open(chunk_filename, "wb") as out:
                        out.write(response.audio_content)

                    audio_segments.append(AudioSegment.from_file(chunk_filename))

                # Combine chunks
                combined = sum(audio_segments[1:], audio_segments[0])
                combined.export(output_filename, format="mp3")

                # Clean up chunk files
                for i in range(len(chunks)):
                    chunk_file = f"{output_filename}.chunk{i}.mp3"
                    if os.path.exists(chunk_file):
                        os.remove(chunk_file)
            else:
                # Standard processing for shorter text
                input_text = texttospeech.SynthesisInput(text=text)
                gender_enum = getattr(texttospeech.SsmlVoiceGender, ssml_gender.upper())
                voice = texttospeech.VoiceSelectionParams(
                    language_code=language_code,
                    name=language_name,
                    ssml_gender=gender_enum,
                )
                audio_config = texttospeech.AudioConfig(
                    audio_encoding=texttospeech.AudioEncoding.MP3
                )

                response = client.synthesize_speech(
                    input=input_text, voice=voice, audio_config=audio_config
                )

                with open(output_filename, "wb") as out:
                    out.write(response.audio_content)

            print(f"Audio content written to '{output_filename}'")

        except Exception as e:
            print(f"Error synthesizing speech for '{output_filename}': {str(e)}")
            raise


def process_batch(
    batch, start_index, language_code, language_name, ssml_gender, total_segments
):
    """Process a batch of transcription segments."""
    temp_files = []
    futures = []

    with ThreadPoolExecutor(max_workers=16) as executor:
        for i, segment in enumerate(batch):
            global_index = start_index + i
            print(f"Processing segment {global_index + 1}/{total_segments}")
            temp_file = f"temp_audio_{global_index}.mp3"

            future = executor.submit(
                synthesize_speech,
                segment["text"],
                temp_file,
                language_code,
                language_name,
                ssml_gender,
            )
            futures.append(future)
            temp_files.append(temp_file)

        # Wait for all futures in this batch to complete
        for future in as_completed(futures):
            try:
                future.result()  # This will raise any exceptions from the task
            except Exception as e:
                print(f"A task in the batch failed: {str(e)}")
                # Continue processing other files, don't raise here

    return temp_files


def generate_tts(video_path, language_code, language_name, ssml_gender, transcription):
    try:
        # Get video duration
        video_clip = VideoFileClip(video_path)
        video_duration = video_clip.duration
        video_clip.close()

        final_audio = AudioSegment.silent(duration=0)
        all_temp_files = []

        # Process in smaller batches to avoid overwhelming the gRPC service
        batch_size = 10
        for batch_start in range(0, len(transcription), batch_size):
            batch_end = min(batch_start + batch_size, len(transcription))
            batch = transcription[batch_start:batch_end]

            # Process each batch and collect temp files
            temp_files = process_batch(
                batch,
                batch_start,
                language_code,
                language_name,
                ssml_gender,
                len(transcription),
            )
            all_temp_files.extend(temp_files)

            # Optional: Add a small delay between batches to prevent rate limiting
            if batch_end < len(transcription):
                time.sleep(1)

        # Combine all audio segments
        successful_files = []
        for temp_file in all_temp_files:
            if os.path.exists(temp_file) and os.path.getsize(temp_file) > 0:
                try:
                    current_segment = AudioSegment.from_file(temp_file)
                    final_audio += current_segment
                    successful_files.append(temp_file)
                except Exception as e:
                    print(f"Error processing {temp_file}: {str(e)}")

        # Adjust audio speed to match video duration
        audio_duration = len(final_audio) / 1000
        speed_factor = video_duration / audio_duration
        print(
            f"Speed Factor: {speed_factor} and Video duration: {video_duration} and Audio duration: {audio_duration}"
        )

        # Adjust audio speed to match video length
        # final_audio = final_audio.speedup(playback_speed=speed_factor)
        final_output_path = os.path.join(
            os.path.dirname(video_path), "final_output.mp3"
        )
        final_audio.export(final_output_path, format="mp3")
        print(f"Adjusted audio saved to {final_output_path}")

        # Clean up temporary files
        for temp_file in successful_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except Exception as e:
                print(f"Error removing temporary file {temp_file}: {str(e)}")

        return final_output_path, speed_factor

    except Exception as e:
        print(f"Error generating TTS: {str(e)}")
        raise


def combine_video_audio(
    video_path,
    transcription,
    output_path,
    subtitle_path,
    language_code=None,
    language_name=None,
    ssml_gender=None,
):
    # Define mappings for languages, their codes, and available voices
    LANGUAGE_MAPPINGS = {
        "english": {
            "code": "en-US",
            "voices": {"male": "en-US-Neural2-J", "female": "en-US-Neural2-F"},
        },
        "french": {
            "code": "fr-FR",
            "voices": {"male": "fr-FR-Standard-D", "female": "fr-FR-Standard-C"},
        },
        "german": {
            "code": "de-DE",
            "voices": {"male": "de-DE-Standard-G", "female": "de-DE-Standard-D"},
        },
        "tamil": {
            "code": "ta-IN",
            "voices": {"male": "ta-IN-Standard-D", "female": "ta-IN-Standard-A"},
        },
        # Add more languages as needed
    }

    # Process language_name from payload (case-insensitive)
    language = language_name.lower() if language_name else "english"

    # Get gender from parameter or use default
    gender = ssml_gender.lower() if ssml_gender else "male"

    # Determine correct values based on the inputs
    if language in LANGUAGE_MAPPINGS:
        language_data = LANGUAGE_MAPPINGS[language]
        selected_code = language_data["code"]

        if gender in language_data["voices"]:
            selected_voice = language_data["voices"][gender]
        else:
            # Default to first available voice if gender not found
            selected_voice = list(language_data["voices"].values())[0]
    else:
        # Fallback to default values if language not found
        selected_code = "en-US"
        selected_voice = "en-US-Neural2-J"

    # Now use the dynamically selected values in your function
    print(f"Processing {language}: using code {selected_code}, voice {selected_voice}")

    try:
        # Generate TTS audio
        audio_path, speed_factor = generate_tts(
            video_path, selected_code, selected_voice, gender, transcription
        )

        # Prepare FFmpeg command based on whether subtitles are provided
        # if subtitle_path and os.path.exists(subtitle_path):
        #     # FFmpeg command with subtitles
        #     ffmpeg_command = [
        #         "ffmpeg",
        #         "-i",
        #         video_path,  # Input video
        #         "-i",
        #         audio_path,  # Input audio
        #         "-c:v",
        #         "libx264",  # Video codec
        #         "-c:a",
        #         "aac",  # Audio codec
        #         "-vf",
        #         f"subtitles='{subtitle_path.replace('\\', '/')}'",  # Add subtitles
        #         "-map",
        #         "0:v",  # Map video stream
        #         "-map",
        #         "1:a",  # Map audio stream
        #         "-shortest",  # Ensure output matches the shortest input
        #         output_path,  # Output file
        #     ]
        # else:
        #     # FFmpeg command without subtitles
        #     ffmpeg_command = [
        #         "ffmpeg",
        #         "-i",
        #         video_path,  # Input video
        #         "-i",
        #         audio_path,  # Input audio
        #         "-c:v",
        #         "copy",  # Copy video stream
        #         "-c:a",
        #         "aac",  # Audio codec
        #         "-shortest",  # Ensure output matches the shortest input
        #         output_path,  # Output file
        #     ]
        if subtitle_path and os.path.exists(subtitle_path):
            # FFmpeg command with subtitles and audio speed adjustment
            ffmpeg_command = [
                "ffmpeg",
                "-i",
                video_path,  # Input video
                "-i",
                audio_path,  # Input audio
                "-c:v",
                "libx264",  # Video codec
                "-c:a",
                "aac",  # Audio codec
                "-filter:a",
                f"atempo={speed_factor}",  # Adjust audio speed
                "-vf",
                f"subtitles='{subtitle_path.replace('\\', '/')}'",  # Add subtitles
                "-map",
                "0:v",  # Map video stream
                "-map",
                "1:a",  # Map audio stream
                "-shortest",  # Ensure output matches the shortest input
                output_path,  # Output file
            ]
        else:
            # FFmpeg command without subtitles but with audio speed adjustment
            ffmpeg_command = [
                "ffmpeg",
                "-i",
                video_path,  # Input video
                "-i",
                audio_path,  # Input audio
                "-c:v",
                "copy",  # Copy video stream
                "-c:a",
                "aac",  # Audio codec
                "-filter:a",
                f"atempo={speed_factor}",  # Adjust audio speed
                "-shortest",  # Ensure output matches the shortest input
                output_path,  # Output file
            ]
        # Execute the FFmpeg command
        try:
            subprocess.run(ffmpeg_command, check=True)
            print(f"Video and audio combined successfully: {output_path}")
        except subprocess.CalledProcessError as e:
            print(f"Error running FFmpeg: {str(e)}")
            # Try alternate command if the first fails (handling path issues)
            alt_command = ffmpeg_command.copy()
            if subtitle_path:
                alt_command[9] = f"subtitles={subtitle_path.replace('\\', '/')}"

            subprocess.run(alt_command, check=True)
            print(
                f"Video and audio combined successfully with alternate command: {output_path}"
            )

        return output_path

    except subprocess.CalledProcessError as e:
        print(f"Error combining video and audio: {str(e)}")
        raise
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise


if __name__ == "__main__":
    # Example usage
    video_path = "C:\\Users\\HP\\Desktop\\project\\EduVerseAI\\video-processor\\references\\Claude37.mp4"
    # Load the transcription from the JSON file
    input_file = "C:\\Users\\HP\\Desktop\\project\\EduVerseAI\\video-processor\\phase_1\\utils\\transcript_translated.json"
    with open(input_file, "r", encoding="utf-8") as f:
        transcript_data = json.load(f)

    # Normalize transcript format
    transcription = [
        {
            "start_time": entry["start_time"],
            "end_time": entry["end_time"],
            "text": entry["text"],
        }
        for entry in transcript_data
    ]
    output_path = "output_video.mp4"
    subtitle_path = "output.srt"

    try:
        # Set a longer timeout for each request
        combine_video_audio(
            video_path, transcription, output_path, subtitle_path=subtitle_path
        )
    except Exception as e:
        print(f"Main process failed: {str(e)}")
