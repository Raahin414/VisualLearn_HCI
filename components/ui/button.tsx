"use client";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useSyncExternalStore, type ComponentProps } from "react";
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
const styles = cva("button", {
  variants: {
    variant: {
      default: "button-primary",
      outline: "button-outline",
      ghost: "button-ghost",
    },
    size: { default: "", sm: "button-sm", icon: "button-icon" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
export function Button({
  className,
  variant,
  size,
  asChild = false,
  disabled,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof styles> & { asChild?: boolean }) {
  // Native links work before hydration; callback/form buttons do not. Keep
  // those disabled until handlers exist (including immediately after MFA).
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(styles({ variant, size }), className)} disabled={asChild ? disabled : disabled || !hydrated} {...props} />
  );
}
