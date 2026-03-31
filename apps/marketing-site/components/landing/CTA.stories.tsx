import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CTA } from "./CTA";

const meta: Meta<typeof CTA> = {
  title: "Landing/CTA",
  component: CTA,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof CTA>;

export const Default: Story = {};
