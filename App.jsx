import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, RefreshCw, Star, Users, Play, Copy, Check } from 'lucide-react';

const AlphabetAutobusGame = () => {
  const [gameMode, setGameMode] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [currentLetter, setCurrentLetter] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const pollingInterval = useRef(null);
  
  const [answers, setAnswers] = useState({
    boy: '',
    girl: '',
    animal: '',
    plant: '',
    thing: '',
    country: '',
    food: '',
    profession: ''
  });

  const [corrections, setCorrections] = useState({
    boy: null,
    girl: null,
    animal: null,
    plant: null,
    thing: null,
    country: null,
    food: null,
    profession: null
  });

  const categories = [
    { key: 'boy', label: 'Boy Name', placeholder: 'e.g., Alexander', emoji: '👦' },
    { key: 'girl', label: 'Girl Name', placeholder: 'e.g., Alice', emoji: '👧' },
    { key: 'animal', label: 'Animal', placeholder: 'e.g., Alligator', emoji: '🦁' },
    { key: 'plant', label: 'Plant/Fruit', placeholder: 'e.g., Apple', emoji: '🌱' },
    { key: 'thing', label: 'Thing/Object', placeholder: 'e.g., Airplane', emoji: '📦' },
    { key: 'country', label: 'Country/City', placeholder: 'e.g., Australia', emoji: '🌍' },
    { key: 'food', label: 'Food', placeholder: 'e.g., Avocado', emoji: '🍽️' },
    { key: 'profession', label: 'Profession', placeholder: 'e.g., Architect', emoji: '👨‍💼' }
  ];

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const getRandomLetter = () => {
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  };

  useEffect(() => {
    if (roomCode && gameMode === 'online') {
      loadGameData();
      startPolling();
    }
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [roomCode, gameMode]);

  const loadGameData = async () => {
    if (!roomCode) return;
    
    try {
      const gameData = await window.storage.get(`game:${roomCode}`, true);
      if (gameData) {
        const data = JSON.parse(gameData.value);
        setPlayers(data.players || []);
        setCurrentLetter(data.currentLetter || '');
        setIsPlaying(data.isPlaying || false);
        setTimeLeft(data.timeLeft || 60);
      }
    } catch (error) {
      console.log('No existing game data');
    }
  };

  const saveGameData = async (data) => {
    if (!roomCode) return;
    
    try {
      await window.storage.set(`game:${roomCode}`, JSON.stringify(data), true);
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  };

  const createRoom = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    setGameMode('online');
    
    const newPlayer = {
      name: playerName,
      score: 0,
      id: Date.now().toString(),
      isHost: true
    };
    
    setPlayers([newPlayer]);
    
    saveGameData({
      players: [newPlayer],
      currentLetter: '',
      isPlaying: false,
      timeLeft: 60,
      hostId: newPlayer.id
    });
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      alert('Please enter your name and room code');
      return;
    }
    
    try {
      const gameData = await window.storage.get(`game:${roomCode}`, true);
      
      if (!gameData) {
        alert('Room not found');
        return;
      }
      
      const data = JSON.parse(gameData.value);
      const newPlayer = {
        name: playerName,
        score: 0,
        id: Date.now().toString(),
        isHost: false
      };
      
      const updatedPlayers = [...data.players, newPlayer];
      setPlayers(updatedPlayers);
      setGameMode('online');
      
      await saveGameData({
        ...data,
        players: updatedPlayers
      });
    } catch (error) {
      alert('Error joining room');
      console.error(error);
    }
  };

  const startPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    pollingInterval.current = setInterval(async () => {
      await loadGameData();
    }, 2000);
  };

  const startOnlineGame = async () => {
    if (!isHost) return;
    
    const letter = getRandomLetter();
    setCurrentLetter(letter);
    setTimeLeft(60);
    setIsPlaying(true);
    setGameOver(false);
    
    await saveGameData({
      players,
      currentLetter: letter,
      isPlaying: true,
      timeLeft: 60,
      gameStartTime: Date.now()
    });
  };

  const startSoloGame = () => {
    setGameMode('solo');
    setCurrentLetter(getRandomLetter());
    setTimeLeft(60);
    setIsPlaying(true);
    setGameOver(false);
    setMyScore(0);
    setAnswers({
      boy: '',
      girl: '',
      animal: '',
      plant: '',
      thing: '',
      country: '',
      food: '',
      profession: ''
    });
    setCorrections({
      boy: null,
      girl: null,
      animal: null,
      plant: null,
      thing: null,
      country: null,
      food: null,
      profession: null
    });
  };

  useEffect(() => {
    let timer;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const handleInputChange = (category, value) => {
    setAnswers(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const endGame = async () => {
    setIsPlaying(false);
    setGameOver(true);
    
    setCorrections({
      boy: null,
      girl: null,
      animal: null,
      plant: null,
      thing: null,
      country: null,
      food: null,
      profession: null
    });
  };

  const toggleCorrection = (category) => {
    setCorrections(prev => ({
      ...prev,
      [category]: prev[category] === null ? true : prev[category] === true ? false : null
    }));
  };

  const calculateScore = async () => {
    let score = 0;
    let correctAnswers = 0;
    
    Object.keys(answers).forEach(key => {
      if (corrections[key] === true) {
        score += 10;
        correctAnswers++;
      }
    });

    if (correctAnswers === Object.keys(answers).length && correctAnswers > 0) {
      score += 20;
    }

    setMyScore(score);

    if (gameMode === 'online') {
      const updatedPlayers = players.map(p => 
        p.name === playerName ? { ...p, score: p.score + score } : p
      );
      setPlayers(updatedPlayers);
      
      await saveGameData({
        players: updatedPlayers,
        currentLetter,
        isPlaying: false,
        timeLeft: 0
      });
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCompletionPercentage = () => {
    const filled = Object.values(answers).filter(a => a.trim()).length;
    return Math.round((filled / Object.keys(answers).length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6 mt-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 drop-shadow-2xl">
            🚌 Autobus Complete 🚌
          </h1>
          <p className="text-xl text-white/95 font-semibold">
            Play solo or with friends online!
          </p>
        </div>

        {!gameMode && !isPlaying && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Choose Game Mode
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={startSoloGame}
                className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-10 rounded-2xl hover:scale-105 transform transition shadow-xl"
              >
                <div className="text-5xl mb-3">🎯</div>
                <h3 className="text-2xl font-bold mb-2">Solo Play</h3>
                <p className="text-white/90">Play alone and challenge yourself</p>
              </button>

              <div
                className="bg-gradient-to-br from-green-400 to-emerald-500 text-white p-10 rounded-2xl cursor-pointer hover:scale-105 transform transition shadow-xl"
                onClick={() => setGameMode('setup')}
              >
                <div className="text-5xl mb-3">👥</div>
                <h3 className="text-2xl font-bold mb-2">Online Play</h3>
                <p className="text-white/90">Play with friends</p>
              </div>
            </div>
          </div>
        )}

        {gameMode === 'setup' && !isPlaying && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🌐</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Online Multiplayer
              </h2>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Your Name:
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={createRoom}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl text-lg font-bold hover:scale-105 transform transition shadow-lg"
                >
                  Create Room
                </button>

                <button
                  onClick={() => setGameMode('join')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl text-lg font-bold hover:scale-105 transform transition shadow-lg"
                >
                  Join Room
                </button>
              </div>

              <button
                onClick={() => setGameMode(null)}
                className="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-xl text-lg font-bold hover:bg-gray-400 transition"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {gameMode === 'join' && !roomCode && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔑</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Join a Room
              </h2>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  Room Code:
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-lg text-center font-bold"
                  maxLength={6}
                />
              </div>

              <button
                onClick={joinRoom}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4 rounded-xl text-lg font-bold hover:scale-105 transform transition shadow-lg"
              >
                Join Now
              </button>

              <button
                onClick={() => {
                  setGameMode('setup');
                  setRoomCode('');
                }}
                className="w-full bg-gray-300 text-gray-700 px-6 py-3 rounded-xl text-lg font-bold hover:bg-gray-400 transition"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {gameMode === 'online' && !isPlaying && !gameOver && roomCode && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎪</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                Game Lobby
              </h2>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 inline-flex items-center gap-3">
                <span className="text-2xl font-bold text-purple-600">
                  Room Code: {roomCode}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="bg-white p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={24} />
                Players ({players.length}):
              </h3>
              <div className="space-y-3">
                {players.map((player, index) => (
                  <div key={player.id} className="bg-white rounded-xl p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {index === 0 ? '👑' : '👤'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{player.name}</p>
                        {player.isHost && <p className="text-sm text-purple-600">Host</p>}
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">
                      {player.score} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <button
                onClick={startOnlineGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:scale-105 transform transition shadow-lg flex items-center justify-center gap-3"
              >
                <Play size={28} />
                Start Game
              </button>
            ) : (
              <div className="text-center text-xl text-gray-600">
                ⏳ Waiting for host to start the game...
              </div>
            )}

            <button
              onClick={() => {
                setGameMode(null);
                setRoomCode('');
                setPlayers([]);
                if (pollingInterval.current) {
                  clearInterval(pollingInterval.current);
                }
              }}
              className="w-full mt-4 bg-gray-300 text-gray-700 px-6 py-3 rounded-xl text-lg font-bold hover:bg-gray-400 transition"
            >
              Leave Room
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Clock className={timeLeft <= 20 ? 'text-red-500' : 'text-blue-500'} size={32} />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className={`text-3xl font-bold ${timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                      {timeLeft}s
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Letter</p>
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-bold shadow-lg">
                    {currentLetter}
                  </div>
                </div>

                {gameMode === 'online' && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Players</p>
                    <div className="text-2xl font-bold text-purple-600">
                      {players.length} 👥
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Progress</p>
                  <div className="text-3xl font-bold text-green-600">
                    {getCompletionPercentage()}%
                  </div>
                </div>

                <button
                  onClick={endGame}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transform transition shadow-lg"
                >
                  Finish
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {categories.map(({ key, label, placeholder, emoji }) => (
                  <div key={key} className="space-y-2">
                    <label className="block text-lg font-bold text-gray-700 flex items-center gap-2">
                      <span className="text-2xl">{emoji}</span>
                      {label}
                    </label>
                    <input
                      type="text"
                      value={answers[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 border-2 border-gray-300 focus:border-purple-500 rounded-xl focus:outline-none text-lg transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">
                {myScore >= 80 ? '🏆' : myScore >= 60 ? '🎉' : myScore >= 40 ? '👍' : '😊'}
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">Round Over!</h2>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 mb-6 text-center">
              <p className="text-white text-xl mb-2">Your Score This Round</p>
              <p className="text-white text-7xl font-bold">{myScore}</p>
              {myScore === 0 && (
                <p className="text-white text-lg mt-2">Click "Calculate My Score" after checking your answers</p>
              )}
            </div>

            {gameMode === 'online' && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                  🏆 Leaderboard
                </h3>
                <div className="space-y-3">
                  {players.sort((a, b) => b.score - a.score).map((player, index) => (
                    <div key={player.id} className={`rounded-xl p-4 flex justify-between items-center ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-100 to-orange-100' :
                      index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200' :
                      index === 2 ? 'bg-gradient-to-r from-orange-100 to-yellow-100' :
                      'bg-white'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </div>
                        <p className="font-bold text-gray-800">{player.name}</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {player.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                ✏️ Check Your Answers
              </h3>
              <p className="text-center text-gray-600 mb-4">
                Click on each answer to mark it as ✅ Correct or ❌ Wrong
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map(({ key, label, emoji }) => {
                  const correction = corrections[key];
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCorrection(key)}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        correction === true ? 'bg-green-100 border-green-500' : 
                        correction === false ? 'bg-red-100 border-red-500' : 
                        'bg-gray-100 border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{emoji}</span>
                        <div className="text-left">
                          <span className="font-bold text-gray-700 block">{label}</span>
                          <span className="text-lg">
                            {answers[key] || <span className="text-gray-400 text-sm">No answer</span>}
                          </span>
                        </div>
                      </div>
                      <span className="text-3xl">
                        {correction === true ? '✅' : correction === false ? '❌' : '⚪'}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={calculateScore}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:scale-105 transform transition shadow-lg"
              >
                Calculate My Score
              </button>
            </div>

            <div className="flex gap-4 justify-center flex-wrap">
              {gameMode === 'online' && isHost && (
                <button
                  onClick={() => {
                    setGameOver(false);
                    setMyScore(0);
                    setAnswers({
                      boy: '',
                      girl: '',
                      animal: '',
                      plant: '',
                      thing: '',
                      country: '',
                      food: '',
                      profession: ''
                    });
                    setCorrections({
                      boy: null,
                      girl: null,
                      animal: null,
                      plant: null,
                      thing: null,
                      country: null,
                      food: null,
                      profession: null
                    });
                    startOnlineGame();
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transform transition shadow-lg flex items-center gap-2"
                >
                  <RefreshCw size={20} />
                  New Round
                </button>
              )}
              
              {gameMode === 'solo' && (
                <button
                  onClick={startSoloGame}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transform transition shadow-lg flex items-center gap-2"
                >
                  <RefreshCw size={20} />
                  New Round
                </button>
              )}
              
              <button
                onClick={() => {
                  setGameMode(null);
                  setRoomCode('');
                  setIsPlaying(false);
                  setGameOver(false);
                  setPlayers([]);
                  if (pollingInterval.current) {
                    clearInterval(pollingInterval.current);
                  }
                }}
                className="bg-gradient-to-r from-gray-500 to-gray-700 text-white px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transform transition shadow-lg"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlphabetAutobusGame;