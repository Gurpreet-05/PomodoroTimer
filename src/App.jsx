// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import Settings from './components/Settings';
import './App.css';

// Synthesizer Engine - No MP3 files needed!
const playSynthesizedSound = (soundType) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();

  if (soundType === 'digital') {
    // 3 quick retro digital beeps
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime + i * 0.2);
      osc.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.1);
    }
  } else if (soundType === 'bell') {
    // Smooth decaying bell sound
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2);
  } else if (soundType === 'chime') {
    // Harmonic arpeggio chime
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.4); // G5
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  }
};

const App = () => {
  const [settings, setSettings] = useLocalStorage('pomodoro-settings', {
    focus: 25,
    shortBreak: 5,
    longBreak: 20,
    theme: 'hacker',
    sound: 'digital'
  });
  
  const [cycleData, setCycleData] = useLocalStorage('pomodoro-daily', {
    count: 0,
    date: new Date().toDateString() // e.g., "Fri Jun 12 2026"
  });

  // This guarantees that if they leave the tab open overnight, 
  // the UI will show 0 the next day instead of yesterday's count.
  const completedCycles = cycleData.date === new Date().toDateString() ? cycleData.count : 0;
  const [mode, setMode] = useState('focus'); 
  const [timeLeft, setTimeLeft] = useState(settings.focus * 60);
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    document.body.className = `theme-${settings.theme}`;
  }, [settings.theme]);

  const triggerAlert = useCallback((nextMode) => {
    // 1. Play Built-in Synthesized Sound
    playSynthesizedSound(settings.sound);

    // 2. Send Notification
    if (Notification.permission === 'granted') {
      const messages = {
        focus: "Time to focus! Let's get to work.",
        shortBreak: "Take a breather. Stretch your legs!",
        longBreak: "Great job completing 4 cycles. Take a long break!"
      };
      
      new Notification("Timer Complete", {
        body: messages[nextMode]
      });
    }
  }, [settings.sound]);
  
  const switchMode = useCallback(() => {
    let nextMode;
    let nextTime;

    if (mode === 'focus') {
      const today = new Date().toDateString();
      let newCount;

      // The Daily Reset Logic
      if (cycleData.date === today) {
        newCount = cycleData.count + 1; // Same day, keep adding
      } else {
        newCount = 1; // New day started! Reset count to 1
      }

      // Save the updated count and today's date
      setCycleData({ count: newCount, date: today });
      
      if (newCount % 4 === 0) {
        nextMode = 'longBreak';
        nextTime = settings.longBreak * 60;
      } else {
        nextMode = 'shortBreak';
        nextTime = settings.shortBreak * 60;
      }
    } else {
      nextMode = 'focus';
      nextTime = settings.focus * 60;
    }

    setMode(nextMode);
    setTimeLeft(nextTime);
    triggerAlert(nextMode);
    setIsActive(true); 
  }, [mode, cycleData, settings, setCycleData, triggerAlert]);

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      switchMode();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, switchMode]);

  useEffect(() => {
    if (!isActive) {
      if (mode === 'focus') setTimeLeft(settings.focus * 60);
      if (mode === 'shortBreak') setTimeLeft(settings.shortBreak * 60);
      if (mode === 'longBreak') setTimeLeft(settings.longBreak * 60);
    }
  }, [settings, mode, isActive]);

  // RESTORED: Reset Timer Function
  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'focus') setTimeLeft(settings.focus * 60);
    if (mode === 'shortBreak') setTimeLeft(settings.shortBreak * 60);
    if (mode === 'longBreak') setTimeLeft(settings.longBreak * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const modeDisplayNames = {
    focus: 'Focus Time',
    shortBreak: 'Short Break',
    longBreak: 'Long Break'
  };

  return (
    <div className="app-container">
      <div className="status-badge">
        {modeDisplayNames[mode]}
      </div>
      
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>
      
      <div className="cycles">
        Cycles: {completedCycles} ({(completedCycles % 4)}/4)
      </div>

      <div className="controls">
        <button className="primary" onClick={() => setIsActive(!isActive)}>
          {isActive ? 'PAUSE' : 'START'}
        </button>
        {/* RESTORED: Reset Button */}
        <button onClick={resetTimer}>RESET</button>
        <button onClick={() => { setIsActive(false); switchMode(); }}>SKIP</button>
      </div>

      {!showSettings ? (
        <button onClick={() => setShowSettings(true)} style={{width: '100%', fontSize: '0.8rem'}}>
          ⚙️ Settings & Themes
        </button>
      ) : (
        <Settings 
          settings={settings} 
          setSettings={setSettings} 
          toggleSettings={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default App;