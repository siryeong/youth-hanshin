'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Village } from '@/model/model';

export default function RegisterPage() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    villageId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchVillages();
  }, []);

  const fetchVillages = async () => {
    try {
      const response = await fetch('/api/villages');
      const data = await response.json();
      setVillages(data);
    } catch (error) {
      console.error('마을 정보를 불러오는 중 오류가 발생했습니다:', error);
    }
  };

  const handleRegister = async () => {
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    if (!formData.villageId) {
      alert('마을을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/event/gift-exchange/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          villageId: formData.villageId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsRegistered(true);
      } else {
        alert(data.error || '등록 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('등록 오류:', error);
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      villageId: '',
    });
    setIsRegistered(false);
  };

  // 클라이언트 사이드에서만 렌더링
  if (!isMounted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center'>🎁 선물교환 이벤트 참가등록</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='text-center text-gray-500'>로딩 중...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center text-green-600'>✅ 등록 완료!</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 text-center'>
            <div className='space-y-2'>
              <p className='text-lg font-semibold'>{formData.name}님</p>
              <p className='text-gray-600'>선물교환 이벤트 참가 등록이 완료되었습니다!</p>
            </div>

            <div className='bg-blue-50 p-4 rounded-lg'>
              <p className='text-sm text-blue-800'>
                📢 모든 참가자 등록이 완료되면
                <br />
                관리자가 전체 매칭을 생성하고
                <br />한 쌍씩 결과를 공개할 예정입니다!
              </p>
            </div>

            <Button onClick={resetForm} variant='outline' className='w-full'>
              추가 등록하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-center'>🎁 선물교환 이벤트 참가등록</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='name'>이름 *</Label>
            <Input
              id='name'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder='이름을 입력하세요'
            />
          </div>

          <div>
            <Label htmlFor='village'>마을 선택</Label>
            <Select
              value={formData.villageId}
              onValueChange={(value) => setFormData({ ...formData, villageId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder='마을을 선택하세요' />
              </SelectTrigger>
              <SelectContent>
                {villages.map((village) => (
                  <SelectItem key={village.id} value={village.id.toString()}>
                    {village.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleRegister} disabled={isLoading} className='w-full'>
            {isLoading ? '등록 중...' : '참가 등록'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
