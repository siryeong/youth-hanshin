'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

type CafeSettingsType = {
  openingHour: number;
  closingHour: number;
  openDays: number[];
};

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
  const [settings, setSettings] = useState<CafeSettingsType>({
    openingHour: 10,
    closingHour: 14,
    openDays: [0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        setSettings(data);
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
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/cafe-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '카페 설정 저장에 실패했습니다.');
      }

      toast.success('카페 설정이 저장되었습니다.');
    } catch (error) {
      console.error('카페 설정 저장 오류:', error);
      toast.error(error instanceof Error ? error.message : '카페 설정 저장에 문제가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 영업 시간 변경 처리
  const handleHourChange = (type: 'opening' | 'closing', value: string) => {
    const hourValue = parseInt(value, 10);
    if (isNaN(hourValue) || hourValue < 0 || hourValue > 23) return;

    setSettings((prev) => ({
      ...prev,
      [type === 'opening' ? 'openingHour' : 'closingHour']: hourValue,
    }));
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

  // 시간 포맷팅
  const formatHour = (hour: number) => {
    if (hour === 12) return '오후 12시';
    if (hour < 12) return `오전 ${hour}시`;
    return `오후 ${hour - 12}시`;
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
                  <Input
                    id='openingHour'
                    type='number'
                    min='0'
                    max='23'
                    value={settings.openingHour}
                    onChange={(e) => handleHourChange('opening', e.target.value)}
                    className='w-20'
                  />
                  <span className='text-sm text-muted-foreground'>
                    ({formatHour(settings.openingHour)})
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor='closingHour'>영업 종료 시간</Label>
                <div className='flex items-center gap-2 mt-1.5'>
                  <Input
                    id='closingHour'
                    type='number'
                    min='0'
                    max='23'
                    value={settings.closingHour}
                    onChange={(e) => handleHourChange('closing', e.target.value)}
                    className='w-20'
                  />
                  <span className='text-sm text-muted-foreground'>
                    ({formatHour(settings.closingHour)})
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
