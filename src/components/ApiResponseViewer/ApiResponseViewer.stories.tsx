import type { Meta, StoryObj } from "@storybook/react";
import { ApiResponseViewer } from "./ApiResponseViewer";
import devServerDiagnostics from "../CodeBlock/__fixtures__/dev-server-diagnostics";

const meta: Meta<typeof ApiResponseViewer> = {
  title: "Components/ApiResponseViewer",
  component: ApiResponseViewer,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  argTypes: {
    body: { control: false },
    headers: { control: false },
    codeView: { control: false },
    theme: { control: false },
  },
};
export default meta;
type Story = StoryObj<typeof ApiResponseViewer>;

/** Dev-server diagnostics returned from a local tooling endpoint. */
export const DevServerDiagnostics: Story = {
  args: {
    status: 200,
    method: "GET",
    url: "http://localhost:5173/__dev/diagnostics",
    durationMs: 48,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-request-id": "req_8f3a2c1b",
    },
    body: devServerDiagnostics,
    codeView: { height: "520px" },
  },
};

/** Compact success payload without headers. */
export const Success200: Story = {
  args: {
    status: 200,
    method: "GET",
    url: "https://api.example.com/v1/users/u_42",
    durationMs: 124,
    body: {
      id: "u_42",
      email: "dev@example.com",
      role: "admin",
      created_at: "2024-03-15T09:12:00.000Z",
    },
    codeView: { maxHeight: "320px" },
  },
};

/** Client error with minimal detail. */
export const NotFound404: Story = {
  args: {
    status: 404,
    method: "GET",
    url: "https://api.example.com/v1/orders/ORD-MISSING",
    durationMs: 89,
    headers: {
      "content-type": "application/json",
    },
    body: {
      error: {
        code: "resource_not_found",
        message: "Order ORD-MISSING does not exist.",
      },
    },
  },
};

/** Server error response. */
export const ServerError500: Story = {
  args: {
    status: 500,
    method: "POST",
    url: "https://api.example.com/v1/checkout",
    durationMs: 1204,
    headers: {
      "content-type": "application/json",
    },
    body: {
      error: {
        code: "internal_error",
        message: "An unexpected error occurred. Reference: err_9xk2.",
      },
    },
    codeView: { defaultCollapsed: true },
  },
};
