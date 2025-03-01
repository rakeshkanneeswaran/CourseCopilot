import json
# Convert time from seconds to hh:mm:ss,ms format
def convert_time(seconds):
    seconds = float(seconds.replace('s', ''))
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = seconds % 60
    milliseconds = int((seconds - int(seconds)) * 1000)
    return f"{hours:02}:{minutes:02}:{int(seconds):02},{milliseconds:03}"

# Convert JSON to SRT format
def convert_to_srt(data):
    srt_content = ""
    for i, entry in enumerate(data):
        start_time = convert_time(entry['start_time'])
        end_time = convert_time(entry['end_time'])
        srt_content += f"{i+1}\n"
        srt_content += f"{start_time} --> {end_time}\n"
        srt_content += f"{entry['text']}\n\n"
    return srt_content

def generate_srt(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        text_data = file.read()

    data = json.loads(text_data)
    srt_content = convert_to_srt(data)


    with open("output.srt", "w", encoding="utf-8") as file:
        file.write(srt_content)

    print("SRT file created successfully.")
