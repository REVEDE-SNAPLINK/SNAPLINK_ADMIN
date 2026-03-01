import SearchIcon from '@/assets/icons/search.svg';
import CancelIcon from '@/assets/icons/cancel.svg';
import { useState } from 'react';

interface SearchInputFieldProps {
    placeholder?: string;
    onSearch: (value: string) => void;
}

function SearchInputField({ placeholder = "검색어를 입력하세요.", onSearch }: SearchInputFieldProps) {
    const [value, setValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onSearch(e.target.value);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setValue('');
        onSearch('');
    };

    const handleFocus = (e: React.FocusEvent) => {
        e.stopPropagation();
        setIsFocused(true);
    };

    const handleBlur = (e: React.FocusEvent) => {
        e.stopPropagation();
        setIsFocused(false);
    };

    return (
        <div className="flex items-center border border-[#242424] rounded-[5px] px-[10px] box-border h-full w-[320px] gap-[10px]" style={{ borderColor: isFocused ? '#00A980' : '#242424' }}>
            <img src={SearchIcon} className='w-[24px] h-[24px]' />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                className="focus:outline-none focus:border-transparent w-full bg-transparent placeholder:text-[#717171] font-[500] text-[16px] text-[#242424]"
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleValueChange}
            />
            {value && <img src={CancelIcon} onClick={handleCancel} className='w-[16px] h-[16px]' />}
        </div>
    );
}

export default SearchInputField;
