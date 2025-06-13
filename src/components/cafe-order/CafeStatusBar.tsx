import { CafeSetting } from '@/model/model';

interface CafeStatusBarProps {
  isCafeOpen: boolean;
  currentTime: Date;
  cafeSetting: CafeSetting;
}

export function CafeStatusBar({ isCafeOpen, currentTime, cafeSetting }: CafeStatusBarProps) {
  const formatTime = (timeString: string) => {
    if (!timeString) return '';

    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour === 12 ? 12 : hour % 12;
    const minuteStr2 = minute === 0 ? '' : ` ${minute}분`;

    return `${period} ${displayHour}시${minuteStr2}`;
  };

  // 영업일 표시
  const formatOpenDays = () => {
    if (cafeSetting.openDays.length === 7) return '매일';
    if (cafeSetting.openDays.length === 0) return '영업일 없음';

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return cafeSetting.openDays.map((day) => dayNames[day]).join(', ');
  };

  return (
    <div
      className={`mb-4 p-3 rounded-lg text-sm ${isCafeOpen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
    >
      <div className='flex items-center justify-between'>
        <div>
          <p className='font-medium'>{isCafeOpen ? '영업 중' : '영업 종료'}</p>
          <p className='text-xs mt-1'>
            주문 가능 시간: {formatOpenDays()} {formatTime(cafeSetting.openingTime)} -{' '}
            {formatTime(cafeSetting.closingTime)}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-xs'>
            현재 시간:{' '}
            {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}
