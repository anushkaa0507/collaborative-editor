import { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-transparent border-b-2 border-outline focus:border-primary transition-colors py-2 outline-none ${className}`}
      {...props}
    />
  );
}