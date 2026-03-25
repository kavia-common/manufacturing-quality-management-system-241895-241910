import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DefectsPage from "./pages/DefectsPage";

// DefectsPage uses confirm() for delete; define it to avoid ReferenceError in jsdom.
beforeAll(() => {
  // eslint-disable-next-line no-global-assign
  confirm = jest.fn(() => false);
});

describe("DefectsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("loads and renders defects table rows", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({
        items: [
          { id: "d1", title: "Scratch on housing", line: "Line A", severity: "High", status: "Open" },
          { id: "d2", title: "Loose screw", line: "Line B", severity: "Low", status: "Closed" },
        ],
      }),
    });

    render(
      <MemoryRouter>
        <DefectsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/2 defect\(s\)/i)).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    expect(within(table).getByText(/scratch on housing/i)).toBeInTheDocument();
    expect(within(table).getByText(/loose screw/i)).toBeInTheDocument();
  });

  test("filters by search query", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({
        items: [
          { id: "d1", title: "Scratch on housing", line: "Line A", severity: "High", status: "Open" },
          { id: "d2", title: "Loose screw", line: "Line B", severity: "Low", status: "Closed" },
        ],
      }),
    });

    render(
      <MemoryRouter>
        <DefectsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 defect\(s\)/i)).toBeInTheDocument();
    });

    // type into Search input
    const search = screen.getByPlaceholderText(/title, line/i);
    fireEvent.change(search, { target: { value: "screw" } });

    await waitFor(() => {
      expect(screen.getByText(/1 defect\(s\)/i)).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    expect(within(table).queryByText(/scratch on housing/i)).not.toBeInTheDocument();
    expect(within(table).getByText(/loose screw/i)).toBeInTheDocument();
  });
});
