import { useState } from 'react';
import { Send, MoreVertical, Image as ImageIcon, Paperclip } from 'lucide-react';

const MOCK_ROOMS = [
    { id: 1, name: '강남구 행사 촬영 문의', message: '견적서 확인 부탁드립니다.', time: '10:30', unread: 2 },
    { id: 2, name: '기업 홍보 영상 문의', message: '네 알겠습니다.', time: '어제', unread: 0 },
    { id: 3, name: '웨딩 스냅 예약', message: '날짜 변경 가능한가요?', time: '어제', unread: 1 },
];

const MOCK_MESSAGES = [
    { id: 1, sender: 'user', text: '안녕하세요, 견적서 확인 부탁드립니다.', time: '10:30' },
    { id: 2, sender: 'admin', text: '네 확인 후 연락드리겠습니다.', time: '10:31' },
];

export default function ChatPage() {
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputValue, setInputValue] = useState('');

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        setMessages([...messages, {
            id: messages.length + 1,
            sender: 'admin',
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setInputValue('');
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Chat List (Left) */}
            <div className="w-[350px] border-r border-gray-200 bg-white flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-bold text-xl">채팅 목록</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {MOCK_ROOMS.map((room) => (
                        <div
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedRoomId === room.id ? 'bg-green-50' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-gray-900">{room.name}</h3>
                                <span className="text-xs text-gray-500">{room.time}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500 truncate w-[220px]">{room.message}</p>
                                {room.unread > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {room.unread}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Room (Right) */}
            <div className="flex-1 flex flex-col bg-gray-50">
                {selectedRoomId ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                            <h2 className="font-bold text-lg">
                                {MOCK_ROOMS.find(r => r.id === selectedRoomId)?.name}
                            </h2>
                            <button className="text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'admin'
                                        ? 'bg-[#00A980] text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                                        }`}>
                                        <p className="text-[16px] leading-relaxed">{msg.text}</p>
                                        <div className={`text-[11px] mt-1 text-right ${msg.sender === 'admin' ? 'text-green-100' : 'text-gray-400'}`}>
                                            {msg.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="bg-white p-4 border-t border-gray-200">
                            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-[#00A980] focus-within:ring-1 focus-within:ring-[#00A980] transition-colors">
                                <button className="p-2 text-gray-400 hover:text-gray-600">
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <textarea
                                    className="flex-1 bg-transparent border-none resize-none focus:ring-0 max-h-[120px] py-2"
                                    placeholder="메시지를 입력하세요..."
                                    rows={1}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className={`p-2 rounded-lg transition-colors ${inputValue.trim() ? 'bg-[#00A980] text-white' : 'bg-gray-200 text-gray-400'}`}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                            <Send className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg">채팅방을 선택해주세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
