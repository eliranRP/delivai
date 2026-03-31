import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pricing } from "./Pricing";

const meta: Meta<typeof Pricing> = {
  title: "Landing/Pricing",
  component: Pricing,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof Pricing>;

export const Default: Story = {};
