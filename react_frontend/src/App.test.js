import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login page when unauthenticated", () => {
  render(<App />);
  // "Sign in" appears in multiple places (title + button). Use an unambiguous query.
  expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
});
