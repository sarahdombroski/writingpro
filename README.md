# 📝 Writing Pro – AI-Powered Writing Assistant

Writing Pro is a simple, intuitive writing environment that helps writers stay focused, save their work, and get real-time grammar and style feedback — all in one place. Built with Flask and Python, it offers a clean interface, local draft saving, and smart writing suggestions to boost creativity and clarity.

---

## 🚀 Features

- 🖊️ **Clean Writing Interface** – A distraction-free editor to write and format your thoughts.
- 📁 **Draft Viewer** – See all your saved works and open past drafts for editing.
- ✅ **Grammar & Style Feedback** – Real-time suggestions using `language_tool_python`.
- ⚙️ **Custom Editor Settings** – Change themes, font size, and interface preferences (saved in localStorage).
- 📤 **Export Writing** – Save your work for later or download as plain text (PDF or TXT file).
- 🌀 **Generators** – Generate prompts, names, and tropes to get ideas for your writing.
- 🔊 **Text to Speech** – Listen to your writing as you go, to help catch wording issues.

---

## 🛠️ Built With

| Tech | Role |
|------|------|
| 🐍 Python + Flask | Backend + Routing |
| 🧠 language_tool_python | Grammar/style suggestions |
| 💾 SQLite | Local database for storing drafts |
| 🎨 HTML, CSS, JavaScript | Frontend + User interaction |
| 📦 Bootstrap | Styling and layout framework |
| 🌐 Render | Deployment platform (free tier) |

---

## 📂 Project Structure
- /templates → HTML templates (Jinja2)
- /static → CSS and JavaScript
- app.py → Main Flask application
- works.db → SQLite database file
- requirements.txt → Python dependencies
- render.yaml → Render deployment config
- .gitignore
- README.md


---

## 🧪 Running the Project Locally

### 1. Clone the repository
```bash
git clone https://github.com/sarahdombroski/writingpro.git
cd writingpro 
```
### 2. Clone the repository
```bash
python -m venv venv
source venv/bin/activate  
# or venv\Scripts\activate on Windows
```
### 3. Install dependencies
```bash
pip install -r requirements.txt
```
### 4. Run the Flask App
```bask
flask run
```
Then open your local server in your browser.

---

## 🌍 Live Demo

🔗 View the live app here

---

## 📜 License

This project is for educational and portfolio use. If you plan to build on it commercially, please credit or fork accordingly.

---

## Credits
Created by: Sarah Dombroski

Special thanks to: langauge_tool for grammar feedback support.