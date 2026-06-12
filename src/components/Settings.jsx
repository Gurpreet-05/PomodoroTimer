// src/components/Settings.jsx
import React, { useState } from 'react';

const Settings = ({ settings, setSettings, toggleSettings }) => {
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: (name === 'theme' || name === 'sound') ? value : Math.max(1, parseInt(value) || 1)
    }));
  };

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
  };

  return (
    <div className="settings-panel">
      <h3>Settings</h3>
      
      <div className="settings-group">
        <label>Focus (min):</label>
        <input type="number" name="focus" value={settings.focus} onChange={handleChange} />
      </div>
      
      <div className="settings-group">
        <label>Short Break (min):</label>
        <input type="number" name="shortBreak" value={settings.shortBreak} onChange={handleChange} />
      </div>

      {/* RESTORED: Long Break Customization */}
      <div className="settings-group">
        <label>Long Break (min):</label>
        <input type="number" name="longBreak" value={settings.longBreak} onChange={handleChange} />
      </div>

      <div className="settings-group">
        <label>Theme:</label>
        <select name="theme" value={settings.theme} onChange={handleChange}>
          {/* Colors */}
          <option value="navy">Classic Navy</option>
          <option value="green">Deep Green</option>
          <option value="lightblue">Light Blue</option>
          
          {/* Classic Environments */}
          <option value="desk">Minimalist Desk 🖥️</option>
          <option value="terminal">Dark Terminal 💻</option>
          <option value="space">Deep Space 🌌</option>
          <option value="forest">Misty Forest 🌲</option>
          <option value="city">Cyberpunk City 🌃</option>
          <option value="geometry">Abstract Geometry 📐</option>

          {/* NEW Environments */}
          <option value="cafe">Cozy Cafe ☕</option>
          <option value="ocean">Deep Ocean 🌊</option>
          <option value="synthwave">Retro Synthwave 📻</option>
          <option value="library">Dark Academia 📚</option>
        </select>
      </div>

      <div className="settings-group">
        <label>Alarm Sound:</label>
        <select name="sound" value={settings.sound} onChange={handleChange}>
          <option value="bell">Synthesized Bell</option>
          <option value="digital">Digital Beeps</option>
          <option value="chime">Soft Chime</option>
        </select>
      </div>

      <div className="settings-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
        <label>Desktop Notifications:</label>
        <button 
          onClick={requestNotificationPermission} 
          disabled={permissionStatus === 'granted'}
          style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem' }}
        >
          {permissionStatus === 'granted' ? 'Notifications Enabled ✓' : 'Enable Notifications'}
        </button>
      </div>

      <button onClick={toggleSettings} style={{width: '100%', marginTop: '1rem'}}>
        Save & Close
      </button>
    </div>
  );
};

export default Settings;