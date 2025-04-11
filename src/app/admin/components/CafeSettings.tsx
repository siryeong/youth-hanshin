'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { CafeSetting } from '@/model/model';

const DAYS_OF_WEEK = [
  { value: 0, label: '일요일' },
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' },
];

export default function CafeSettings() {
  const [settings, setSettings] = useState<CafeSetting>({
    id: 0,
    openingTime: '10:00:00',
    closingTime: '14:00:00',
    openDays: [0],
    createdAt: '',
    updatedAt: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 시간 입력을 위한 로컬 상태 추가
  const [openingHour, setOpeningHour] = useState<number>(10);
  const [openingMinute, setOpeningMinute] = useState<number>(0);
  const [closingHour, setClosingHour] = useState<number>(14);
  const [closingMinute, setClosingMinute] = useState<number>(0);

  // 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/cafe-settings');
        if (!response.ok) {
          throw new Error('카페 설정을 불러오는데 실패했습니다.');
        }
        const data = await response.json();

        // 데이터 유효성 검사 및 기본값 설정
        const validatedData = {
          openingTime: data.openingTime || '10:00:00',
          closingTime: data.closingTime || '14:00:00',
          openDays: Array.isArray(data.openDays) ? data.openDays : [0],
        };

        setSettings({
          id: 0,
          openingTime: validatedData.openingTime,
          closingTime: validatedData.closingTime,
          openDays: validatedData.openDays,
          createdAt: '',
          updatedAt: '',
        });

        // 로컬 상태 초기화
        const openingTimeParts = parseTime(validatedData.openingTime);
        const closingTimeParts = parseTime(validatedData.closingTime);

        setOpeningHour(openingTimeParts.hour);
        setOpeningMinute(openingTimeParts.minute);
        setClosingHour(closingTimeParts.hour);
        setClosingMinute(closingTimeParts.minute);
      } catch (error) {
        console.error('카페 설정 불러오기 오류:', error);
        toast.error('카페 설정을 불러오는데 문제가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 설정 저장
  const saveSettings = async () => {
    // 저장 전에 로컬 상태에서 settings 업데이트
    const updatedSettings = {
      ...settings,
      openingTime: formatTimeString(openingHour, openingMinute),
      closingTime: formatTimeString(closingHour, closingMinute),
    };

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/cafe-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '카페 설정 저장에 실패했습니다.');
      }

      // 성공 시 settings 업데이트
      setSettings(updatedSettings);
      toast.success('카페 설정이 저장되었습니다.');
    } catch (error) {
      console.error('카페 설정 저장 오류:', error);
      toast.error(error instanceof Error ? error.message : '카페 설정 저장에 문제가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 시간 파싱 및 변환 함수
  const parseTime = (timeString: string): { hour: number; minute: number } => {
    // 기본값 설정 및 유효성 검사
    if (!timeString || typeof timeString !== 'string') {
      return { hour: 0, minute: 0 };
    }

    const [hourStr, minuteStr] = timeString.split(':');
    return {
      hour: parseInt(hourStr, 10) || 0,
      minute: parseInt(minuteStr, 10) || 0,
    };
  };

  // 시간 문자열 생성 함수
  const formatTimeString = (hour: number, minute: number): string =>
    `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

  // 시간 변경 처리
  const handleHourChange = (type: 'opening' | 'closing', value: string) => {
    // 숫자만 입력 가능하도록 필터링
    if (!/^\d*$/.test(value)) return;

    const hourValue = parseInt(value, 10);

    // 빈 문자열이면 그대로 설정 (사용자가 지우고 있는 중)
    if (value === '') {
      if (type === 'opening') {
        setOpeningHour(0);
      } else {
        setClosingHour(0);
      }
      return;
    }

    // 범위 검사
    if (isNaN(hourValue) || hourValue < 0 || hourValue > 23) return;

    if (type === 'opening') {
      setOpeningHour(hourValue);
    } else {
      setClosingHour(hourValue);
    }
  };

  // 분 변경 처리
  const handleMinuteChange = (type: 'opening' | 'closing', value: string) => {
    const minuteValue = parseInt(value, 10);
    if (isNaN(minuteValue) || minuteValue < 0 || minuteValue > 55 || minuteValue % 5 !== 0) return;

    if (type === 'opening') {
      setOpeningMinute(minuteValue);
    } else {
      setClosingMinute(minuteValue);
    }
  };

  // 영업일 변경 처리
  const handleDayToggle = (day: number) => {
    setSettings((prev) => {
      const currentDays = [...prev.openDays];
      const dayIndex = currentDays.indexOf(day);

      if (dayIndex >= 0) {
        // 이미 선택된 요일이면 제거
        currentDays.splice(dayIndex, 1);
      } else {
        // 선택되지 않은 요일이면 추가
        currentDays.push(day);
      }

      return {
        ...prev,
        openDays: currentDays,
      };
    });
  };

  // 시간 포맷팅 (화면 표시용)
  const formatTime = (timeString: string) => {
    // 기본값 설정 및 유효성 검사
    if (!timeString || typeof timeString !== 'string') {
      return '시간 정보 없음';
    }

    const { hour, minute } = parseTime(timeString);
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour === 12 ? 12 : hour % 12;
    const minuteStr = minute === 0 ? '' : ` ${minute}분`;
    return `${period} ${displayHour}시${minuteStr}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>카페 영업 설정</CardTitle>
        <CardDescription>카페 영업 시간과 영업일을 설정합니다.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {isLoading ? (
          <div className='text-center py-4'>설정을 불러오는 중...</div>
        ) : (
          <>
            <div className='space-y-4'>
              <div>
                <Label htmlFor='openingHour'>영업 시작 시간</Label>
                <div className='flex items-center gap-2 mt-1.5'>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='openingHour'
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      maxLength={2}
                      placeholder='0-23'
                      value={openingHour}
                      onChange={(e) => handleHourChange('opening', e.target.value)}
                      className='w-20'
                    />
                    <span>시</span>
                    <select
                      id='openingMinute'
                      value={openingMinute}
                      onChange={(e) => handleMinuteChange('opening', e.target.value)}
                      className='w-20 rounded-md border border-input bg-background px-3 py-2'
                    >
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                        <option key={`opening-${minute}`} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                    <span>분</span>
                  </div>
                  <span className='text-sm text-muted-foreground ml-2'>
                    ({formatTime(formatTimeString(openingHour, openingMinute))})
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor='closingHour'>영업 종료 시간</Label>
                <div className='flex items-center gap-2 mt-1.5'>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='closingHour'
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      maxLength={2}
                      placeholder='0-23'
                      value={closingHour}
                      onChange={(e) => handleHourChange('closing', e.target.value)}
                      className='w-20'
                    />
                    <span>시</span>
                    <select
                      id='closingMinute'
                      value={closingMinute}
                      onChange={(e) => handleMinuteChange('closing', e.target.value)}
                      className='w-20 rounded-md border border-input bg-background px-3 py-2'
                    >
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                        <option key={`closing-${minute}`} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                    <span>분</span>
                  </div>
                  <span className='text-sm text-muted-foreground ml-2'>
                    ({formatTime(formatTimeString(closingHour, closingMinute))})
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <Label className='mb-2 block'>영업일</Label>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={settings.openDays.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <Label
                        htmlFor={`day-${day.value}`}
                        className='text-sm font-normal cursor-pointer'
                      >
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? '저장 중...' : '설정 저장'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
