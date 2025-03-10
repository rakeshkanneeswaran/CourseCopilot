import os

import vertexai
from vertexai.generative_models import (
    GenerationConfig,
    GenerativeModel,
    HarmBlockThreshold,
    HarmCategory,
    Part,
)

PROJECT_ID = "gen-lang-client-0666499294"  # @param {type: "string", placeholder: "[your-project-id]", isTemplate: true}
if not PROJECT_ID or PROJECT_ID == "[your-project-id]":
    PROJECT_ID = str(os.environ.get("GOOGLE_CLOUD_PROJECT"))

LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "us-central1")

vertexai.init(project=PROJECT_ID, location=LOCATION)

MODEL_ID = "gemini-1.5-flash-002"  # @param {type:"string"}

model = GenerativeModel(MODEL_ID)

# Load a example model with system instructions
example_model = GenerativeModel(
    MODEL_ID,
    system_instruction=[
        "You are a helpful language translator.",
        "Your mission is to translate text in English to Hindi where I will provide you a json format data which contains start_time, end_time, text, and confidence.",
        "The output should be in the same format where the text is only modified and all other are kept the same."
    ],
)

# Set model parameters
generation_config = GenerationConfig(
    temperature=0.9,
    top_p=1.0,
    top_k=32,
    candidate_count=1,
    max_output_tokens=8192,
)

# Set safety settings
safety_settings = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
}

prompt = """
  User input: [{'id': 0, 'start_time': '0.14s', 'end_time': '8.10s', 'text': ' If you are learning English, then of course you want to learn the English that will be the most useful,', 'confidence': 0.919}, {'id': 1, 'start_time': '8.78s', 'end_time': '16.78s', 'text': ' that will allow you to communicate with as many people as possible. So a type of English called', 'confidence': 0.907}, {'id': 2, 'start_time': '17.24s', 'end_time': '25.15s', 'text': ' standard English seems very attractive. Especially when you are told that this is the type of', 'confidence': 0.951}, {'id': 3, 'start_time': '25.15s', 'end_time': '33.78s', 'text': ' English that is used at schools, in dictionaries, by news readers, and even the smart assistant', 'confidence': 0.891}, {'id': 4, 'start_time': '33.98s', 'end_time': '42.50s', 'text': ' on your telephone. But what exactly is standard English and how can you use it to communicate', 'confidence': 0.955}, {'id': 5, 'start_time': '42.50s', 'end_time': '50.78s', 'text': ' successfully with anyone in English? To answer this question, we need to go back in time about', 'confidence': 0.956}, {'id': 6, 'start_time': '50.94s', 'end_time': '64.52s', 'text': ' 500 years. This was a time of great revolution in the English language, especially written English.', 'confidence': 0.959}, {'id': 7, 'start_time': '65.08s', 'end_time': '73.46s', 'text': ' Before this time, books were only created and read by academics and scholars, and they were', 'confidence': 0.962}, {'id': 8, 'start_time': '73.60s', 'end_time': '82.60s', 'text': ' rare and expensive. But with advances in technology, books became cheaper and easier to make,', 'confidence': 0.972}, {'id': 9, 'start_time': '83.38s', 'end_time': '91.50s', 'text': ' and as more people were being educated, more people could read. So books started to become available', 'confidence': 0.945}, {'id': 10, 'start_time': '91.88s', 'end_time': '98.52s', 'text': ' to the general public for the first time. And this revealed some problems.', 'confidence': 0.979}, {'id': 11, 'start_time': '99.82s', 'end_time': '107.72s', 'text': ' Firstly, there were no good reference materials for readers to find the meanings of unknown words.', 'confidence': 0.981}, {'id': 12, 'start_time': '109.00s', 'end_time': '118.30s', 'text': ' Secondly, English spelling was not fixed. The word neighbor had various spellings, and attitudes', 'confidence': 0.874}, {'id': 13, 'start_time': '118.50s', 'end_time': '127.66s', 'text': ' towards spelling were much more relaxed, so books would even mix different spellings in the same sentence.', 'confidence': 0.967}, {'id': 14, 'start_time': '128.90s', 'end_time': '137.42s', 'text': ' And finally, there was a lot of regional variation in the usage of vocabulary and grammar.', 'confidence': 0.985}, {'id': 15, 'start_time': '138.66s', 'end_time': '147.84s', 'text': ' To try and fix these problems, in 1746, a group of the most successful booksellers in London', 'confidence': 0.974}, {'id': 16, 'start_time': '148.30s', 'end_time': '156.86s', 'text': ' hired Samuel Johnson to make an English dictionary. The idea was that this dictionary would create', 'confidence': 0.968}, {'id': 17, 'start_time': '157.32s', 'end_time': '169.35s', 'text': ' a standard for the English language. When his dictionary was published in 1755, it had more than 42,000', 'confidence': 0.925}, {'id': 18, 'start_time': '169.35s', 'end_time': '179.87s', 'text': " entries and contained key decisions about word spellings, meanings, and usage. It's impact on the", 'confidence': 0.869}, {'id': 19, 'start_time': '179.87s', 'end_time': '189.60s', 'text': ' English language was enormous, and it remains today, one of the most remarkable scholarly achievements', 'confidence': 0.955}, {'id': 20, 'start_time': '189.94s', 'end_time': '198.48s', 'text': ' in history by a single man. Let me repeat that by a single man.', 'confidence': 0.978}, {'id': 21, 'start_time': '200.10s', 'end_time': '208.72s', 'text': " Now, let's talk about another man, Lord Reef. He was responsible for the creation and", 'confidence': 0.895}, {'id': 22, 'start_time': '208.86s', 'end_time': '218.60s', 'text': ' direction of the BBC, the oldest and largest broadcaster in the world. He described himself as', 'confidence': 0.936}, {'id': 23, 'start_time': '218.66s', 'end_time': '229.10s', 'text': ' a benevolent dictator. One of the key decisions he made was the accent that would be used by the BBC.', 'confidence': 0.943}, {'id': 24, 'start_time': '230.46s', 'end_time': '237.62s', 'text': ' Here he is explaining the reasons behind his decision. What I tried to get was', 'confidence': 0.884}, {'id': 25, 'start_time': '239.26s', 'end_time': '248.56s', 'text': ' a style or quality of English, which would not be laughed at in any part of the country.', 'confidence': 0.957}, {'id': 26, 'start_time': '248.76s', 'end_time': '257.20s', 'text': ' But the interesting point in terms of social history is that this particular accent,', 'confidence': 0.926}, {'id': 27, 'start_time': '258.48s', 'end_time': '269.48s', 'text': ' which the BBC produced, somehow identified the BBC with a certain section of society,', 'confidence': 0.914}, {'id': 28, 'start_time': '269.92s', 'end_time': '278.23s', 'text': ' certain social trends. So that to this day, the BBC is thought of as the organ of the', 'confidence': 0.917}, {'id': 29, 'start_time': '278.23s', 'end_time': '284.84s', 'text': ' as it were, gentile and respectable elements in society. And then wrong with that?', 'confidence': 0.657}, {'id': 30, 'start_time': '286.28s', 'end_time': '293.02s', 'text': ' Well, except that after all the people who speak in this standard way, are in fact a minority.', 'confidence': 0.868}, {'id': 31, 'start_time': '293.90s', 'end_time': '303.52s', 'text': ' As the power and influence of the BBC grew, so did the power and influence of the accent he chose.', 'confidence': 0.942}, {'id': 32, 'start_time': '304.46s', 'end_time': '311.98s', 'text': " It's fair to say that he single-handedly influenced the sound of English for generations.", 'confidence': 0.936}, {'id': 33, 'start_time': '313.06s', 'end_time': '323.94s', 'text': ' Again, the decision of a single man. But they are not the first and they will not be the last examples.', 'confidence': 0.932}, {'id': 34, 'start_time': '324.92s', 'end_time': '331.72s', 'text': ' People are told not to end their sentences with prepositions by this guy in 1672.', 'confidence': 0.961}, {'id': 35, 'start_time': '332.36s', 'end_time': '340.04s', 'text': ' Scottish and Irish people are told that their accent is offensive and disgusting by this guy in', 'confidence': 0.878}, {'id': 36, 'start_time': '340.04s', 'end_time': '347.64s', 'text': ' 1803. People are told never to use the passive voice by this guy in 1959.', 'confidence': 0.978}, {'id': 37, 'start_time': '349.00s', 'end_time': '357.44s', 'text': " And EU politicians are told to stop using words that don't exist by this guy in 2016.", 'confidence': 0.987}, {'id': 38, 'start_time': '358.62s', 'end_time': '370.38s', 'text': " I hope you're seeing a pattern here, the single man. But over time, their influence has created", 'confidence': 0.886}, {'id': 39, 'start_time': '370.48s', 'end_time': '381.68s', 'text': ' something which is packaged and sold as standard English. The word standard suggests that there is', 'confidence': 0.9}, {'id': 40, 'start_time': '381.90s', 'end_time': '389.04s', 'text': ' one type of English that is accepted and used by the majority of people.', 'confidence': 0.992}, {'id': 41, 'start_time': '390.38s', 'end_time': '401.28s', 'text': ' That is total standard English is nothing more than a collection of opinions and prejudices', 'confidence': 0.927}, {'id': 42, 'start_time': '401.62s', 'end_time': '410.90s', 'text': " of powerful people. Samuel Johnson's dictionary didn't contain the words unique or", 'confidence': 0.877}, {'id': 43, 'start_time': '411.12s', 'end_time': '418.70s', 'text': " champagne because he personally didn't like French words. Great standard.", 'confidence': 0.932}, {'id': 44, 'start_time': '420.30s', 'end_time': '429.79s', 'text': ' That accent that Lord Reef chose for the BBC and that is used in the dictionary is what is called', 'confidence': 0.841}, {'id': 45, 'start_time': '429.79s', 'end_time': '438.48s', 'text': " a social accent which means that it doesn't specify where you are from but instead that you have", 'confidence': 0.87}, {'id': 46, 'start_time': '438.62s', 'end_time': '448.46s', 'text': " money, power and influence. And as a result, it's estimated to be spoken by less than 3% of people", 'confidence': 0.944}, {'id': 47, 'start_time': '448.94s', 'end_time': '459.80s', 'text': " in the UK. It's the furthest possible thing from standard. Now, let me answer some questions that", 'confidence': 0.936}, {'id': 48, 'start_time': '459.94s', 'end_time': '466.86s', 'text': ' I know you have. Is there a standard English accent that everyone can understand?', 'confidence': 0.988}, {'id': 49, 'start_time': '468.14s', 'end_time': '480.16s', 'text': ' No. Is there a standard English grammar? Also no. But what about standard vocabulary? Again, no.', 'confidence': 0.877}, {'id': 50, 'start_time': '481.24s', 'end_time': '489.36s', 'text': " But you don't have to take my word for it. Many linguists have dedicated their entire lives", 'confidence': 0.968}, {'id': 51, 'start_time': '489.72s', 'end_time': '496.72s', 'text': ' to documenting and researching language variation and the evidence is clear.', 'confidence': 0.969}, {'id': 52, 'start_time': '498.28s', 'end_time': '506.72s', 'text': " But what does this mean for you as a learner? What English should you learn? Aren't you lost", 'confidence': 0.924}, {'id': 53, 'start_time': '506.88s', 'end_time': '516.94s', 'text': ' without a standard? The reality is that standard English is different for each person and now that', 'confidence': 0.916}, {'id': 54, 'start_time': '516.94s', 'end_time': '526.74s', 'text': ' English is a true global language, that is even more true. If your a doctor, your standard', 'confidence': 0.886}, {'id': 55, 'start_time': '527.56s', 'end_time': '534.48s', 'text': " English might contain things like interrictal pseudo dementia. But if you're a cycling fan,", 'confidence': 0.774}, {'id': 56, 'start_time': '534.74s', 'end_time': '543.70s', 'text': ' it might contain things like broomwagon and your accent will always reflect your identity.', 'confidence': 0.922}, {'id': 57, 'start_time': '545.60s', 'end_time': '554.90s', 'text': ' We often think that language comes from places of authority like teachers and grammar books', 'confidence': 0.938}, {'id': 58, 'start_time': '555.12s', 'end_time': '564.96s', 'text': " and dictionaries and then we learn it. But it's the exact opposite. Language comes from us", 'confidence': 0.945}, {'id': 59, 'start_time': '565.70s', 'end_time': '576.42s', 'text': ' from our human experiences and then authority tries to control it. But your language ability', 'confidence': 0.939}, {'id': 60, 'start_time': '576.86s', 'end_time': '586.52s', 'text': ' can never be judged or measured by comparing it with an invented standard. The only true measure', 'confidence': 0.948}, {'id': 61, 'start_time': '586.74s', 'end_time': '596.90s', 'text': ' of language ability is successful communication. Language gives you the permission to be truly', 'confidence': 0.914}, {'id': 62, 'start_time': '596.90s', 'end_time': '606.54s', 'text': ' authentic to express yourself using the words and sounds that represent your life experiences.', 'confidence': 0.964}, {'id': 63, 'start_time': '608.02s', 'end_time': '617.44s', 'text': " Don't let the opinions and prejudices of others stop you from participating in the democracy of", 'confidence': 0.939}, {'id': 64, 'start_time': '619.42s', 'end_time': '623.66s', 'text': " language. I'm Christian. This is Kangaroo English and I'll see you in class.", 'confidence': 0.937}]
  Answer:
"""

# Set contents to send to the model
contents = [prompt]

# Counts tokens
print(example_model.count_tokens(contents))

# Prompt the model to generate content
response = example_model.generate_content(
    contents,
    generation_config=generation_config,
    safety_settings=safety_settings,
)

# Print the model response
print(f"\nAnswer:\n{response.text}")
print(f'\nUsage metadata:\n{response.to_dict().get("usage_metadata")}')
print(f"\nFinish reason:\n{response.candidates[0].finish_reason}")
print(f"\nSafety settings:\n{response.candidates[0].safety_ratings}")