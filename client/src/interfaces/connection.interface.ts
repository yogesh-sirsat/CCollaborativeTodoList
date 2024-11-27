// Define the connection statuses and their messages
export const connectionStatuses = {
  connecting: "You are connecting",
  connected: "You are connected",
  disconnected: "You are disconnected",
  reconnected: "You are reconnected",
  reconnecting: "You are reconnecting",
  error: "An error occurred during connection",
} as const;

export type ConnectionStatusMessage = (typeof connectionStatuses)[keyof typeof connectionStatuses];

