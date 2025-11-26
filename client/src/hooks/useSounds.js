import { useRef, useCallback, useEffect } from 'react';

const SOUNDS = {
  gotcard: '/sounds/fx_gotcard.mp3',
  pige: '/sounds/fx_pige.mp3',
  stolen: '/sounds/fx_stolen.mp3',
  waiting: '/sounds/fx_waiting.mp3',
  win: '/sounds/fx_win.mp3',
  end: '/sounds/fx_end.mp3',
};

export function useSounds() {
  const audioRefs = useRef({});
  const waitingLoopRef = useRef(null);

  // Précharger les sons
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([name, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      if (name === 'waiting') {
        audio.loop = true;
        audio.volume = 0.3;
      }
      audioRefs.current[name] = audio;
    });

    return () => {
      // Cleanup
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      if (waitingLoopRef.current) {
        clearInterval(waitingLoopRef.current);
      }
    };
  }, []);

  const play = useCallback((soundName) => {
    const audio = audioRefs.current[soundName];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignorer les erreurs de lecture (politique autoplay)
      });
    }
  }, []);

  const stop = useCallback((soundName) => {
    const audio = audioRefs.current[soundName];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const startWaiting = useCallback(() => {
    const audio = audioRefs.current.waiting;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, []);

  const stopWaiting = useCallback(() => {
    const audio = audioRefs.current.waiting;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  return {
    playGotCard: () => play('gotcard'),
    playPige: () => play('pige'),
    playStolen: () => play('stolen'),
    playWin: () => play('win'),
    playEnd: () => play('end'),
    startWaiting,
    stopWaiting,
  };
}

export default useSounds;
