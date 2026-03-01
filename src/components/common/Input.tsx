import React, { forwardRef } from "react";
import clsx from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
    <input
        ref={ref}
        className={clsx(
            "w-[472px] h-[46px] border border-[#33333340] outline-none rounded-[4px] pl-[15px] box-border text-[16px] font-[500] text-[#000000] placeholder:text-[#33333340] focus:border-[#00A980] focus:outline-none",
            className
        )}
        {...props}
    />
));
Input.displayName = "Input";
