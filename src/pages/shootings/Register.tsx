import PageLayout from "@/layouts/PageLayout";
import { useState, useRef } from "react";
import { useDaumPostcodePopup } from "react-daum-postcode";
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale/ko";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("ko", ko);

import { FormSection } from "@/components/common/FormSection";
import { Input } from "@/components/common/Input";
import { DateInput } from "@/pages/shootings/components/DateInput";

// --- Main Page ---

function Register() {
    const [baseAddress, setBaseAddress] = useState("");
    const [detailAddress, setDetailAddress] = useState("");
    const detailAddressRef = useRef<HTMLInputElement>(null);

    const openPostcode = useDaumPostcodePopup();

    const handleCompletePostcode = (data: { address: string; addressType: string; bname: string; buildingName: string }) => {
        let fullAddress = data.address;
        let extraAddress = "";

        if (data.addressType === "R") {
            if (data.bname !== "") extraAddress += data.bname;
            if (data.buildingName !== "") {
                extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
        }
        setBaseAddress(fullAddress);
        if (detailAddressRef.current) {
            detailAddressRef.current.focus();
        }
    };

    const handleClickBaseAddress = () => {
        openPostcode({ onComplete: handleCompletePostcode });
    };

    // Date Time State
    const [startDate, setStartDate] = useState<Date | null>(() => {
        const now = new Date();
        now.setSeconds(0, 0);
        return now;
    });

    const [endDate, setEndDate] = useState<Date | null>(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setSeconds(0, 0);
        return now;
    });

    return (
        <PageLayout title="촬영 등록">
            <div className="flex flex-col gap-[25px] w-full">
                <FormSection
                    title="신청자"
                    required
                    description="신청한 담당자의 이름이나 신청 단체 기관 이름을 작성해주세요."
                >
                    <Input />
                </FormSection>

                <FormSection
                    title="촬영일시"
                    required
                    description={"촬영이 필요한 시점부터 완료되는 시점을 설정해주세요.\n이후 기간 내 세부 조정이 필요한 사항은 소통한 이후 세부 내용은 별도 기입하여 관리해주세요."}
                >
                    <div className="flex items-center gap-[15px] h-[46px]">
                        <DatePicker
                            selected={startDate}
                            onChange={(date: Date | null) => setStartDate(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy.MM.dd HH:mm"
                            locale="ko"
                            customInput={<DateInput />}
                            popperPlacement="bottom-start"
                            portalId="root-portal"
                        />

                        <div className="bg-[#33333340] w-[15px] h-[1px]" />

                        <DatePicker
                            selected={endDate}
                            onChange={(date: Date | null) => setEndDate(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy.MM.dd HH:mm"
                            locale="ko"
                            customInput={<DateInput />}
                            popperPlacement="bottom-start"
                            portalId="root-portal"
                        />
                    </div>
                </FormSection>

                <FormSection
                    title="촬영장소"
                    required
                    description="촬영이 필요한 장소 혹은 인근 랜드마크 등 상세한 위치를 직접 설정해주세요."
                >
                    <Input
                        placeholder="기본 주소"
                        value={baseAddress}
                        onClick={handleClickBaseAddress}
                        readOnly
                        className="cursor-pointer"
                    />
                    <Input
                        ref={detailAddressRef}
                        placeholder="상세 주소"
                        value={detailAddress}
                        onChange={(e) => setDetailAddress(e.target.value)}
                        className="mt-[10px]"
                    />
                </FormSection>

                <FormSection
                    title="촬영등급"
                    required
                    description="신청한 담당자의 이름이나 신청 단체 기관 이름을 작성해주세요."
                >
                    <Input />
                </FormSection>

                <FormSection
                    title="배정작가"
                    required
                    description="신청한 담당자의 이름이나 신청 단체 기관 이름을 작성해주세요."
                >
                    <Input placeholder="작가 선택" />
                </FormSection>
            </div>
        </PageLayout>
    );
}

export default Register;
