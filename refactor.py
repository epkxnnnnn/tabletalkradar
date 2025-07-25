import requests

API_KEY = "sk-1f0qeY9ulRAo7dBq1jka057IYo5QEH8ihmt6BrNCKE1hORTf"
API_URL = "https://api.moonshot.ai/v1/chat/completions"


def refactor_code(code):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "moonshot-v1-8k",
        "messages": [
            {"role": "system", "content": "You are a careful coding assistant. Refactor the following code to improve readability and maintainability, but do not change its behavior or break anything."},
            {"role": "user", "content": code}
        ],
        "temperature": 0.3,
        "max_tokens": 2048,
        "top_p": 1,
        "stream": False
    }
    response = requests.post(API_URL, headers=headers, json=data)
    return response.json()["choices"][0]["message"]["content"]

# Change the file path below to the Python file you want to refactor
file_path = "path/to/your/file.py"

with open(file_path) as f:
    code = f.read()

refactored = refactor_code(code)
print(refactored) 