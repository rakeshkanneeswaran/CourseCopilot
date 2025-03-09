import os
import subprocess
from pydub import AudioSegment
from moviepy.video.io.VideoFileClip import VideoFileClip
from google.cloud import texttospeech
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


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
            language_code=language_code, name=language_name, ssml_gender=gender_enum
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
    try:
        video_clip = VideoFileClip(video_path)
        video_duration = video_clip.duration
        video_clip.close()

        final_audio = AudioSegment.silent(duration=0)
        temp_files = []

        # Use a thread pool to limit concurrent requests
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = []
            for i, segment in enumerate(transcription):
                print(f"Processing segment {i + 1}/{len(transcription)}")
                temp_file = f"temp_audio_{i}.mp3"
                futures.append(
                    executor.submit(
                        synthesize_speech,
                        segment["text"],
                        temp_file,
                        language_code,
                        language_name,
                        ssml_gender,
                    )
                )
                temp_files.append(temp_file)

            # Wait for all futures to complete
            for future in as_completed(futures):
                future.result()  # Raise any exceptions

        # Combine all audio segments
        for temp_file in temp_files:
            current_segment = AudioSegment.from_file(temp_file)
            final_audio += current_segment
        audio_duration = len(final_audio) / 1000
        speed_factor = video_duration / audio_duration
        print(f"Speed Factor : {speed_factor} and Video : {video_duration} and Audio : {audio_duration}" )
        
        final_audio = final_audio.speedup(playback_speed = speed_factor)
        # Export the final combined audio
        final_output_path = os.path.join(
            os.path.dirname(video_path), "final_output.mp3"
        )
        final_audio.export(final_output_path, format="mp3")
        print(f"Adjusted audio saved to {final_output_path}")
        # Export the final combined audio
        # final_output_path = os.path.join(
        #     os.path.dirname(video_path), "final_output.mp3"
        # )
        # final_audio.export(final_output_path, format="mp3")
        # print(f"Final audio saved to {final_output_path}")

        # Clean up temporary files
        for temp_file in temp_files:
            os.remove(temp_file)

        return final_output_path

    except Exception as e:
        print(f"Error generating TTS: {str(e)}")
        raise


# def generate_tts(video_path, language_code, language_name, ssml_gender, transcription):
#     """
#     Generate TTS audio for each line in the transcription and combine it into a single audio file.

#     Args:
#         video_path (str): Path to the input video file.
#         language_code (str): Language code for TTS (e.g., "en-US").
#         language_name (str): Voice name for TTS (e.g., "en-US-Wavenet-D").
#         ssml_gender (str): Gender of the voice ("male" or "female").
#         transcription (list): List of transcription segments with text and timestamps.

#     Returns:
#         str: Path to the final combined audio file.
#     """
#     try:
#         # Load the video to get its duration
#         video_clip = VideoFileClip(video_path)
#         video_duration = video_clip.duration
#         video_clip.close()

#         # Initialize final audio as silence
#         final_audio = AudioSegment.silent(duration=0)
#         temp_files = []

#         # Process each transcription segment
#         for i, segment in enumerate(transcription):
#             print(f"Processing segment {i + 1}/{len(transcription)}")
#             # Generate TTS for the text using Google Cloud Text-to-Speech API
#             temp_file = f"temp_audio_{i}.mp3"
#             synthesize_speech(
#                 segment["text"], temp_file, language_code, language_name, ssml_gender
#             )
#             temp_files.append(temp_file)

#             # Load the generated audio and concatenate it to final audio
#             current_segment = AudioSegment.from_file(temp_file)
#             final_audio += current_segment

#             # Add silence between segments if applicable
#             # if i < len(transcription) - 1:
#             #     current_end = float(segment["end_time"].replace("s", "")) * 1000
#             #     next_start = (
#             #         float(transcription[i + 1]["start_time"].replace("s", "")) * 1000
#             #     )
#             #     silence_duration = next_start - current_end
#             #     silence = AudioSegment.silent(duration=max(silence_duration, 0))
#             #     final_audio += silence
#             time.sleep(5)
#         # Export the final combined audio
#         final_output_path = os.path.join(
#             os.path.dirname(video_path), "final_output.mp3"
#         )
#         final_audio.export(final_output_path, format="mp3")
#         print(f"Final audio saved to {final_output_path}")

#         # Clean up temporary files
#         for temp_file in temp_files:
#             os.remove(temp_file)

#         return final_output_path

#     except Exception as e:
#         print(f"Error generating TTS: {str(e)}")
#         raise


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
            "voices": {
                "male": "en-US-Neural2-J",
                "female": "en-US-Neural2-F"
            }
        },
        "french": {
            "code": "fr-FR",
            "voices": {
                "male": "fr-FR-Standard-D   ",
                "female": "fr-FR-Standard-C"
            }
        },
        "german": {
            "code": "de-DE",
            "voices": {
                "male": "de-DE-Standard-G",
                "female": "de-DE-Standard-D"
            }
        },
        "tamil": {
            "code": "ta-IN",
            "voices": {
                "male": "ta-IN-Standard-D",
                "female": "ta-IN-Standard-A"
            }
        }
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
    
    # Rest of your implementation using selected_code and selected_voice
    # ...
    
    # Now use the dynamically selected values in your function
    # Rest of your implementation...
    try:
        # Generate TTS audio
        audio_path = generate_tts(
            video_path, selected_code, selected_voice, gender, transcription
        )
        # Calculate the speed factor to match audio duration to video duration


        # Prepare FFmpeg command based on whether subtitles are provided
        if subtitle_path:
            # FFmpeg command with subtitles
            ffmpeg_command = [
                "ffmpeg",
                "-i",
                video_path,  # Input video
                "-i",
                audio_path,  # Input audio
                "-i",
                subtitle_path,  # Input subtitles
                "-c:v",
                "libx264",  # Video codec
                "-c:a",
                "aac",  # Audio codec
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
            # FFmpeg command without subtitles
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
                "-shortest",  # Ensure output matches the shortest input
                output_path,  # Output file
            ]

        # Execute the FFmpeg command
        subprocess.run(ffmpeg_command, check=True)
        print(f"Video and audio combined successfully: {output_path}")

        # Clean up the generated audio file

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
    combine_video_audio(
        video_path, transcription, output_path, subtitle_path=subtitle_path
    )
