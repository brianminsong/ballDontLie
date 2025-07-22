import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Play, Pause, Square, Clock, BarChart2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

// --- HELPER FUNCTIONS & INITIAL STATE ---

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const getInitialPlayerState = () => ({
    id: Date.now() + Math.random(),
    name: '',
    shots: {
        three: { made: 0, attempted: 0 },
        mid: { made: 0, attempted: 0 },
        layup: { made: 0, attempted: 0 },
    },
    rebounds: { offensive: 0, defensive: 0 },
    assists: 0,
    steals: 0,
    turnovers: 0,
});

const getInitialTeamsState = () => [
    {
        id: 1, name: 'Team 1', color: 'blue',
        players: []
    },
    {
        id: 2, name: 'Team 2', color: 'orange',
        players: []
    }
];

const calculatePoints = (player, scoringSystem) => {
    const threeValue = scoringSystem === '1s_2s' ? 2 : 3;
    const twoValue = scoringSystem === '1s_2s' ? 1 : 2;
    return (player.shots.three.made * threeValue) + (player.shots.mid.made * twoValue) + (player.shots.layup.made * twoValue);
};


// --- MODAL COMPONENTS ---

const Modal = ({ show, onClose, title, children }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-sm m-4 lg:max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto max-h-[80vh]">{children}</div>
            </div>
        </div>
    );
};

const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => (
    <Modal show={show} onClose={onClose} title={title}>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
            <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirm</button>
        </div>
    </Modal>
);

const AddPlayerModal = ({ show, onClose, onAddPlayer }) => {
    const [name, setName] = useState('');
    const handleAdd = () => {
        if (name.trim()) {
            onAddPlayer(name.trim());
            setName('');
            onClose();
        }
    };
    return (
        <Modal show={show} onClose={onClose} title="Add New Player">
            <div className="space-y-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Player Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                    autoFocus
                />
                <button onClick={handleAdd} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                    Add Player
                </button>
            </div>
        </Modal>
    );
};


// --- INLINE STAT INPUT COMPONENT ---
const InlineStatInput = ({ player, statType, onUpdateStat, scoringSystem, onClose, teamColor }) => {
    const threeValue = scoringSystem === '1s_2s' ? 2 : 3;
    const twoValue = scoringSystem === '1s_2s' ? 1 : 2;

    const StatButton = ({ label, onClick, isMake, isMiss }) => {
        let buttonClasses = `w-full text-center py-2.5 px-3 rounded-lg transition-colors font-medium text-sm active:opacity-80 focus:outline-none focus:ring-2`;

        if (statType === 'points') { // For shots (3pt, mid, layup)
            if (isMake) {
                buttonClasses += ` bg-green-500 hover:bg-green-600 text-white focus:ring-green-500`;
            } else if (isMiss) {
                buttonClasses += ` bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`;
            }
        } else { // For other stats (rebounds, assists, steals, turnovers)
            buttonClasses += ` bg-white border ${teamColor === 'blue' ? 'border-blue-500 text-blue-800 hover:bg-blue-50 focus:ring-blue-500' : 'border-orange-500 text-orange-800 hover:bg-orange-50 focus:ring-orange-500'}`;
        }

        return (
            <button onClick={onClick} className={buttonClasses}>
                {label}
            </button>
        );
    };

    const renderContent = () => {
        switch (statType) {
            case 'points':
                return (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <StatButton label={`+${twoValue} Layup Made`} onClick={() => onUpdateStat(player, 'shots', ['layup', 'made'])} isMake />
                            <StatButton label="Layup Miss" onClick={() => onUpdateStat(player, 'shots', ['layup', 'attempted'])} isMiss />
                            <StatButton label={`+${twoValue} Mid Made`} onClick={() => onUpdateStat(player, 'shots', ['mid', 'made'])} isMake />
                            <StatButton label="Mid Miss" onClick={() => onUpdateStat(player, 'shots', ['mid', 'attempted'])} isMiss />
                            <StatButton label={`+${threeValue} Pts Made`} onClick={() => onUpdateStat(player, 'shots', ['three', 'made'])} isMake />
                            <StatButton label={`+${threeValue} Pts Miss`} onClick={() => onUpdateStat(player, 'shots', ['three', 'attempted'])} isMiss />
                        </div>
                    </div>
                );
            case 'rebounds':
                return (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                           <StatButton label="Offensive" onClick={() => onUpdateStat(player, 'rebounds', ['offensive'])} />
                           <StatButton label="Defensive" onClick={() => onUpdateStat(player, 'rebounds', ['defensive'])} />
                        </div>
                    </div>
                );
            case 'assists': case 'steals': case 'turnovers':
                 return (
                    <div className="space-y-2">
                        <StatButton label={`+1 ${statType.charAt(0).toUpperCase() + statType.slice(1)}`} onClick={() => onUpdateStat(player, statType)} />
                    </div>
                 );
            default: return null;
        }
    };

    return (
        <div className="bg-gray-50 p-3 rounded-lg mt-2 border border-gray-200 animate-slide-down">
            <div className="flex justify-between items-center mb-2">
                <h5 className="font-bold text-gray-700 text-sm">Select {statType === 'points' ? 'Shot' : statType === 'rebounds' ? 'Rebound' : 'Stat'} for {player.name}</h5>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>
            {renderContent()}
        </div>
    );
};


// --- CORE COMPONENTS ---

const Player = ({ player, onRemovePlayer, onStatClick, scoringSystem, activeStatInput, setActiveStatInput, teamColor }) => {
    const points = calculatePoints(player, scoringSystem);
    const totalRebounds = player.rebounds.offensive + player.rebounds.defensive;
    
    const isStatInputActive = activeStatInput && activeStatInput.playerId === player.id;

    const StatBox = ({ label, value, statKey }) => (
        <button
            onClick={() => setActiveStatInput({ playerId: player.id, statType: statKey })}
            // Already white, just ensure border and text colors are correct
            className={`flex flex-col items-center justify-center bg-white p-2 sm:p-3 rounded-md border
                ${teamColor === 'blue' ? 'border-blue-500' : 'border-orange-500'}
                hover:bg-gray-50 transition-all transform hover:scale-105 shadow active:bg-gray-100 focus:outline-none focus:ring-2
                ${isStatInputActive && activeStatInput.statType === statKey ? (teamColor === 'blue' ? 'ring-2 ring-blue-500 bg-blue-50' : 'ring-2 ring-orange-500 bg-orange-50') : ''}`}
        >
            <div className={`font-bold text-lg sm:text-xl ${teamColor === 'blue' ? 'text-blue-600' : 'text-orange-600'}`}>{value}</div>
            <div className="text-xs sm:text-sm font-semibold text-white">{label}</div>
        </button>
    );

    return (
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md mb-3">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-bold text-gray-900">{player.name}</h4>
                <button onClick={() => onRemovePlayer(player.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 active:bg-red-100 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
                <StatBox label="PTS" value={points} statKey="points" />
                <StatBox label="REB" value={totalRebounds} statKey="rebounds" />
                <StatBox label="AST" value={player.assists} statKey="assists" />
                <StatBox label="STL" value={player.steals} statKey="steals" />
                <StatBox label="TO" value={player.turnovers} statKey="turnovers" />
            </div>

            {isStatInputActive && (
                <InlineStatInput
                    player={player}
                    statType={activeStatInput.statType}
                    onUpdateStat={onStatClick}
                    scoringSystem={scoringSystem}
                    onClose={() => setActiveStatInput(null)}
                    teamColor={teamColor}
                />
            )}
        </div>
    );
};

const Team = ({ team, onAddPlayer, onRemovePlayer, onStatClick, scoringSystem, activeStatInput, setActiveStatInput }) => {
    const teamScore = team.players.reduce((total, player) => total + calculatePoints(player, scoringSystem), 0);

    const teamBgColor = team.color === 'blue' ? 'border-blue-400' : 'border-orange-400';
    const teamTextColor = team.color === 'blue' ? 'text-blue-800' : 'text-orange-800';
    const teamScoreColor = team.color === 'blue' ? 'text-blue-600' : 'text-orange-600';
    
    // Updated Add Player button to be white with colored text and border
    const addButtonClasses = team.color === 'blue' 
        ? 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50' 
        : 'bg-white text-orange-600 border border-orange-600 hover:bg-orange-50';

    return (
        // Changed team section background to white
        <div className={`p-4 sm:p-6 rounded-2xl shadow-lg w-full border-t-4 ${teamBgColor} bg-white`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl sm:text-3xl font-bold ${teamTextColor}`}>{team.name}</h2>
                <p className={`text-4xl sm:text-5xl font-bold ${teamScoreColor}`}>{teamScore}</p>
            </div>
            <div className="mb-4 min-h-[60px]">
                {team.players.map(player => (
                    <Player
                        key={player.id}
                        player={player}
                        onRemovePlayer={(playerId) => onRemovePlayer(team.id, playerId)}
                        onStatClick={onStatClick}
                        scoringSystem={scoringSystem}
                        activeStatInput={activeStatInput}
                        setActiveStatInput={setActiveStatInput}
                        teamColor={team.color}
                    />
                ))}
            </div>
            <button
                onClick={() => onAddPlayer(team.id)}
                className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition ${addButtonClasses}`}
            >
                <Plus size={20} /> Add Player
            </button>
        </div>
    );
};

const GameControls = ({ gameNumber, time, isActive, onStart, onPause, onEndGame }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
            <BarChart2 className="text-indigo-500" size={28} />
            <h2 className="text-xl font-bold text-gray-700">Game #{gameNumber}</h2>
        </div>
        <div className="flex items-center gap-3">
            <Clock className="text-indigo-500" size={28} />
            <p className="text-3xl font-mono font-bold text-gray-800">{formatTime(time)}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {!isActive ? (
                <button onClick={onStart} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 w-full sm:w-auto active:bg-green-700">
                    <Play size={20} /> Start
                </button>
            ) : (
                <button onClick={onPause} className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600 w-full sm:w-auto active:bg-yellow-700">
                    <Pause size={20} /> Pause
                </button>
            )}
            <button onClick={onEndGame} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 w-full sm:w-auto active:bg-red-700">
                <Square size={20} /> End & Save Game
            </button>
        </div>
    </div>
);

const ScoringSystemToggle = ({ scoringSystem, setScoringSystem }) => (
    <div className="bg-white p-3 rounded-xl shadow-lg mb-8 flex flex-col sm:flex-row justify-center items-center gap-4">
        <span className="font-semibold text-gray-700 mb-2 sm:mb-0">Scoring System:</span>
        <div className="flex items-center gap-2 bg-gray-200 rounded-full p-1 w-full sm:w-auto justify-center">
            <button
                onClick={() => setScoringSystem('1s_2s')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out w-1/2 sm:w-auto
                    ${scoringSystem === '1s_2s' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-300 active:bg-gray-400'}`}
            >
                1s & 2s
            </button>
            <button
                onClick={() => setScoringSystem('2s_3s')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out w-1/2 sm:w-auto
                    ${scoringSystem === '2s_3s' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-300 active:bg-gray-400'}`}
            >
                2s & 3s
            </button>
        </div>
    </div>
);

const ExpandedGameStatsTable = ({ team, scoringSystem }) => {
    const headers = ['Player', 'PTS', '3PM', '3PA', 'MidM', 'MidA', 'LayupM', 'LayupA', 'FGM', 'FGA', 'AST', 'REB', 'OREB', 'DREB', 'TO', 'STL'];
    return (
        <div className="my-4">
            <h4 className={`text-lg font-bold mb-3 ${team.color === 'blue' ? 'text-blue-700' : 'text-orange-700'} text-center sm:text-left`}>{team.name} Stats</h4>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                        <tr>
                            {headers.map(h => <th key={h} className="px-3 py-3 font-semibold whitespace-nowrap">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {team.players.map(p => {
                            const totalPoints = calculatePoints(p, scoringSystem);
                            const threeMade = p.shots.three.made;
                            const threeAttempted = threeMade + p.shots.three.attempted;
                            const midMade = p.shots.mid.made;
                            const midAttempted = midMade + p.shots.mid.attempted;
                            const layupMade = p.shots.layup.made;
                            const layupAttempted = layupMade + p.shots.layup.attempted;
                            const totalMade = threeMade + midMade + layupMade;
                            const totalAttempted = threeAttempted + midAttempted + layupAttempted;
                            const totalRebounds = p.rebounds.offensive + p.rebounds.defensive;
                            return (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{p.name}</td>
                                    <td className="px-3 py-2 font-bold">{totalPoints}</td>
                                    <td className="px-3 py-2">{threeMade}</td>
                                    <td className="px-3 py-2">{threeAttempted}</td>
                                    <td className="px-3 py-2">{midMade}</td>
                                    <td className="px-3 py-2">{midAttempted}</td>
                                    <td className="px-3 py-2">{layupMade}</td>
                                    <td className="px-3 py-2">{layupAttempted}</td>
                                    <td className="px-3 py-2">{totalMade}</td>
                                    <td className="px-3 py-2">{totalAttempted}</td>
                                    <td className="px-3 py-2">{p.assists}</td>
                                    <td className="px-3 py-2">{totalRebounds}</td>
                                    <td className="px-3 py-2">{p.rebounds.offensive}</td>
                                    <td className="px-3 py-2">{p.rebounds.defensive}</td>
                                    <td className="px-3 py-2">{p.turnovers}</td>
                                    <td className="px-3 py-2">{p.steals}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GameHistory = ({ history, expandedGame, setExpandedGame }) => {
    if (history.length === 0) return null;
    return (
        <div className="mt-12 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-4 text-white flex items-center justify-center gap-3"><BookOpen /> Game History</h2>
            <div className="space-y-2 bg-white p-4 rounded-xl shadow-lg">
                {history.slice().reverse().map(game => {
                    const isExpanded = expandedGame === game.gameNumber;
                    const [score1, score2] = game.finalScore.split(' - ').map(Number);
                    const team1ColorClass = score1 > score2 ? 'text-blue-600' : 'text-gray-600';
                    const team2ColorClass = score2 > score1 ? 'text-orange-600' : 'text-gray-600';

                    return (
                        <div key={game.gameNumber} className="bg-gray-50 rounded-lg transition-all">
                            <div 
                                className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
                                onClick={() => setExpandedGame(isExpanded ? null : game.gameNumber)}
                            >
                                <div className="font-semibold text-gray-800">Game #{game.gameNumber}</div>
                                <div className="text-gray-600">Duration: {formatTime(game.duration)}</div>
                                <div className="font-bold text-lg">
                                    <span className={team1ColorClass}>{score1}</span> - <span className={team2ColorClass}>{score2}</span>
                                </div>
                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                            {isExpanded && (
                                <div className="p-4 border-t border-gray-200">
                                    <ExpandedGameStatsTable team={game.teams[0]} scoringSystem={game.scoringSystem} />
                                    <ExpandedGameStatsTable team={game.teams[1]} scoringSystem={game.scoringSystem} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
    const [teams, setTeams] = useState(getInitialTeamsState());
    const [gameNumber, setGameNumber] = useState(1);
    const [gameTime, setGameTime] = useState(0);
    const [isGameActive, setIsGameActive] = useState(false);
    const [gameHistory, setGameHistory] = useState([]);
    const [scoringSystem, setScoringSystem] = useState('2s_3s');
    const [expandedGame, setExpandedGame] = useState(null);
    
    const [addPlayerModalTeamId, setAddPlayerModalTeamId] = useState(null);
    const [confirmModalState, setConfirmModalState] = useState({ show: false, onConfirm: () => {}, title: '', message: '' });

    const [activeStatInput, setActiveStatInput] = useState(null);

    useEffect(() => {
        let interval = null;
        if (isGameActive) {
            interval = setInterval(() => setGameTime(prevTime => prevTime + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isGameActive]);

    const handleEndGameRequest = () => {
        setConfirmModalState({
            show: true,
            onConfirm: () => executeEndGame(),
            title: 'End Game?',
            message: 'Are you sure you want to end this game? The results will be saved and a new game will start.'
        });
    };

    const executeEndGame = () => {
        setIsGameActive(false);
        const score1 = teams[0].players.reduce((total, p) => total + calculatePoints(p, scoringSystem), 0);
        const score2 = teams[1].players.reduce((total, p) => total + calculatePoints(p, scoringSystem), 0);
        const completedGame = {
            gameNumber,
            duration: gameTime,
            finalScore: `${score1} - ${score2}`,
            teams: JSON.parse(JSON.stringify(teams)), // Deep copy of teams for history
            scoringSystem: scoringSystem
        };
        setGameHistory(prev => [...prev, completedGame]);
        setGameNumber(prev => prev + 1);
        setGameTime(0);
        setTeams(getInitialTeamsState());
        setConfirmModalState({ show: false, onConfirm: () => {} });
    };
    
    const confirmAddPlayer = (name) => {
        const newPlayer = { ...getInitialPlayerState(), name };
        setTeams(teams.map(team =>
            team.id === addPlayerModalTeamId ? { ...team, players: [...team.players, newPlayer] } : team
        ));
    };

    const handleRemovePlayerRequest = (teamId, playerId) => {
        setConfirmModalState({
            show: true,
            onConfirm: () => executeRemovePlayer(teamId, playerId),
            title: 'Remove Player?',
            message: 'Are you sure you want to remove this player?'
        });
    };

    const executeRemovePlayer = (teamId, playerId) => {
        setTeams(teams.map(team =>
            team.id === teamId ? { ...team, players: team.players.filter(p => p.id !== playerId) } : team
        ));
        setConfirmModalState({ show: false, onConfirm: () => {} });
    };
    
    const handleUpdatePlayerStat = (playerToUpdate, statType, path) => {
        setTeams(currentTeams => currentTeams.map(team => ({
            ...team,
            players: team.players.map(player => {
                if (player.id !== playerToUpdate.id) return player;
                
                const updatedPlayer = { ...player };

                if (statType === 'shots') {
                    const [shotType, outcome] = path;
                    updatedPlayer.shots = {
                        ...updatedPlayer.shots,
                        [shotType]: {
                            ...updatedPlayer.shots[shotType],
                            [outcome]: updatedPlayer.shots[shotType][outcome] + 1
                        }
                    };
                } else if (statType === 'rebounds') {
                    const [reboundType] = path;
                    updatedPlayer.rebounds = {
                        ...updatedPlayer.rebounds,
                        [reboundType]: updatedPlayer.rebounds[reboundType] + 1
                    };
                } else {
                    updatedPlayer[statType] += 1;
                }
                return updatedPlayer;
            })
        })));
        setActiveStatInput(null);
    };

    return (
        // Reverted main app background to default white
        <div className="min-h-screen font-sans p-3 pb-8 sm:p-6">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-6">
                    {/* Updated app title color for white background */}
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                        Ball Don't Lie 🏀
                    </h1>
                </header>

                <GameControls
                    gameNumber={gameNumber}
                    time={gameTime}
                    isActive={isGameActive}
                    onStart={() => setIsGameActive(true)}
                    onPause={() => setIsGameActive(false)}
                    onEndGame={handleEndGameRequest}
                />
                
                <ScoringSystemToggle scoringSystem={scoringSystem} setScoringSystem={setScoringSystem} />

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {teams.map(team => (
                        <div key={team.id} className={`p-0 rounded-2xl`}> {/* Removed bg-blue-50/orange-50 */}
                            <Team
                                team={team}
                                onAddPlayer={() => setAddPlayerModalTeamId(team.id)}
                                onRemovePlayer={handleRemovePlayerRequest}
                                onStatClick={handleUpdatePlayerStat}
                                scoringSystem={scoringSystem}
                                activeStatInput={activeStatInput}
                                setActiveStatInput={setActiveStatInput}
                            />
                        </div>
                    ))}
                </main>

                <GameHistory history={gameHistory} expandedGame={expandedGame} setExpandedGame={setExpandedGame} />
            </div>
            
            <AddPlayerModal
                show={!!addPlayerModalTeamId}
                onClose={() => setAddPlayerModalTeamId(null)}
                onAddPlayer={confirmAddPlayer}
            />

            <ConfirmationModal
                show={confirmModalState.show}
                onClose={() => setConfirmModalState({ show: false, onConfirm: () => {} })}
                onConfirm={confirmModalState.onConfirm}
                title={confirmModalState.title}
                message={confirmModalState.message}
            />
        </div>
    );
}