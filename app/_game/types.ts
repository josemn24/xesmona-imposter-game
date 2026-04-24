export type GameStatus =
  | "idle"
  | "setup"
  | "player_entry"
  | "role_distribution"
  | "clue_phase"
  | "debate_phase"
  | "voting_phase"
  | "tie_break_voting"
  | "reveal_phase"
  | "final_guess_phase"
  | "scoreboard_phase"
  | "finished";

export type VotePhase = "primary" | "tieBreak";

export type RoleId = "citizen" | "impostor";

export type RoleMeta = {
  id: RoleId;
  label: string;
  emoji: string;
  description: string;
  tone: "default" | "danger";
};

export type RoundOutcome =
  | "impostor_survived"
  | "impostor_detected"
  | "impostor_detected_and_guessed"
  | "impostor_detected_and_failed";

export type Player = {
  id: string;
  name: string;
  score: number;
  orderIndex: number;
  isActive: boolean;
};

export type GameSettings = {
  playerCount: number;
  roundsTotal: number;
  categoryId: string;
  clueTimerSeconds: number | null;
  debateTimerSeconds: number | null;
  finalGuessEnabled: boolean;
};

export type Vote = {
  voterPlayerId: string;
  targetPlayerId: string;
  phase: VotePhase;
};

export type RoundResult = {
  outcome: RoundOutcome;
  impostorWon: boolean;
  expelledPlayerId: string | null;
  tiedPlayerIds: string[];
  finalGuessCorrect: boolean | null;
  scoreApplied: boolean;
};

export type FinalGuess = {
  value: string;
  correct: boolean;
};

export type Round = {
  id: string;
  roundNumber: number;
  secretWordId: string;
  secretWordValue: string;
  categoryId: string;
  impostorPlayerId: string;
  startingPlayerId: string;
  turnOrderPlayerIds: string[];
  votes: Vote[];
  result: RoundResult | null;
  finalGuess: FinalGuess | null;
};

export type Word = {
  id: string;
  value: string;
  categoryId: string;
  locale: "es";
  enabled: boolean;
};

export type Category = {
  id: string;
  name: string;
  enabled: boolean;
};

export type GameSession = {
  id: string;
  status: GameStatus;
  settings: GameSettings;
  players: Player[];
  currentRound: Round | null;
  completedRounds: Round[];
  currentRoundNumber: number;
  roleDistributionIndex: number;
  clueTurnIndex: number;
  voteVoterIndex: number;
  tieCandidateIds: string[];
  startedAt: string | null;
  updatedAt: string;
};

export type GameAction =
  | { type: "START_NEW_GAME" }
  | { type: "RESUME_GAME"; session: GameSession }
  | { type: "CLEAR_SESSION" }
  | { type: "UPDATE_SETTINGS"; settings: Partial<GameSettings> }
  | { type: "GO_TO_HOME" }
  | { type: "GO_TO_SETUP" }
  | { type: "GO_TO_PLAYER_ENTRY" }
  | { type: "ABORT_CURRENT_ROUND_TO_PLAYER_ENTRY" }
  | { type: "GO_BACK_TO_CLUES" }
  | { type: "GO_BACK_TO_DEBATE" }
  | { type: "SET_PLAYER_NAME"; playerId: string; name: string }
  | { type: "AUTOFILL_PLAYERS" }
  | { type: "BEGIN_ROUND" }
  | { type: "NEXT_ROLE" }
  | { type: "NEXT_CLUE" }
  | { type: "START_DEBATE" }
  | { type: "START_VOTING" }
  | { type: "CAST_VOTE"; targetPlayerId: string }
  | { type: "CONTINUE_FROM_REVEAL" }
  | { type: "SUBMIT_FINAL_GUESS"; guess: string }
  | { type: "NEXT_ROUND" }
  | { type: "FINISH_GAME" };

export type AnalyticsEventName =
  | "app_opened"
  | "new_game_started"
  | "setup_completed"
  | "round_started"
  | "round_completed"
  | "game_completed"
  | "resumed_game"
  | "abandoned_at_screen"
  | "category_selected"
  | "timer_enabled";
