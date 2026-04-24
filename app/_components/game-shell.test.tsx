import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GameShell } from "@/app/_components/game-shell";

function openPlayerEntry() {
  render(<GameShell />);

  fireEvent.click(screen.getByRole("button", { name: "Nueva partida" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
}

function startRound() {
  openPlayerEntry();

  const nameInputs = screen.getAllByPlaceholderText(/Jugador \d+/);
  nameInputs.forEach((input, index) => {
    fireEvent.change(input, { target: { value: `Jugador ${index + 1}` } });
  });

  fireEvent.click(screen.getByRole("button", { name: "Empezar reparto" }));
}

describe("GameShell roles", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test("shows assigned avatars on player entry", () => {
    openPlayerEntry();

    expect(screen.getAllByAltText(/Avatar de jugador/i).length).toBeGreaterThan(0);
  });

  test("shows citizen role and the secret word during role distribution", () => {
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

    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Ver mi rol" }));
      fireEvent.click(screen.getByRole("button", { name: "Ocultar y pasar" }));
    }

    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    }

    fireEvent.click(screen.getByRole("button", { name: "Ir a votacion" }));

    for (let index = 0; index < 4; index += 1) {
      const options = screen.getAllByRole("radio");
      fireEvent.click(options[0]!);
      fireEvent.click(screen.getByRole("button", { name: "Confirmar voto" }));
    }

    expect(screen.getByText("Rol revelado")).toBeDefined();
    expect(screen.getByText("Impostor")).toBeDefined();
    expect(screen.getAllByAltText(/Avatar de Jugador/i).length).toBeGreaterThan(0);
  });
});
