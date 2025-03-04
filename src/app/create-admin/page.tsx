'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function CreateAdminPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          secretKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '관리자 계정 생성 중 오류가 발생했습니다.');
      } else {
        setSuccess('관리자 계정이 성공적으로 생성되었습니다.');
        // 폼 초기화
        setName('');
        setEmail('');
        setPassword('');
        setSecretKey('');

        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-background'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl text-center'>관리자 계정 생성</CardTitle>
          <CardDescription className='text-center'>
            관리자 계정을 생성하려면 아래 양식을 작성하세요.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className='space-y-4'>
            {error && (
              <div className='p-3 text-sm text-white bg-destructive rounded-md'>{error}</div>
            )}
            {success && (
              <div className='p-3 text-sm text-white bg-green-600 rounded-md'>{success}</div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='name'>이름</Label>
              <Input id='name' value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>이메일</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>비밀번호</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='secretKey'>관리자 시크릿 키</Label>
              <Input
                id='secretKey'
                type='password'
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
              />
              <p className='text-xs text-muted-foreground'>
                관리자 계정을 생성하려면 관리자 시크릿 키가 필요합니다.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? '생성 중...' : '관리자 계정 생성'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
