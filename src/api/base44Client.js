export const base44 = {
  auth: {
    me: async () => {
      console.log("Local Mode: Returning mock user data");
      return {
        id: "local-user-123",
        email: "dev@local.test",
        name: "Local Developer",
        role: "admin",
      };
    },
    logout: () => console.log("Logged out locally"),
  },
  // Add other mock entities if needed
  entities: {
    User: {
      get: async () => ({}),
    },
  },
};
