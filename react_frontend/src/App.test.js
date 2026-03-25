import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login page when unauthenticated", () => {
  render(<App />);
  expect(screen.getByText(/sign in/i)).toBeInTheDocument();
});
