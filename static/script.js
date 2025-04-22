let quiz = { metadata: {}, tasks: [], thresholds: [] };

function $(id) { return document.getElementById(id); }

async function loadQuiz() {
  const res = await fetch('/load'); quiz = await res.json();
  renderUI(); renderPreview();
}

function saveQuiz() {
  collectUI(); fetch('/save', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(quiz)
  });
}

function collectUI() {
  quiz.metadata = {
    title: $('title').value,
    student: $('student').value,
    class: $('class').value,
    date: $('date').value,
    type: $('type').value
  };
  // tasks & thresholds auto-updated on interactions
}

function renderUI() {
  // metadata
  $('title').value = quiz.metadata.title || '';
  $('student').value = quiz.metadata.student || '';
  $('class').value = quiz.metadata.class || '';
  $('date').value = quiz.metadata.date || '';
  $('type').value = quiz.metadata.type || 'Kartkówka';

  // tasks list
  const tl = $('task-list'); tl.innerHTML = '';
  quiz.tasks.forEach((t,i) => {
    const li = document.createElement('li');
    li.textContent = `${i+1}. ${t.content.slice(0,30)}`;
    tl.appendChild(li);
  });
  Sortable.create(tl, { animation:150, onEnd: e=>{
    const moved = quiz.tasks.splice(e.oldIndex,1)[0];
    quiz.tasks.splice(e.newIndex,0,moved);
    renderPreview();
  }});

  // thresholds
  const thr = $('thresholds'); thr.innerHTML = '';
  quiz.thresholds.forEach(g=>{
    const div = document.createElement('div');
    div.textContent = `${g.label}: ${g.cutoff}%`;
    thr.appendChild(div);
  });
}

function renderPreview() {
  const p = $('preview'); p.innerHTML = '';
  // header
  const h = document.createElement('div'); h.className='quiz-header';
  h.innerHTML = `<h1>${quiz.metadata.title}</h1>
    <p>${quiz.metadata.student} — ${quiz.metadata.class}</p>
    <p>${quiz.metadata.date} — ${quiz.metadata.type}</p>`;
  p.appendChild(h);

  // tasks
  quiz.tasks.forEach(t=>{
    const tb = document.createElement('div'); tb.className='task-box';
    tb.innerHTML = `<p>${t.content}</p><div style="height:${t.answer_height}px"></div>`;
    p.appendChild(tb);
  });

  // grade table (optional)
}

window.addEventListener('DOMContentLoaded', ()=>{
  $('save-btn').onclick = ()=>{ saveQuiz(); };
  $('pdf-btn').onclick = async ()=>{
    collectUI();
    const res = await fetch('/generate_pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(quiz)});
    const blob = await res.blob(); open(URL.createObjectURL(blob));
  };
  $('ans-btn').onclick = async ()=>{
    collectUI();
    const res = await fetch('/generate_answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(quiz)});
    const blob = await res.blob(); open(URL.createObjectURL(blob));
  };
  $('add-task').onclick = ()=>{
    quiz.tasks.push({ content:'New task', image:'', points:1, answer_height:80 });
    renderUI(); renderPreview();
  };
  $('add-grade').onclick = ()=>{
    const label = prompt('Grade label (e.g. 5)');
    const cutoff = prompt('Cutoff % (e.g. 85)');
    quiz.thresholds.push({ label, cutoff: Number(cutoff) });
    renderUI(); renderPreview();
  };
  loadQuiz();
});