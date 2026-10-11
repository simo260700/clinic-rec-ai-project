import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-zinc-900 text-white shadow-xs hover:bg-zinc-800 disabled:bg-zinc-300",
  secondary: "bg-white text-zinc-800 ring-1 ring-inset ring-zinc-200 shadow-xs hover:bg-zinc-50 disabled:text-zinc-400 disabled:hover:bg-white",
  danger: "bg-white text-rose-700 ring-1 ring-inset ring-rose-200 shadow-xs hover:bg-rose-50 disabled:text-zinc-400 disabled:ring-zinc-200 disabled:hover:bg-white",
  dangerSolid: "bg-rose-600 text-white shadow-xs hover:bg-rose-700",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
} as const;

const sizes = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
  icon: "size-9",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ variant = "secondary", size = "md", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
