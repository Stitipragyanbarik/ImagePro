import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, test, expect, vi } from "vitest";

import Login from "../pages/Login";

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe("Login Page  Tests", () => {
  test("renders without crashing", () => {
    const { container } = renderLogin();
    expect(container).toBeInTheDocument();
  });

  test("renders email and password inputs", () => {
    renderLogin();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test("allows typing in email and password inputs", () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  test("renders Log In button", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /Log In/i })).toBeInTheDocument();
  });

  test("renders create account link", () => {
    renderLogin();
    expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
  });
});
