import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/assets/icons/logo/logo_text.svg';
import ArrowRightIcon from '@/assets/icons/arrow_right.svg';
import { useState } from 'react';

function LoginPage() {
    const navigate = useNavigate();

    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setId(e.target.value);
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    }

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        useAuthStore.setState({
            status: 'authed',
            accessToken: 'mock_access_token',
            userId: id || 'admin',
            bootstrapped: true
        });
        localStorage.setItem('snaplink_access_token', 'mock_access_token');

        navigate('/dashboard');
    }

    const handleAccountRequest = () => {
        console.log('handleAccountRequest');
    }

    const handleAccountFind = () => {
        console.log('handleAccountFind');
    }

    return (
        <div className="flex items-center justify-center w-full h-screen">
            <div className="flex flex-col items-center">
                <img src={Logo} alt="SnapLink" className="w-[245px] h-[56px] mb-[88px]" />
                <form onSubmit={handleLogin} className="flex flex-col gap-[22px] w-[362px] mb-[58px]">
                    <input type="text" placeholder="아이디를 입력해 주세요." className="w-full h-[56px] border border-[#33333340] rounded-[4px] text-center text-[16px] font-[500] placeholder:text-[#33333340] text-[#000000] focus:border-[#00A980] focus:border-[2px] focus:outline-none" onChange={handleIdChange} value={id} />
                    <input type="password" placeholder="비밀번호를 입력해 주세요." className="w-full h-[56px] border border-[#33333340] rounded-[4px] text-center text-[16px] font-[500] placeholder:text-[#33333340] text-[#000000] focus:border-[#00A980] focus:border-[2px] focus:outline-none" onChange={handlePasswordChange} value={password} />
                    <button type="submit" className="w-full h-[56px] bg-[#00A980] rounded-[4px] text-white text-[16px] font-[500]">로그인</button>
                </form>
                <div className="w-[362px] flex flex-col gap-[12px] pt-[15px] border-t border-[#33333340]">
                    <button type="button" className="flex items-center justify-between" onClick={handleAccountRequest}>
                        <span className="text-[14px] font-[500] text-[#33333340]">서비스를 관리 하고 싶으신가요?</span>
                        <div className="flex items-center gap-[12px]">
                            <span className="text-[14px] font-[500] text-[#000000] letter-spacing-[-0.6px]">계정 요청하기</span>
                            <img src={ArrowRightIcon} alt="이동" />
                        </div>
                    </button>
                    <button type="button" className="flex items-center justify-between" onClick={handleAccountFind}>
                        <span className="text-[14px] font-[500] text-[#33333340]">계정을 찾고 싶으신가요?</span>
                        <div className="flex items-center gap-[12px]">
                            <span className="text-[14px] font-[500] text-[#000000] letter-spacing-[-0.6px]">계정 찾기</span>
                            <img src={ArrowRightIcon} alt="이동" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LoginPage;
