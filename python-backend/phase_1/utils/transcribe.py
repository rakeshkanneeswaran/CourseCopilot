import os
import whisper
from moviepy.editor import VideoFileClip

def format_transcriptions(transcriptions):
    """
    Format the transcriptions into a structured list with timestamps and text.
    """
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
    """
    Transcribe a video file and generate timestamps for the transcription.
    
    Args:
        video_path (str): Path to the video file.
        model: Whisper model for transcription.
    
    Returns:
        list: Formatted transcription with timestamps.
    """
    try:
        # Extract audio from video
        video_clip = VideoFileClip(video_path)
        print("Extracted video clip")
        audio_clip = video_clip.audio
        audio_output_path = "output_audio.mp3"
        audio_clip.write_audiofile(audio_output_path)
        print(f"Audio extracted and saved to {audio_output_path}")
        audio_clip.close()
        video_clip.close()

        # Transcribe audio using Whisper
        print("Starting transcription...")
        result = model.transcribe(audio_output_path)
        print("Transcription completed")
        transcription_segments = result.get("segments", [])

        # Format transcription with timestamps
        transcription_filtered = format_transcriptions(transcription_segments)

        # Clean up the audio file after processing
        os.remove(audio_output_path)
        print("Cleaned up temporary audio file")

        return transcription_filtered

    except Exception as e:
        print(f"Error during transcription: {str(e)}")
        raise

def generate_transcript(video_path, output_path):
    """
    Generate a transcript for a video and save it to a JSON file.
    
    Args:
        video_path (str): Path to the video file.
        output_path (str): Path to save the transcript JSON file.
    """
    try:
        # Load Whisper model
        model = whisper.load_model("base")
        print("Whisper model loaded")

        # Transcribe video with timestamps
        transcript = transcribe_video_with_timestamps(video_path, model)
        print("Transcript generated")

        # Save transcript to JSON file
        import json
        with open(output_path, "w") as f:
            json.dump(transcript, f, indent=4)
        print(f"Transcript saved to {output_path}")

    except Exception as e:
        print(f"Error generating transcript: {str(e)}")
        raise