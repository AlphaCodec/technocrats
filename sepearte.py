import openai

openai.api_key = "YOUR_KEY_HERE"

try:
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say Hello!"}
        ]
    )
    print(response['choices'][0]['message']['content'])
except Exception as e:
    print("❌ Error:", e)
