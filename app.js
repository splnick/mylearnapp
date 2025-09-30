const goalForm = document.querySelector('#goalForm');
const goalInput = document.querySelector('#goalInput');
const goalList = document.querySelector('#goalList');
const goalTemplate = document.querySelector('#goalTemplate');
const goalCount = document.querySelector('#goalCount');

const noteForm = document.querySelector('#noteForm');
const noteInput = document.querySelector('#noteInput');
const noteList = document.querySelector('#noteList');
const noteTemplate = document.querySelector('#noteTemplate');

const startTimerButton = document.querySelector('#startTimer');
const pauseTimerButton = document.querySelector('#pauseTimer');
const resetTimerButton = document.querySelector('#resetTimer');
const timerDisplay = document.querySelector('#timerDisplay');
const sessionStatus = document.querySelector('#sessionStatus');
const startSessionButton = document.querySelector('#startSession');

const STORAGE_KEYS = {
  goals: 'mylearnapp-goals',
  notes: 'mylearnapp-notes',
};

const defaultState = {
  goals: [],
  notes: [],
};

const state = loadState();

// Goal management
function loadState() {
  try {
    const goals = JSON.parse(localStorage.getItem(STORAGE_KEYS.goals)) ?? [];
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes)) ?? [];
    return { goals, notes };
  } catch (error) {
    console.error('Unable to load data from local storage', error);
    return { ...defaultState };
  }
}

function saveGoals() {
  localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(state.goals));
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(state.notes));
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = goalInput.value.trim();
  if (!value) return;

  state.goals.unshift({ id: createId(), text: value, completed: false });
  saveGoals();
  goalForm.reset();
  goalInput.focus();
  renderGoals();
});

goalList.addEventListener('change', (event) => {
  if (!event.target.matches('.goal__checkbox')) return;
  const listItem = event.target.closest('.goal');
  const goalId = listItem?.dataset.id;
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return;

  goal.completed = event.target.checked;
  saveGoals();
  renderGoals();
});

goalList.addEventListener('click', (event) => {
  if (!event.target.matches('.goal__remove')) return;
  const listItem = event.target.closest('.goal');
  const goalId = listItem?.dataset.id;
  if (!goalId) return;

  state.goals = state.goals.filter((goal) => goal.id !== goalId);
  saveGoals();
  renderGoals();
});

function renderGoals() {
  goalList.innerHTML = '';
  if (!state.goals.length) {
    goalList.innerHTML = '<li class="goal goal--empty">Add a goal to get started.</li>';
    goalCount.textContent = '0 goals remaining';
    return;
  }

  const fragment = document.createDocumentFragment();

  state.goals.forEach((goal) => {
    const template = goalTemplate.content.firstElementChild.cloneNode(true);
    const textElement = template.querySelector('.goal__text');
    const checkbox = template.querySelector('.goal__checkbox');

    template.dataset.id = goal.id;
    textElement.textContent = goal.text;
    checkbox.checked = goal.completed;
    if (goal.completed) {
      template.classList.add('goal--completed');
    }

    fragment.appendChild(template);
  });

  goalList.appendChild(fragment);
  const remaining = state.goals.filter((goal) => !goal.completed).length;
  const goalLabel = remaining === 1 ? 'goal' : 'goals';
  goalCount.textContent = `${remaining} ${goalLabel} remaining`;
}

// Notes management
noteForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = noteInput.value.trim();
  if (!value) return;

  const timestamp = new Date();
  state.notes.unshift({ id: createId(), text: value, createdAt: timestamp.toISOString() });
  saveNotes();
  noteForm.reset();
  noteInput.focus();
  renderNotes();
});

function renderNotes() {
  noteList.innerHTML = '';
  if (!state.notes.length) {
    noteList.innerHTML = '<li class="note note--empty">Write notes to capture insights.</li>';
    return;
  }

  const fragment = document.createDocumentFragment();

  state.notes.forEach((note) => {
    const template = noteTemplate.content.firstElementChild.cloneNode(true);
    template.dataset.id = note.id;
    const text = template.querySelector('.note__text');
    const time = template.querySelector('.note__time');
    const createdAt = new Date(note.createdAt);

    text.textContent = note.text;
    time.dateTime = createdAt.toISOString();
    time.textContent = createdAt.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      month: 'short',
      day: 'numeric',
    });

    fragment.appendChild(template);
  });

  noteList.appendChild(fragment);
}

// Focus timer
const SESSION_LENGTH = 25 * 60; // seconds
let remainingSeconds = SESSION_LENGTH;
let intervalId = null;

startSessionButton?.addEventListener('click', () => {
  if (intervalId) return;
  startTimer();
});

startTimerButton.addEventListener('click', () => {
  if (intervalId) return;
  startTimer();
});

pauseTimerButton.addEventListener('click', () => {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  sessionStatus.textContent = 'Paused';
  startTimerButton.disabled = false;
  pauseTimerButton.disabled = true;
  resetTimerButton.disabled = false;
});

resetTimerButton.addEventListener('click', resetTimer);

function startTimer() {
  if (remainingSeconds <= 0) {
    remainingSeconds = SESSION_LENGTH;
  }

  intervalId = setInterval(() => {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      clearInterval(intervalId);
      intervalId = null;
      sessionStatus.textContent = 'Completed';
      pauseTimerButton.disabled = true;
      startTimerButton.disabled = false;
      resetTimerButton.disabled = false;
      document.body.classList.add('celebrate');
      setTimeout(() => document.body.classList.remove('celebrate'), 1600);
      alert('Focus session complete! Take a short break.');
    }
    updateTimerDisplay();
  }, 1000);

  sessionStatus.textContent = 'In session';
  startTimerButton.disabled = true;
  pauseTimerButton.disabled = false;
  resetTimerButton.disabled = false;
  updateTimerDisplay();
}

function resetTimer() {
  clearInterval(intervalId);
  intervalId = null;
  remainingSeconds = SESSION_LENGTH;
  updateTimerDisplay();
  sessionStatus.textContent = 'Idle';
  startTimerButton.disabled = false;
  pauseTimerButton.disabled = true;
  resetTimerButton.disabled = true;
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(remainingSeconds % 60)
    .toString()
    .padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

// Accessibility: restore focus to the goal input after removing items
const observer = new MutationObserver(() => {
  if (document.activeElement === document.body) {
    goalInput?.focus();
  }
  observer.takeRecords();
});

observer.observe(goalList, { childList: true });

// Initialize controls state
updateTimerDisplay();
resetTimer();
renderGoals();
renderNotes();
