import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, CheckCircle2, Play, 
  Star, BrainCircuit, Pause, LogOut,
  User as UserIcon, Calendar, ListOrdered,
  Layers, Volume2, VolumeX, MinusCircle,
  Lightbulb, Heart
} from 'lucide-react';

const App = () => {
  const [gameState, setGameState] = useState('menu'); 
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState({ correct: 0, wrong: 0, points: 0 });
  const [currentQuestion, setCurrentQuestion] = useState({ display: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [shake, setShake] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  
  const [hints, setHints] = useState(3);
  const [lives, setLives] = useState(3);
  
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const sfxClickRef = useRef(null);

  const musicUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  const clickSfxUrl = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";

  const toggleMusic = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // ESC-Taste für Pause-Funktion
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    const savedScores = localStorage.getItem('mathQuestScores');
    if (savedScores) setLeaderboard(JSON.parse(savedScores));
    
    audioRef.current = new Audio(musicUrl);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.08;
    
    sfxClickRef.current = new Audio(clickSfxUrl);
    sfxClickRef.current.volume = 0.3;
    sfxClickRef.current.preload = "auto";

    const unlockAudio = () => {
      if (sfxClickRef.current) {
        sfxClickRef.current.play().then(() => {
            sfxClickRef.current.pause();
            sfxClickRef.current.currentTime = 0;
        }).catch(() => {});
      }
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const playClickSfx = useCallback(() => {
    if (!isMuted) {
      const sound = new Audio(clickSfxUrl);
      sound.volume = 0.3;
      sound.play().catch(() => {});
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (!isMuted && (gameState === 'playing' || gameState === 'menu' || gameState === 'paused')) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted, gameState]);

  const saveScore = (finalPoints) => {
    const newEntry = {
      id: Date.now(),
      name: userName || 'Anonym',
      points: finalPoints,
      date: new Date().toLocaleDateString('de-DE')
    };
    setLeaderboard(prev => {
      const updated = [...prev, newEntry]
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
      localStorage.setItem('mathQuestScores', JSON.stringify(updated));
      return updated;
    });
  };

  const generateQuestion = useCallback((lvl) => {
    let qText = '';
    let ans = 0;

    if (lvl === 1) {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      qText = `${a} + ${b}`;
      ans = a + b;
    } 
    else if (lvl === 2) {
      const a = Math.floor(Math.random() * 20) + 5;
      const b = Math.floor(Math.random() * 20) + 1;
      if (Math.random() > 0.5) {
        qText = `${a} + ${b}`;
        ans = a + b;
      } else {
        const max = Math.max(a, b);
        const min = Math.min(a, b);
        qText = `${max} - ${min}`;
        ans = max - min;
      }
    }
    else if (lvl === 3) {
      const a = Math.floor(Math.random() * 12) + 2;
      const b = Math.floor(Math.random() * 10) + 2;
      qText = `${a} × ${b}`;
      ans = a * b;
    }
    else if (lvl === 4) {
      const b = Math.floor(Math.random() * 10) + 2;
      ans = Math.floor(Math.random() * 10) + 1;
      const a = ans * b;
      qText = `${a} : ${b}`;
    }
    else if (lvl === 5) {
      if (Math.random() > 0.5) {
        ans = Math.floor(Math.random() * 12) + 1;
        qText = `√${ans * ans}`;
      } else {
        const base = Math.floor(Math.random() * 10) + 2;
        qText = `${base}²`;
        ans = base * base;
      }
    }
    else {
      const x = Math.floor(Math.random() * 20) + 5;
      const a = Math.floor(Math.random() * 20) + 1;
      const b = x + a;
      qText = `x + ${a} = ${b} (x=?)`;
      ans = x;
    }

    setCurrentQuestion({ display: qText, answer: ans });
    setUserAnswer('');
    setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const startGame = () => {
    if (!userName || !userAge) return;
    playClickSfx();
    setGameState('playing');
    setLevel(1);
    setQuestionCount(0);
    setHints(3);
    setLives(3);
    setScore({ correct: 0, wrong: 0, points: 0 });
    generateQuestion(1);
  };

  const handleHint = () => {
    if (hints > 0 && !feedback) {
      playClickSfx();
      setHints(prev => prev - 1);
      setUserAnswer(currentQuestion.answer.toString());
    }
  };

  const handleAnswer = (e) => {
    if (e) e.preventDefault();
    if (!userAnswer || feedback) return;

    const isCorrect = parseInt(userAnswer) === currentQuestion.answer;
    
    if (isCorrect) {
      const gain = level * 10;
      setScore(prev => ({ ...prev, correct: prev.correct + 1, points: prev.points + gain }));
      setFeedback({ type: 'correct', message: `RICHTIG! +${gain}` });
      
      setTimeout(() => {
        setQuestionCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 5) {
            if (level < 6) {
              const nextLvl = level + 1;
              setLevel(nextLvl);
              generateQuestion(nextLvl);
              return 0;
            } else {
              saveScore(score.points + gain);
              setGameState('result');
              return 0;
            }
          } else {
            generateQuestion(level);
            return newCount;
          }
        });
      }, 1200);

    } else {
      const penalty = level <= 2 ? 5 : level <= 4 ? 10 : 15;
      const newLives = lives - 1;
      setLives(newLives);
      setScore(prev => ({ 
        ...prev, 
        wrong: prev.wrong + 1, 
        points: Math.max(0, prev.points - penalty) 
      }));
      setFeedback({ type: 'wrong', message: `FALSCH! -${penalty}` });
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (newLives <= 0) {
        setTimeout(() => {
          saveScore(Math.max(0, score.points - penalty));
          setGameState('result');
        }, 1200);
      } else {
        setTimeout(() => {
          generateQuestion(level);
        }, 1200);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#05110c] flex items-center justify-center p-4 font-sans relative overflow-hidden text-slate-100">
      
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#d1e231]/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-bounce duration-[10s]" />

      <div className={`max-w-md w-full relative z-10 transition-all duration-300 ${shake ? 'animate-bounce' : ''}`}>
        
        <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden relative">
          
          {gameState === 'paused' && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
              <div className="w-24 h-24 bg-[#d1e231] rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(209,226,49,0.3)]">
                <Pause className="w-10 h-10 text-[#052e16]" />
              </div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter mb-8 text-center uppercase">PAUSIERT</h2>
              <div className="w-full space-y-4">
                <button 
                  onClick={() => { playClickSfx(); setGameState('playing'); }}
                  className="w-full bg-[#d1e231] text-[#052e16] font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#d1e231]/20"
                >
                  <Play className="w-5 h-5 fill-current" /> WEITER
                </button>
                <button 
                  onClick={() => { playClickSfx(); setGameState('menu'); }}
                  className="w-full bg-white/5 text-rose-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-all border border-rose-500/20"
                >
                  <LogOut className="w-5 h-5" /> HAUPTMENÜ
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#d1e231]/90 backdrop-blur-sm p-8 text-[#052e16] relative overflow-hidden border-b border-white/10">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="flex items-center gap-2 bg-[#052e16]/10 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border border-[#052e16]/10">
                LEVEL {level}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMusic}
                  className="p-1.5 bg-[#052e16]/10 rounded-lg hover:bg-[#052e16]/20 transition-all border border-[#052e16]/10"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="flex items-center gap-2 bg-[#052e16]/10 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border border-[#052e16]/10">
                  <Star className="w-3 h-3 fill-current" /> {score.points}
                </div>
                {gameState === 'playing' && (
                  <button 
                    onClick={() => { playClickSfx(); setGameState('paused'); }}
                    className="p-1.5 bg-[#052e16]/10 rounded-lg hover:bg-[#052e16]/20 transition-all border border-[#052e16]/10"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic relative z-10 leading-none">
              MATH<span className="opacity-40">QUEST</span>
            </h1>
            <Layers className="absolute -bottom-4 -right-4 w-24 h-24 text-[#052e16]/5 -rotate-12" />
          </div>

          <div className="p-8">
            
            {gameState === 'menu' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 text-center">
                  <BrainCircuit className="w-12 h-12 text-[#d1e231] mx-auto mb-3" />
                  <h2 className="text-xl font-bold italic uppercase tracking-tighter">BEREIT?</h2>
                  <p className="text-white/40 text-[10px] mt-1 uppercase font-bold tracking-widest italic">Trainiere deinen Verstand</p>
                </div>

                <div className="space-y-3">
                  <div className="group relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#d1e231] transition-colors" />
                    <input 
                      type="text" 
                      className="w-full bg-black/30 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-[#d1e231] focus:bg-black/50 transition-all text-white font-bold"
                      placeholder="Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>
                  <div className="group relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#d1e231] transition-colors" />
                    <input 
                      type="number" 
                      className="w-full bg-black/30 border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-[#d1e231] focus:bg-black/50 transition-all text-white font-bold"
                      placeholder="Alter"
                      value={userAge}
                      onChange={(e) => setUserAge(e.target.value)}
                    />
                  </div>
                  
                  <div className="pt-2 flex flex-col gap-3">
                    <button 
                      onClick={startGame}
                      disabled={!userName || !userAge}
                      className="w-full bg-[#d1e231] text-[#052e16] font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-10 shadow-lg shadow-[#d1e231]/10"
                    >
                      STARTEN <Play className="w-5 h-5 fill-current" />
                    </button>
                    <button 
                      onClick={() => { playClickSfx(); setGameState('leaderboard'); }}
                      className="w-full bg-white/5 text-white/60 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/10"
                    >
                      <ListOrdered className="w-5 h-5" /> RANGLISTE
                    </button>
                  </div>
                </div>
              </div>
            )}

            {gameState === 'leaderboard' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-black text-[#d1e231] italic tracking-tighter uppercase">Die Besten</h2>
                <div className="space-y-2 min-h-[280px]">
                  {leaderboard.length > 0 ? leaderboard.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <p className="font-bold text-white/90">{entry.name}</p>
                          <p className="text-[10px] text-white/20 font-bold uppercase">{entry.date}</p>
                        </div>
                      </div>
                      <div className="text-[#d1e231] font-black tracking-tight">{entry.points} PKT</div>
                    </div>
                  )) : (
                    <div className="text-center py-20">
                        <Trophy className="w-12 h-12 text-white/5 mx-auto mb-4" />
                        <p className="text-white/20 italic text-sm font-bold uppercase tracking-widest">Noch keine Einträge</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => { playClickSfx(); setGameState('menu'); }}
                  className="w-full bg-white/5 py-4 rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
                >
                  ZURÜCK
                </button>
              </div>
            )}

            {(gameState === 'playing' || gameState === 'paused') && (
              <div className="space-y-6 animate-in zoom-in duration-300">
                
                <div className="flex justify-between items-center px-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((heart) => (
                      <Heart 
                        key={heart} 
                        className={`w-5 h-5 ${heart <= lives ? 'text-rose-500 fill-rose-500' : 'text-white/10'}`} 
                      />
                    ))}
                  </div>
                  <button 
                    onClick={handleHint}
                    disabled={hints <= 0 || feedback !== null}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                      hints > 0 
                      ? 'border-[#d1e231]/40 text-[#d1e231] hover:bg-[#d1e231]/10' 
                      : 'border-white/5 text-white/10 cursor-not-allowed'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-xs font-black italic">{hints}</span>
                  </button>
                </div>

                <div className="text-center">
                  <div className="text-[10px] font-black tracking-[0.4em] text-white/20 mb-6 uppercase italic">FRAGE {questionCount + 1} / 5</div>
                  <div className="bg-white/[0.02] py-10 rounded-[2.5rem] border border-white/10 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                    <div className="text-5xl font-black text-[#d1e231] tracking-tighter relative z-10 drop-shadow-2xl">
                      {currentQuestion.display}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <form onSubmit={handleAnswer} className="space-y-6">
                    <input 
                      ref={inputRef}
                      autoFocus
                      type="number" 
                      disabled={feedback !== null || gameState === 'paused'}
                      className={`w-full text-center text-6xl font-black p-8 rounded-[2.5rem] bg-black/40 border-2 outline-none transition-all shadow-inner ${
                        feedback 
                          ? feedback.type === 'correct' ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'
                          : 'border-white/5 text-[#d1e231] focus:border-[#d1e231] focus:bg-black/60'
                      }`}
                      placeholder="?"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                    />
                    
                    <div className="h-8 flex justify-center items-center">
                        {feedback ? (
                          <div className={`flex justify-center items-center gap-2 animate-in slide-in-from-bottom-2 ${feedback.type === 'wrong' ? 'animate-shake' : ''}`}>
                            {feedback.type === 'correct' ? <CheckCircle2 className="text-emerald-500 w-6 h-6" /> : <MinusCircle className="text-rose-500 w-6 h-6" />}
                            <span className={`font-black text-lg ${feedback.type === 'correct' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {feedback.message}
                            </span>
                          </div>
                        ) : (
                          <p className="text-white/10 text-[9px] font-bold uppercase tracking-[0.3em]">BESTÄTIGEN: ENTER • PAUSE: ESC</p>
                        )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {gameState === 'result' && (
              <div className="text-center space-y-8 animate-in zoom-in-75 duration-500">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[#d1e231] blur-3xl rounded-full opacity-20 animate-pulse" />
                    <Trophy className="w-24 h-24 text-[#d1e231] mx-auto relative z-10 drop-shadow-2xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#d1e231] tracking-tighter italic uppercase leading-none text-center">
                    {lives <= 0 ? 'GAME OVER' : 'SUPER!'}
                  </h2>
                  <p className="text-white/40 mt-2 font-bold text-[10px] tracking-widest uppercase text-center">
                    {lives <= 0 ? 'Vielleicht klappt es beim nächsten Mal' : 'Du hast eine exzellente Leistung gezeigt'}
                  </p>
                </div>
                
                <div className="bg-white/[0.03] p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                   <div className="text-[#d1e231] text-8xl font-black tracking-tighter leading-none text-center">{score.points}</div>
                   <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-4 text-center">Gesamtpunktzahl</div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { playClickSfx(); setGameState('menu'); }} 
                    className="flex-1 bg-white/5 py-5 rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition-all text-white/60 uppercase text-xs tracking-widest"
                  >
                    Menü
                  </button>
                  <button 
                    onClick={startGame} 
                    className="flex-[2] bg-[#d1e231] text-[#052e16] py-5 rounded-2xl font-black hover:brightness-110 shadow-lg shadow-[#d1e231]/10 transition-all text-lg tracking-widest uppercase"
                  >
                    Noch einmal
                  </button>
                </div>
              </div>
            )}

          </div>
          
          <div className="bg-black/20 p-6 text-center border-t border-white/5 backdrop-blur-sm">
             <p className="text-[10px] font-black tracking-[0.5em] text-white/10 uppercase italic">MathQuest Glass Music Edition</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;