import PageLayout from "@/layouts/PageLayout";
import { useState } from "react";

import FilterIcon from '@/assets/icons/filter.svg';
import FilterColorIcon from '@/assets/icons/filter_color.svg';
import ChatIcon from '@/assets/icons/chat.svg';
import ChatColorIcon from '@/assets/icons/chat_color.svg';
import TimeSquareIcon from '@/assets/icons/time_square.svg';
import TimeSquareColorIcon from '@/assets/icons/time_square_color.svg';
import TickSquareIcon from '@/assets/icons/tick_square.svg';
import TickSquareColorIcon from '@/assets/icons/tick_square_color.svg';
import InfoSquareIcon from '@/assets/icons/info_square.svg';
import InfoSquareColorIcon from '@/assets/icons/info_square_color.svg';
import DangerCircleIcon from '@/assets/icons/danger_circle.svg';

const TAB_LIST = [
    { label: '전체', count: 120, inactiveIcon: FilterIcon, activeIcon: FilterColorIcon },
    { label: '진행', count: 5, inactiveIcon: ChatIcon, activeIcon: ChatColorIcon },
    { label: '대기', count: 12, inactiveIcon: TimeSquareIcon, activeIcon: TimeSquareColorIcon },
    { label: '완료', count: 103, inactiveIcon: TickSquareIcon, activeIcon: TickSquareColorIcon },
    { label: '보류', count: 0, inactiveIcon: InfoSquareIcon, activeIcon: InfoSquareColorIcon },
];

const MOCK_CHAT_LIST = [
    { id: 1, name: '김스냅', time: '10:25', message: '해당 내용으로 가능할 지 확인 부탁드립니다. 내용이 길어지면 말줄임표가 나와야 합니다.', unread: 2, status: '대기' },
    { id: 2, name: '이웨딩', time: '09:12', message: '네 알겠습니다. 감사합니다!', unread: 0, status: '진행' },
    { id: 3, name: '박스튜디오', time: '어제', message: '일정 변경 문의 건입니다.', unread: 5, status: '진행' },
    { id: 4, name: '최스냅', time: '어제', message: '촬영 완료되었습니다.', unread: 0, status: '완료' },
];

const MOCK_MESSAGES = [
    { id: 1, sender: 'other', text: '안녕하세요, 견적 문의드립니다.', time: '10:20' },
    { id: 2, sender: 'me', text: '네 안녕하세요! 어떤 부분 확인해드릴까요?', time: '10:22' },
    { id: 3, sender: 'other', text: '해당 내용으로 가능할 지 확인 부탁드립니다. 내용이 길어지면 줄바꿈이 어떻게 되는지도 확인해야 하니까요. 텍스트 길이가 길어지면 아래쪽으로 말풍선이 늘어납니다.', time: '10:25' },
    { id: 4, sender: 'me', text: '네 확인 후 안내해드리겠습니다. 잠시만 기다려주세요. 위쪽 여백은 고정되고 글이 길어지면 아래로 박스가 늘어납니다.', time: '10:30' },
];

function ChatPage() {
    const [tabIndex, setTabIndex] = useState(0);
    const [selectedChat, setSelectedChat] = useState<number | null>(null);

    const handleSearch = () => {
        console.log('search');
    };

    const renderChatList = () => {
        const currentTabLabel = TAB_LIST[tabIndex].label;
        const filteredList = currentTabLabel === '전체'
            ? MOCK_CHAT_LIST
            : MOCK_CHAT_LIST.filter(chat => chat.status === currentTabLabel);

        if (filteredList.length === 0) {
            return (
                <div className="mt-[267px] flex flex-col items-center gap-[25px]">
                    <img src={DangerCircleIcon} alt="경고" className="w-[74px] h-[74px]" />
                    <p className="font-medium text-[14px] text-[#000000] text-center">대화 내역이 없습니다.<br /> 기간과 기준, 필터를 확인하고 다시 조회해주세요.</p>
                </div>
            );
        }

        return filteredList.map((chat) => (
            <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`flex flex-col items-start justify-between w-full h-[123px] pt-[39px] box-border pb-[23px] pl-[18px] pr-[23px] border-b border-[#D9D9D9] hover:bg-gray-50 transition-colors ${selectedChat === chat.id ? 'bg-[#F2FDF9]' : ''}`}
            >
                <div className="flex items-center w-full justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-[16px] text-[#000000]">{chat.name}</h2>
                        {chat.unread > 0 && (
                            <div className="w-[6px] h-[6px] rounded-full bg-[#FF0000]" />
                        )}
                    </div>
                    <span className="font-[500] text-[14px] text-[#000000]">{chat.time}</span>
                </div>
                <p className="font-[500] text-[14px] text-[#AAAAAA] w-full text-left truncate">{chat.message}</p>
            </button>
        ));
    };

    const renderMessages = () => {
        return MOCK_MESSAGES.map((msg) => {
            const isMe = msg.sender === 'me';

            return (
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                    <div className="flex flex-col max-w-[372px]">
                        <div
                            className={`px-[22px] pt-[18px] pb-[12px] break-words ${isMe
                                ? 'bg-[#00A980] text-white rounded-[15px] rounded-br-[0px]'
                                : 'bg-white text-[#000000] rounded-[15px] rounded-bl-[0px] border border-[#D9D9D9]'
                                }`}
                        >
                            <p className="font-[500] text-[16px] whitespace-pre-wrap leading-[24px]">{msg.text}</p>

                            <div className="flex w-full mt-[6px] justify-end">
                                <span className={`text-[12px] font-[500] ${isMe ? 'text-white' : 'text-[#AAAAAA]'}`}>{msg.time}</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <PageLayout title="채팅 목록" onSearch={handleSearch} searchPlaceholder="대화내용, 닉네임, 태그 검색" noScroll>
            {/* 전체 컨테이너를 가로로 분할 */}
            <div className="flex flex-row w-full h-full min-h-0">

                {/* 1. 왼쪽 사이드바 (채팅 목록) */}
                <div className="flex flex-col h-full w-[413px] pt-[23px] box-border bg-white flex-shrink-0">
                    <div className="w-full h-[56px] relative flex-shrink-0">
                        <div className="absolute w-full h-full left-0 top-0 flex z-10">
                            {TAB_LIST.map((tab, index) => {
                                const displayCount = tab.count > 99 ? '99+' : tab.count;
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setTabIndex(index)}
                                        className={`h-full w-full flex flex-col items-center gap-[5px] box-border ${tabIndex === index ? 'border-b-2 border-[#00A980]' : ''}`}
                                    >
                                        <img src={tabIndex === index ? tab.activeIcon : tab.inactiveIcon} alt={tab.label} className="w-[24px] h-[24px]" />
                                        <span className={`font-medium text-[14px] ${tabIndex === index ? 'text-[#00A980]' : 'text-[#2F2C2B]'}`}>
                                            {tab.label} {displayCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="absolute w-full h-[1px] bg-[#D9D9D9] bottom-0 left-0" />
                    </div>

                    <div className="flex-1 min-h-0 w-full overflow-y-auto">
                        {renderChatList()}
                    </div>
                </div>

                {selectedChat && (
                    <div className="flex-1 h-full min-h-0 flex flex-col bg-white border-l border-[#D9D9D9]">
                        <div className="h-[79px] min-h-[79px] border-b border-[#D9D9D9] flex items-center pl-[29px] box-border">
                            <h1 className="font-bold text-[#000000] text-[24px]">
                                {MOCK_CHAT_LIST.find(c => c.id === selectedChat)?.name}
                            </h1>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto px-[51px] pt-[24px]">
                            {renderMessages()}
                        </div>

                        <div className="h-[80px] min-h-[80px] border-t border-[#D9D9D9] bg-white px-[51px] flex items-center justify-center">
                            <span className="text-gray-400">메시지 입력 창 영역 (준비중)</span>
                        </div>
                    </div>
                )}

            </div>
        </PageLayout>
    );
}

export default ChatPage;
