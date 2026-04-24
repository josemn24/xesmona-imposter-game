import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Screen } from "@/app/_components/ui";

describe("Screen", () => {
  test("renders no back button by default", () => {
    render(
      <Screen title="Pantalla">
        <p>Contenido</p>
      </Screen>,
    );

    expect(screen.queryByRole("button", { name: "← Volver" })).toBeNull();
  });

  test("renders the configured back action", () => {
    render(
      <Screen
        backAction={{ label: "Volver", onClick: vi.fn() }}
        title="Pantalla"
      >
        <p>Contenido</p>
      </Screen>,
    );

    expect(screen.getByRole("button", { name: "← Volver" })).toBeDefined();
  });
});
