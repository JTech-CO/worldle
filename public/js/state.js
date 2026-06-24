// Game state persisted in localStorage under a day-scoped key so the daily puzzle survives reloads; new day starts fresh, stale keys pruned.

const KEY_PREFIX = 'worldle:v1:';

function keyFor(day) { return `${KEY_PREFIX}${day}`; }

function pruneOldDays(currentDay) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(KEY_PREFIX) && k !== keyFor(currentDay)) {
        localStorage.removeItem(k);
      }
    }
  } catch { /* storage may be unavailable */ }
}

function load(day) {
  try {
    const raw = localStorage.getItem(keyFor(day));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.day === day && Array.isArray(data.guesses)) return data;
  } catch { /* corrupt entry */ }
  return null;
}

// Restores saved progress for the same day, else starts a new game.
export function createGameStore(puzzle) {
  pruneOldDays(puzzle.day);

  const restored = load(puzzle.day);
  const state = restored ?? {
    day: puzzle.day,
    date: puzzle.date,
    maxGuesses: puzzle.maxGuesses,
    totalCountries: puzzle.totalCountries,
    guesses: [],
    status: 'playing', // 'playing' | 'won' | 'lost'
  };
  // resync metadata with server in case it changed between sessions
  state.maxGuesses = puzzle.maxGuesses;
  state.totalCountries = puzzle.totalCountries;
  state.date = puzzle.date;

  function save() {
    try { localStorage.setItem(keyFor(state.day), JSON.stringify(state)); } catch { /* ignore */ }
  }

  return {
    get day() { return state.day; },
    get date() { return state.date; },
    get maxGuesses() { return state.maxGuesses; },
    get guesses() { return state.guesses; },
    get status() { return state.status; },
    get attemptsLeft() { return state.maxGuesses - state.guesses.length; },
    get isOver() { return state.status !== 'playing'; },
    get guessedIds() { return new Set(state.guesses.map((g) => g.guess.id)); },

    hasGuessed(id) { return state.guesses.some((g) => g.guess.id === id); },

    // Append a scored guess, update status, return guess count.
    addGuess(result) {
      state.guesses.push(result);
      if (result.correct) state.status = 'won';
      else if (state.guesses.length >= state.maxGuesses) state.status = 'lost';
      save();
      return state.guesses.length;
    },

    raw() { return state; },
  };
}
