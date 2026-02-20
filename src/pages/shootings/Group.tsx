export default function GroupShooting() {
    return (
        <div className="pl-[32px] pt-[31px] pr-[36px] pb-[58px]">
            <h1 className="ml-[5px] text-black font-bold text-[26px] mb-[28px]">단체 행사 촬영 접수 내역</h1>
            <div className="flex w-full h-[140px] bg-white mb-[22px] pl-[220px] box-border items-center gap-[92px]">
                <div className="flex flex-col  gap-[2px] items-center">
                    <span className="text-[20px] text-black">전체</span>
                    <span className="text-[16px] text-black">
                        <span className="text-[24px] mr-[2px]">0</span>
                        건
                    </span>
                </div>
                <div className="flex flex-col  gap-[2px] items-center">
                    <span className="text-[20px] text-black">촬영 대기</span>
                    <span className="text-[16px] text-black">
                        <span className="text-[24px] mr-[2px]">0</span>
                        건
                    </span>
                </div>
                <div className="flex flex-col  gap-[2px] items-center">
                    <span className="text-[20px] text-black">촬영 중</span>
                    <span className="text-[16px] text-black">
                        <span className="text-[24px] mr-[2px]">0</span>
                        건
                    </span>
                </div>
                <div className="flex flex-col  gap-[2px] items-center">
                    <span className="text-[20px] text-black">촬영 취소</span>
                    <span className="text-[16px] text-black">
                        <span className="text-[24px] mr-[2px]">0</span>
                        건
                    </span>
                </div>
                <div className="flex flex-col  gap-[2px] items-center">
                    <span className="text-[20px] text-black">촬영 종료</span>
                    <span className="text-[16px] text-black">
                        <span className="text-[24px] mr-[2px]">0</span>
                        건
                    </span>
                </div>
            </div>
            <div className="flex w-full h-[222px] bg-white mb-[32px] box-border"></div>
            <div className="pt-[33px] pl-[61px] pr-[61px] pb-[61px] w-full h-[672px] bg-white box-border">
                <h2 className="text-[20px] text-black mb-[24px]">촬영 목록 (총 0개)</h2>
                <div className="flex w-full items-center gap-[40px]">
                    <div className="text-[16px] text-black font-normal w-[150px] text-center">접수 번호</div>
                    <div className="text-[16px] text-black font-normal w-[150px] text-center">신청자</div>
                    <div className="text-[16px] text-black font-normal w-[150px] text-center">희망 촬영일시</div>
                    <div className="text-[16px] text-black font-normal w-[150px] text-center">촬영장소</div>
                    <div className="text-[16px] text-black font-normal w-[150px] text-center">촬영등급</div>
                    <div className="text-[16px] text-black font-normal w-[150px] text-center">배정 작가</div>
                    <div className="text-[16px] text-black font-normal w-[150px] text-center">처리상태</div>
                </div>
            </div>
        </div>
    )
}