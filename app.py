from flask import Flask, render_template, request, redirect, jsonify
import sqlite3
import language_tool_python
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fallback-key-for-dev')

@app.route('/')
def index():
    conn = get_db_connection()
    works = conn.execute('SELECT * FROM works ORDER BY timestamp DESC').fetchall()
    conn.close()

    works = [dict(work) for work in works]
    last_work = works[0] if works else None
    recent_activity = works[1:] if len(works) > 1 else []

    for work in works:
        ts = work['timestamp']
        if ts:
            try:
                work['timestamp'] = datetime.datetime.strptime(ts, '%Y-%m-%d %H:%M:%S.%f')
            except ValueError:
                try:
                    work['timestamp'] = datetime.datetime.strptime(ts, '%Y-%m-%d %H:%M:%S')
                except Exception:
                    work['timestamp'] = None
        elif ts is None:
            work['timestamp'] = None
    
    total_word_count = 0
    longest_work = None
    max_word_count = 0
    for work in works:
        word_count = len(work['text'].split())
        total_word_count += word_count
        if word_count > max_word_count:
            max_word_count = word_count
            longest_work = work
    
    number_of_works = len(works)

    return render_template('index.html', last_work=last_work, recent_activity=recent_activity, total_word_count=total_word_count, number_of_works=number_of_works, longest_work=longest_work)

def get_db_connection():
    conn = sqlite3.connect('works.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/writingpage')
def writing_page():
    return render_template('writingpage.html')

@app.route('/generator')
def generator():
    return render_template('generator.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/mywritings')
def my_writings_page():
    conn = get_db_connection()
    works = conn.execute('SELECT * FROM works ORDER BY timestamp DESC').fetchall()
    conn.close()

    works = [dict(work) for work in works]

    for work in works:
        ts = work['timestamp']
        if ts:
            try:
                work['timestamp'] = datetime.datetime.strptime(ts, '%Y-%m-%d %H:%M:%S.%f')
            except ValueError:
                try:
                    work['timestamp'] = datetime.datetime.strptime(ts, '%Y-%m-%d %H:%M:%S')
                except Exception:
                    work['timestamp'] = None
        elif ts is None:
            work['timestamp'] = None

    return render_template('mywritings.html', works=works)


@app.route('/add', methods=['post'])
def add_work():
    title = request.form['title']
    text = request.form['text']
    timestamp = datetime.datetime.now()
    conn = get_db_connection()
    conn.execute('INSERT INTO works (title, text, timestamp) VALUES (?, ?, ?) ON CONFLICT(title) DO UPDATE SET text=excluded.text, timestamp=excluded.timestamp', (title, text, timestamp))
    conn.commit()
    conn.close()
    return redirect('/mywritings')

@app.route('/delete/<int:id>')
def delete_work(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM works WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return redirect('/mywritings')

@app.route('/edit/<int:id>')
def edit_work(id):
    conn = get_db_connection()
    work = conn.execute('SELECT * FROM works WHERE id = ?', (id,)).fetchone()
    conn.close()
    if work is None:
        return 'Work not found!', 404
    return render_template('writingpage.html', work=work)

@app.route('/update/<int:id>', methods=['Post'])
def update_work(id):
    title = request.form['title']
    text = request.form['text']
    timestamp = datetime.datetime.now()
    conn = get_db_connection()
    conn.execute('UPDATE works SET title = ?, text = ?, timestamp = ? WHERE id = ?', (title, text, timestamp, id))
    conn.commit()
    conn.close()
    return redirect('/mywritings')

@app.route('/check', methods=['Post'])
def check_work():
    tool = language_tool_python.LanguageTool('en-US')
    data = request.get_json()
    text = data.get('text', '')
    matches = tool.check(text)

    suggestions = []
    for match in matches:
        suggestions.append({
            'message': match.message,
            'replacements': match.replacements,
            'offset': match.offset,
            'length': match.errorLength,
            'context': match.context
        })

    return jsonify(suggestions=suggestions)


if __name__ == "__main__":
    app.run()