import SearchInputField from "@/components/common/SearchInputField";

interface PageLayoutProps {
    title: string;
    children: React.ReactNode;
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
}

function PageLayout({ title, children, searchPlaceholder, onSearch }: PageLayoutProps) {
    return (
        <div className="w-full h-full pl-[32px] pr-[36px] pt-[31px] overflow-y-auto pb-[50px] bg-[#EDF0F5] box-border">
            <div className="w-full flex items-center justify-between h-[44px] mb-[22px]">
                <h1 className="text-[26px] font-[#000] font-bold">{title}</h1>
                {onSearch !== undefined && (
                    <SearchInputField
                        placeholder={searchPlaceholder}
                        onSearch={onSearch}
                    />
                )}
            </div>
            {children}
        </div>
    );
}

export default PageLayout;
