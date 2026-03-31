import { useEffect, useRef, useState } from "react";
import { Text } from "@shopify/polaris";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}

export function AnimatedCounter({ value, duration = 800, format }: AnimatedCounterProps) {
  const [displayed, setDisplayed] = useState(0);
  const startRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = displayed;
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayed(Math.round(startRef.current + (value - startRef.current) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const label = format ? format(displayed) : String(displayed);

  return (
    <Text as="span" variant="headingXl" fontWeight="bold">
      {label}
    </Text>
  );
}
