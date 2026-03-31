import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Navbar } from "./Navbar";

const meta: Meta<typeof Navbar> = {
  title: "Landing/Navbar",
  component: Navbar,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof Navbar>;

export const Default: Story = {};
export const WithBackground: Story = {
  decorators: [
    (Story) => (
      <div style={{ paddingTop: "200px", background: "#F8F7FF" }}>
        <Story />
      </div>
    ),
  ],
};
