from flask import Flask, render_template, jsonify, request, send_file
from weasyprint import HTML, CSS
import json, io, os

app = Flask(
    __name__,
    static_folder='static',
    template_folder='templates'
)
DATA_FILE = 'quiz.json'


def load_quiz():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    # default structure
    return { 'metadata': {}, 'tasks': [], 'thresholds': [] }


def save_quiz(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route('/')
def index():
    # initial page load; data is fetched via /load in JS
    return render_template('index.html')


@app.route('/load')
def load_data():
    return jsonify(load_quiz())


@app.route('/save', methods=['POST'])
def save_data():
    payload = request.get_json()
    save_quiz(payload)
    return ('', 204)


@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    quiz = request.get_json()
    html = render_template('index.html', quiz=quiz, answer_mode=False)
    pdf_bytes = HTML(string=html, base_url=request.host_url).write_pdf(
        stylesheets=[CSS(filename='static/style.css')]
    )
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        download_name='quiz.pdf'
    )


@app.route('/generate_answer', methods=['POST'])
def generate_answer():
    quiz = request.get_json()
    html = render_template('index.html', quiz=quiz, answer_mode=True)
    pdf_bytes = HTML(string=html, base_url=request.host_url).write_pdf(
        stylesheets=[CSS(filename='static/style.css')]
    )
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        download_name='answer_sheet.pdf'
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)