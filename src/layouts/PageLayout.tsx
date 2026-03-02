import SearchInputField from "@/components/common/SearchInputField";

interface PageLayoutProps {
    title: string;
    children: React.ReactNode;
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    noScroll?: boolean;
}

function PageLayout({ title, children, searchPlaceholder, onSearch, noScroll = false }: PageLayoutProps) {
    return (
        <div className={`w-full h-full pl-[32px] pr-[36px] pt-[31px] bg-[#EDF0F5] box-border flex flex-col ${noScroll ? 'overflow-hidden pb-[31px]' : 'overflow-y-auto pb-[50px]'}`}>
            <div className="w-full flex items-center justify-between h-[44px] mb-[22px] flex-shrink-0">
                <h1 className="text-[26px] font-[#000] font-bold">{title}</h1>
                {onSearch !== undefined && (
                    <SearchInputField
                        placeholder={searchPlaceholder}
                        onSearch={onSearch}
                    />
                )}
            </div>
            {noScroll ? (
                <div className="flex-1 min-h-0 w-full flex flex-col h-full">
                    {children}
                </div>
            ) : children}
        </div>
    );
}

export default PageLayout;
