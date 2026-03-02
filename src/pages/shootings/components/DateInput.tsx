import React, { forwardRef } from "react";
import CalendarIcon from "@/assets/icons/calendar.svg";

export const DateInput = forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { value?: string, onClick?: () => void, onChange?: React.ChangeEventHandler<HTMLInputElement> }>(
    ({ value, onClick, onChange }, ref) => (
        <div
            ref={ref}
            className="px-[15px] flex items-center justify-between border border-[#33333340] h-[46px] rounded-[4px] min-w-[210px] cursor-pointer"
            onClick={onClick}
        >
            <input
                value={value}
                onChange={onChange}
                className="bg-transparent outline-none text-[16px] font-[500] text-[#000000] w-[140px] text-center cursor-pointer pointer-events-none"
                placeholder="YYYY.MM.DD HH:mm"
                readOnly
            />
            <img src={CalendarIcon} alt="calendar" className="w-[24px] h-[24px]" />
        </div>
    )
);
DateInput.displayName = "DateInput";
