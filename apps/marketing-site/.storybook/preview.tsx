import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#F8F7FF" },
        { name: "white", value: "#ffffff" },
        { name: "dark", value: "#1A1A2E" },
      ],
    },
    a11y: { test: "todo" },
  },
  decorators: [
    (Story) => (
      <div
        className="font-body antialiased"
        style={{ fontFamily: "Inter, -apple-system, sans-serif" }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
