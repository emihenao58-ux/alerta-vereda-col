export const STARTUP_PHRASES = [
  "Cada vereda importa. Cada voz cuenta.",
  "Vivir lejos no significa estar desconectados.",
  "Tu comunidad también tiene una voz.",
  "Lo que pasa en una vereda nos importa a todos.",
  "Estar informados nos ayuda a estar preparados.",
  "Cuando la información llega a tiempo, puede marcar la diferencia.",
  "Conocer lo que pasa también es una forma de cuidarnos.",
  "Un municipio, muchas veredas, una comunidad.",
  "Que la distancia no silencie a nuestras veredas.",
  "Más cerca de lo que pasa en cada vereda.",
] as const;

export const STARTUP_PHRASE_STORAGE_KEY = "alertavereda-startup-phrases-v1";

const PHRASES_JSON = JSON.stringify(STARTUP_PHRASES);
const STORAGE_KEY_JSON = JSON.stringify(STARTUP_PHRASE_STORAGE_KEY);

export function getStartupPhraseFromDocument() {
  if (typeof document === "undefined") return STARTUP_PHRASES[0];

  const phrase = document.documentElement.dataset["startupPhrase"];
  return phrase && STARTUP_PHRASES.includes(phrase as (typeof STARTUP_PHRASES)[number])
    ? phrase
    : STARTUP_PHRASES[0];
}

export const STARTUP_PHRASE_BOOTSTRAP_SCRIPT = `(() => {
  const phrases = ${PHRASES_JSON};
  const storageKey = ${STORAGE_KEY_JSON};
  const root = document.documentElement;
  const count = phrases.length;
  const isValidIndex = (value) => Number.isInteger(value) && value >= 0 && value < count;
  const isValidOrder = (value) =>
    Array.isArray(value) &&
    value.length === count &&
    value.every(isValidIndex) &&
    new Set(value).size === count;
  const shuffle = (lastPhraseIndex, previousOrder) => {
    const order = phrases.map((_, index) => index);

    for (let index = order.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [order[index], order[randomIndex]] = [order[randomIndex], order[index]];
    }

    if (isValidIndex(lastPhraseIndex) && order[0] === lastPhraseIndex) {
      [order[0], order[1]] = [order[1], order[0]];
    }

    if (Array.isArray(previousOrder) && order.every((value, index) => value === previousOrder[index])) {
      let swapIndex = 1;
      while (swapIndex < order.length && order[swapIndex] === lastPhraseIndex) swapIndex += 1;
      if (swapIndex < order.length) [order[0], order[swapIndex]] = [order[swapIndex], order[0]];
    }

    return order;
  };

  let stored = null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    stored = raw ? JSON.parse(raw) : null;
  } catch {
    stored = null;
  }

  const storedOrder = stored?.order;
  const storedPosition = stored?.position;
  const storedLastPhraseIndex = stored?.lastPhraseIndex;
  let order = isValidOrder(storedOrder) ? storedOrder : null;
  let position = Number.isInteger(storedPosition) && storedPosition >= 0 && storedPosition <= count
    ? storedPosition
    : null;
  let lastPhraseIndex = isValidIndex(storedLastPhraseIndex) ? storedLastPhraseIndex : null;

  if (!order || position === null) {
    order = shuffle(null, null);
    position = 0;
    lastPhraseIndex = null;
  }

  if (position >= count) {
    const previousOrder = order;
    order = shuffle(lastPhraseIndex, previousOrder);
    position = 0;
  }

  const selectedIndex = order[position];
  lastPhraseIndex = selectedIndex;
  position += 1;

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ order, position, lastPhraseIndex }),
    );
  } catch {
    // El splash sigue funcionando aunque el navegador bloquee localStorage.
  }

  root.dataset.startupPhrase = phrases[selectedIndex];
})();`;

export const STARTUP_PHRASE_APPLY_SCRIPT = `(() => {
  const phrase = document.documentElement.dataset.startupPhrase;
  const target = document.querySelector("[data-startup-phrase-target]");
  if (phrase && target) target.textContent = phrase;
})();`;
