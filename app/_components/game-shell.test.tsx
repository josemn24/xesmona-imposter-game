import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameShell } from "@/app/_components/game-shell";
import { gameReducer, createInitialSession } from "@/app/_game/reducer";
import { saveSession, STORAGE_KEY } from "@/app/_game/storage";

function openPlayerEntry() {
  render(<GameShell />);

  fireEvent.click(screen.getByRole("button", { name: "Nueva partida" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

function openSetup() {
  render(<GameShell />);

  fireEvent.click(screen.getByRole("button", { name: "Nueva partida" }));
}

function startRound() {
  openPlayerEntry();

  const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/);
  nameInputs.forEach((input, index) => {
    fireEvent.change(input, { target: { value: `Jugador ${index + 1}` } });
  });

  fireEvent.click(screen.getByRole("button", { name: "Empezar reparto" }));
}

function revealAllRoles(playerCount = 4) {
  for (let index = 0; index < playerCount; index += 1) {
    fireEvent.click(screen.getByRole("button", { name: "Ver mi rol" }));
    fireEvent.click(screen.getByRole("button", { name: "Ocultar y pasar" }));
  }
}

function completeCluePhase(playerCount = 4) {
  for (let index = 0; index < playerCount; index += 1) {
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  }
}

function startVotingPhase() {
  fireEvent.click(screen.getByRole("button", { name: "Ir a votacion" }));
}

function voteForPlayer(targetName: string) {
  fireEvent.click(screen.getByText(targetName));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar voto" }));
}

function createSavedRoleDistributionSession() {
  let session = gameReducer(createInitialSession(), { type: "START_NEW_GAME" });
  session = gameReducer(session, { type: "GO_TO_PLAYER_ENTRY" });

  session.players.forEach((player, index) => {
    session = gameReducer(session, {
      type: "SET_PLAYER_NAME",
      playerId: player.id,
      name: `Jugador ${index + 1}`,
    });
  });

  return gameReducer(session, { type: "BEGIN_ROUND" });
}

function createFinishedSession(scores: number[]) {
  let session = gameReducer(createInitialSession(), { type: "START_NEW_GAME" });
  session = gameReducer(session, { type: "GO_TO_PLAYER_ENTRY" });

  session.players.forEach((player, index) => {
    session = gameReducer(session, {
      type: "SET_PLAYER_NAME",
      playerId: player.id,
      name: `Jugador ${index + 1}`,
    });
  });

  session = gameReducer(session, { type: "BEGIN_ROUND" });

  return {
    ...session,
    status: "finished" as const,
    players: session.players.map((player, index) => ({
      ...player,
      score: scores[index] ?? 0,
    })),
  };
}

function persistRawSession(session: ReturnType<typeof createFinishedSession>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

describe("GameShell roles", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  test("shows assigned avatars on player entry", () => {
    openPlayerEntry();

    expect(screen.getAllByAltText(/Avatar de jugador/i).length).toBeGreaterThan(0);
  });

  test("shows citizen role and the secret word during role distribution", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    startRound();

    fireEvent.click(screen.getByRole("button", { name: "Ver mi rol" }));

    expect(screen.getByText("🙂")).toBeDefined();
    expect(screen.getByText("Civil")).toBeDefined();
    expect(screen.queryByText("No recibes palabra")).toBeNull();
  });

  test("shows the impostor role without the secret word during role distribution", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    startRound();

    fireEvent.click(screen.getByRole("button", { name: "Ver mi rol" }));

    expect(screen.getByText("Impostor")).toBeDefined();
    expect(screen.getByText("🕵️")).toBeDefined();
    expect(screen.getByText("No recibes palabra")).toBeDefined();
  });

  test("reveals the impostor role after voting", () => {
    startRound();

    revealAllRoles();
    completeCluePhase();
    startVotingPhase();

    for (let index = 0; index < 4; index += 1) {
      const options = screen.getAllByRole("radio");
      fireEvent.click(options[0]!);
      fireEvent.click(screen.getByRole("button", { name: "Confirmar voto" }));
    }

    expect(screen.getByText("Rol revelado")).toBeDefined();
    expect(screen.getByText("Impostor")).toBeDefined();
    expect(screen.getAllByAltText(/Avatar de Jugador/i).length).toBeGreaterThan(0);
  });

  test("shows the manual word input when manual mode is selected", () => {
    openSetup();

    fireEvent.change(screen.getByLabelText("Modo de palabra secreta"), {
      target: { value: "manual" },
    });

    expect(screen.getByLabelText("Palabra secreta manual")).toBeDefined();
  });

  test("disables starting the round when manual mode has no word", () => {
    openSetup();

    fireEvent.change(screen.getByLabelText("Modo de palabra secreta"), {
      target: { value: "manual" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/);
    nameInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: `Jugador ${index + 1}` } });
    });

    expect(screen.getByRole("button", { name: "Empezar reparto" }).hasAttribute("disabled")).toBe(true);
  });

  test("starts a round with a manual word", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    openSetup();

    fireEvent.change(screen.getByLabelText("Modo de palabra secreta"), {
      target: { value: "manual" },
    });
    fireEvent.change(screen.getByLabelText("Palabra secreta manual"), {
      target: { value: "Gazpacho" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/);
    nameInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: `Jugador ${index + 1}` } });
    });

    fireEvent.click(screen.getByRole("button", { name: "Empezar reparto" }));
    fireEvent.click(screen.getByRole("button", { name: "Ver mi rol" }));

    expect(screen.getByText("Gazpacho")).toBeDefined();
  });

  test("shows the resume option when a saved session exists", async () => {
    saveSession(createSavedRoleDistributionSession());

    render(<GameShell />);

    expect(await screen.findByRole("button", { name: "Continuar partida" })).toBeDefined();
  });

  test("resumes into the persisted screen state", async () => {
    saveSession(createSavedRoleDistributionSession());

    render(<GameShell />);

    fireEvent.click(await screen.findByRole("button", { name: "Continuar partida" }));

    expect(screen.getByText("Pantalla oculta")).toBeDefined();
    expect(screen.getByRole("button", { name: "Ver mi rol" })).toBeDefined();
  });

  test("shows only tie-break candidates during tie-break voting", () => {
    startRound();
    revealAllRoles();
    completeCluePhase();
    startVotingPhase();

    voteForPlayer("Jugador 2");
    voteForPlayer("Jugador 1");
    voteForPlayer("Jugador 1");
    voteForPlayer("Jugador 2");

    expect(screen.getByText("Desempate secreto")).toBeDefined();
    expect(screen.queryByRole("button", { name: "← Volver al debate" })).toBeNull();
    expect(screen.queryByText("Jugador 3")).toBeNull();
    expect(screen.queryByText("Jugador 4")).toBeNull();
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    expect(screen.getByText("Jugador 2")).toBeDefined();
  });

  test("goes straight to the scoreboard when final guess is disabled", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    openSetup();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/);
    nameInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: `Jugador ${index + 1}` } });
    });

    fireEvent.click(screen.getByRole("button", { name: "Empezar reparto" }));
    revealAllRoles();
    completeCluePhase();
    startVotingPhase();

    voteForPlayer("Jugador 2");
    voteForPlayer("Jugador 1");
    voteForPlayer("Jugador 1");
    voteForPlayer("Jugador 1");

    expect(screen.getByRole("button", { name: "Ver marcador" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Ver marcador" }));

    expect(screen.getByText("Marcador")).toBeDefined();
    expect(screen.queryByText("Ultima oportunidad")).toBeNull();
  });

  test("confirms before aborting role distribution after a reveal", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    startRound();

    fireEvent.click(screen.getByRole("button", { name: "Ver mi rol" }));
    fireEvent.click(screen.getByRole("button", { name: "← Editar jugadores" }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Rol secreto")).toBeDefined();
    expect(screen.getByRole("button", { name: "Ocultar y pasar" })).toBeDefined();
  });

  test("autofills empty player names and enables starting the round", () => {
    openPlayerEntry();

    const startButton = screen.getByRole("button", { name: "Empezar reparto" });
    const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/) as HTMLInputElement[];

    fireEvent.change(nameInputs[0]!, { target: { value: "Ana" } });

    expect(startButton.hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Autorrellenar nombres" }));

    expect(nameInputs[0]!.value).toBe("Ana");
    expect(nameInputs[1]!.value).toBe("Jugador 2");
    expect(nameInputs[2]!.value).toBe("Jugador 3");
    expect(nameInputs[3]!.value).toBe("Jugador 4");
    expect(startButton.hasAttribute("disabled")).toBe(false);
  });

  test("counts down clue timer and resets on next clue", () => {
    vi.useFakeTimers();
    openSetup();

    fireEvent.change(screen.getByLabelText("Temporizador por pista"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/);
    nameInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: `Jugador ${index + 1}` } });
    });

    fireEvent.click(screen.getByRole("button", { name: "Empezar reparto" }));
    revealAllRoles();

    expect(screen.getByText("10s")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("9s")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByText("10s")).toBeDefined();
  });

  test("counts down debate timer", () => {
    vi.useFakeTimers();
    openSetup();

    fireEvent.change(screen.getByLabelText("Temporizador de debate"), {
      target: { value: "60" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/);
    nameInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: `Jugador ${index + 1}` } });
    });

    fireEvent.click(screen.getByRole("button", { name: "Empezar reparto" }));
    revealAllRoles();
    completeCluePhase();

    expect(screen.getByText("60s")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("59s")).toBeDefined();
  });

  test("returns from debate to the last clue screen", () => {
    startRound();
    revealAllRoles();
    completeCluePhase();

    fireEvent.click(screen.getByRole("button", { name: "← Volver a pistas" }));

    expect(screen.getByText("Pista 4/4")).toBeDefined();
    expect(screen.getByText("Pista de Jugador 4")).toBeDefined();
  });

  test("allows returning from voting to debate before any vote", () => {
    startRound();
    revealAllRoles();
    completeCluePhase();
    startVotingPhase();

    fireEvent.click(screen.getByRole("button", { name: "← Volver al debate" }));

    expect(screen.getByText("Debate")).toBeDefined();
    expect(screen.getByRole("button", { name: "Ir a votacion" })).toBeDefined();
  });

  test("hides the back action after the first primary vote", () => {
    startRound();
    revealAllRoles();
    completeCluePhase();
    startVotingPhase();

    voteForPlayer("Jugador 2");

    expect(screen.queryByRole("button", { name: "← Volver al debate" })).toBeNull();
  });

  test("finishes the game from the scoreboard", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    openSetup();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/);
    nameInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: `Jugador ${index + 1}` } });
    });

    fireEvent.click(screen.getByRole("button", { name: "Empezar reparto" }));
    revealAllRoles();
    completeCluePhase();
    startVotingPhase();

    voteForPlayer("Jugador 2");
    voteForPlayer("Jugador 1");
    voteForPlayer("Jugador 1");
    voteForPlayer("Jugador 1");
    fireEvent.click(screen.getByRole("button", { name: "Ver marcador" }));

    fireEvent.click(screen.getByRole("button", { name: "Finalizar partida" }));

    expect(screen.getByText("Fin de partida")).toBeDefined();
    expect(screen.getByRole("button", { name: "Nueva partida" })).toBeDefined();
  });

  test("renders a single winner on the finished screen", async () => {
    persistRawSession(createFinishedSession([5, 3, 2, 1]));

    render(<GameShell />);
    fireEvent.click(await screen.findByRole("button", { name: "Continuar partida" }));

    expect(screen.getByText("Gana Jugador 1")).toBeDefined();
    expect(screen.getByText("Partida completada. Estos son los puntos finales.")).toBeDefined();
  });

  test("renders shared winners on tie", async () => {
    persistRawSession(createFinishedSession([5, 5, 2, 1]));

    render(<GameShell />);
    fireEvent.click(await screen.findByRole("button", { name: "Continuar partida" }));

    expect(screen.getByText("Ganadores compartidos")).toBeDefined();
    expect(screen.getByText("Empate entre Jugador 1, Jugador 2.")).toBeDefined();
  });

  test("starts a fresh game from the finished screen", async () => {
    persistRawSession(createFinishedSession([5, 3, 2, 1]));

    render(<GameShell />);
    fireEvent.click(await screen.findByRole("button", { name: "Continuar partida" }));
    fireEvent.click(screen.getByRole("button", { name: "Nueva partida" }));

    expect(screen.getByText("Configura la partida")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Continuar partida" })).toBeNull();
  });
});
