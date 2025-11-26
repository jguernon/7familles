import { useRef, useCallback, useEffect, useState } from 'react';

// Variable globale pour tracker si les sons sont déverrouillés
let soundsUnlocked = false;
let audioContext = null;

// Créer un son avec Web Audio API
function createSound(ctx, type, frequency, duration, volume = 0.3) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

// Sons générés avec Web Audio
function playGotCardSound(ctx) {
  // Son joyeux - deux notes montantes
  createSound(ctx, 'sine', 523, 0.15, 0.3); // Do
  setTimeout(() => createSound(ctx, 'sine', 659, 0.15, 0.3), 100); // Mi
  setTimeout(() => createSound(ctx, 'sine', 784, 0.2, 0.3), 200); // Sol
}

function playPigeSound(ctx) {
  // Son de carte - whoosh
  createSound(ctx, 'sine', 300, 0.1, 0.2);
  setTimeout(() => createSound(ctx, 'sine', 400, 0.15, 0.25), 50);
}

function playStolenSound(ctx) {
  // Son triste - deux notes descendantes
  createSound(ctx, 'sine', 440, 0.2, 0.3);
  setTimeout(() => createSound(ctx, 'sine', 330, 0.3, 0.25), 150);
}

function playWinSound(ctx) {
  // Fanfare de victoire
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => createSound(ctx, 'sine', freq, 0.2, 0.3), i * 120);
  });
}

function playEndSound(ctx) {
  // Son de fin de partie - accord majeur
  createSound(ctx, 'sine', 261, 0.5, 0.2); // Do
  createSound(ctx, 'sine', 329, 0.5, 0.2); // Mi
  createSound(ctx, 'sine', 392, 0.5, 0.2); // Sol
  setTimeout(() => {
    createSound(ctx, 'sine', 523, 0.8, 0.3); // Do octave
  }, 400);
}

export function useSounds() {
  const [isUnlocked, setIsUnlocked] = useState(soundsUnlocked);
  const waitingIntervalRef = useRef(null);

  // Déverrouiller les sons après une interaction utilisateur
  useEffect(() => {
    const unlockAudio = () => {
      if (soundsUnlocked) return;

      // Créer un AudioContext
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Résumer le contexte audio si suspendu
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      soundsUnlocked = true;
      setIsUnlocked(true);
      console.log('🔊 Sons déverrouillés');
    };

    // Écouter les interactions utilisateur
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: false });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlockAudio);
      });
      if (waitingIntervalRef.current) {
        clearInterval(waitingIntervalRef.current);
      }
    };
  }, []);

  const getContext = useCallback(() => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  }, []);

  const playGotCard = useCallback(() => {
    if (!soundsUnlocked) return;
    try {
      playGotCardSound(getContext());
    } catch (e) {}
  }, [getContext]);

  const playPige = useCallback(() => {
    if (!soundsUnlocked) return;
    try {
      playPigeSound(getContext());
    } catch (e) {}
  }, [getContext]);

  const playStolen = useCallback(() => {
    if (!soundsUnlocked) return;
    try {
      playStolenSound(getContext());
    } catch (e) {}
  }, [getContext]);

  const playWin = useCallback(() => {
    if (!soundsUnlocked) return;
    try {
      playWinSound(getContext());
    } catch (e) {}
  }, [getContext]);

  const playEnd = useCallback(() => {
    if (!soundsUnlocked) return;
    try {
      playEndSound(getContext());
    } catch (e) {}
  }, [getContext]);

  const startWaiting = useCallback(() => {
    if (!soundsUnlocked) return;
    // Jouer un petit son toutes les 2 secondes
    if (waitingIntervalRef.current) {
      clearInterval(waitingIntervalRef.current);
    }
    const playTick = () => {
      try {
        const ctx = getContext();
        createSound(ctx, 'sine', 220, 0.05, 0.1);
      } catch (e) {}
    };
    playTick();
    waitingIntervalRef.current = setInterval(playTick, 2000);
  }, [getContext]);

  const stopWaiting = useCallback(() => {
    if (waitingIntervalRef.current) {
      clearInterval(waitingIntervalRef.current);
      waitingIntervalRef.current = null;
    }
  }, []);

  return {
    playGotCard,
    playPige,
    playStolen,
    playWin,
    playEnd,
    startWaiting,
    stopWaiting,
    isUnlocked,
  };
}

export default useSounds;
