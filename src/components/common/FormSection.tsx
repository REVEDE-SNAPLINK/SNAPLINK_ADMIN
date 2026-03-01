import React from "react";

interface FormSectionProps {
    title: string;
    required?: boolean;
    description?: string;
    children: React.ReactNode;
}

export function FormSection({ title, required, description, children }: FormSectionProps) {
    return (
        <div className="flex pl-[33px] pt-[23px] pb-[31px] bg-white gap-[15px]">
            <h1 className="text-[20px] font-bold leading-[46px] whitespace-nowrap">
                {title}
                {required && <span className="text-[#FF0000]">*</span>}
            </h1>
            <div className="flex flex-col">
                {children}
                {description && (
                    <p className="text-[16px] text-[#00A980] font-[500] mt-[23px] whitespace-pre-line">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
