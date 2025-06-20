'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GiftExchangeMatch } from '@/model/model';

interface SpinningState {
  giverName: string;
  giverVillage: string;
  receiverName: string;
  receiverVillage: string;
  isSpinning: boolean;
}

type DisplayStep = 'waiting' | 'giver-revealed' | 'spinning';

export default function DisplayPage() {
  const [step, setStep] = useState<DisplayStep>('waiting');
  const [spinningState, setSpinningState] = useState<SpinningState>({
    giverName: '',
    giverVillage: '',
    receiverName: '',
    receiverVillage: '',
    isSpinning: false,
  });

  // postMessage 이벤트 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SHOW_GIVER') {
        const { match } = event.data;
        setStep('giver-revealed');
        setSpinningState({
          giverName: match.giver.name,
          giverVillage: match.giver.village.name,
          receiverName: '',
          receiverVillage: '',
          isSpinning: false,
        });
      } else if (event.data?.type === 'START_REVEAL') {
        const { match, allMatches: matches } = event.data;
        startSpinning(match, matches);
      } else if (event.data?.type === 'BACK_TO_WAITING') {
        // 대기 화면으로 돌아가기
        setStep('waiting');
        setSpinningState({
          giverName: '',
          giverVillage: '',
          receiverName: '',
          receiverVillage: '',
          isSpinning: false,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const startSpinning = useCallback((match: GiftExchangeMatch, matches: GiftExchangeMatch[]) => {
    setStep('spinning');
    setSpinningState((prev) => ({
      ...prev,
      receiverName: '',
      receiverVillage: '',
      isSpinning: true,
    }));

    let spinCount = 0;
    const maxSpins = 100; // 적당한 스피닝 시간
    let currentSpeed = 50; // 시작 속도

    const spinInterval = () => {
      if (spinCount >= maxSpins) {
        // 스피닝 완료 - 최종 결과 표시
        setSpinningState((prev) => ({
          ...prev,
          receiverName: match.receiver.name,
          receiverVillage: match.receiver.village.name,
          isSpinning: false,
        }));
        return;
      }

      // 랜덤 참가자 선택해서 깜빡이기
      const randomMatch = matches[Math.floor(Math.random() * matches.length)];

      setSpinningState((prev) => ({
        ...prev,
        receiverName: randomMatch.receiver.name,
        receiverVillage: randomMatch.receiver.village.name,
      }));

      spinCount++;

      // 점진적 속도 감소
      const progress = spinCount / maxSpins;
      if (progress > 0.7) {
        const slowdownFactor = 1 + (progress - 0.7) * 5; // 5배까지 느려짐
        currentSpeed = Math.min(currentSpeed * slowdownFactor, 600);
      }

      setTimeout(spinInterval, currentSpeed);
    };

    // 1초 후 스피닝 시작
    setTimeout(() => {
      spinInterval();
    }, 1000);
  }, []);

  const renderWaitingStep = () => (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-pink-100'>
      <Card className='w-full max-w-2xl'>
        <CardContent className='text-center py-16'>
          <div className='space-y-6'>
            <div className='text-6xl'>🎁</div>
            <h1 className='text-4xl font-bold text-gray-800'>선물교환 이벤트</h1>
            <p className='text-xl text-gray-600'>다음 결과 공개를 기다리는 중입니다...</p>
            <div className='animate-pulse text-lg text-gray-500'>
              관리자가 다음 매칭을 공개하면 뽑기가 시작됩니다
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGiverRevealedStep = () => (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100'>
      <Card className='w-full max-w-4xl'>
        <CardHeader>
          <CardTitle className='text-center text-4xl'>🎯 선물 주는 사람 공개!</CardTitle>
        </CardHeader>
        <CardContent className='text-center py-8'>
          <div className='space-y-8'>
            {/* 선물 주는 사람 */}
            <div className='bg-blue-100 p-8 rounded-2xl border-4 border-blue-300 animate-pulse'>
              <div className='text-2xl font-medium text-blue-700 mb-4'>선물을 주는 사람</div>
              <div className='text-6xl font-bold text-blue-800 mb-3'>{spinningState.giverName}</div>
              <div className='text-3xl text-blue-700'>({spinningState.giverVillage})</div>
            </div>

            <div className='text-6xl animate-bounce'>⬇️ 🎁 ⬇️</div>

            {/* 선물 받는 사람 (아직 비공개) */}
            <div className='bg-gray-100 p-8 rounded-2xl border-4 border-gray-300'>
              <div className='text-2xl font-medium text-gray-600 mb-4'>선물을 받는 사람은...</div>
              <div className='text-6xl font-bold text-gray-500 mb-3'>???</div>
              <div className='text-3xl text-gray-500'>(???)</div>
            </div>

            <div className='bg-yellow-100 p-6 rounded-lg'>
              <p className='text-2xl text-yellow-800 font-medium animate-pulse'>
                🎰 곧 결과가 공개됩니다!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSpinningStep = () => (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 to-yellow-100'>
      <Card className='w-full max-w-4xl'>
        <CardHeader>
          <CardTitle className='text-center text-4xl'>🎰 뽑기 진행 중</CardTitle>
        </CardHeader>
        <CardContent className='text-center py-8'>
          <div className='space-y-8'>
            {/* 선물 주는 사람 (고정) */}
            <div className='bg-blue-100 p-8 rounded-2xl border-4 border-blue-300'>
              <div className='text-2xl font-medium text-blue-700 mb-4'>선물을 주는 사람</div>
              <div className='text-6xl font-bold text-blue-800 mb-3'>{spinningState.giverName}</div>
              <div className='text-3xl text-blue-700'>({spinningState.giverVillage})</div>
            </div>

            <div className='text-6xl animate-bounce'>⬇️ 🎁 ⬇️</div>

            {/* 선물 받는 사람 (스피닝) */}
            <div className='relative'>
              <div className='bg-red-100 p-6 rounded-2xl border-4 border-red-300'>
                <div className='text-2xl font-medium text-red-700 mb-2'>선물을 받는 사람은...</div>

                {/* 깜빡이는 텍스트 */}
                <div className='flex flex-col items-center justify-center'>
                  <div
                    className={`text-6xl font-bold text-red-800 mb-4 ${
                      spinningState.isSpinning ? 'animate-pulse' : ''
                    }`}
                  >
                    {spinningState.receiverName || '???'}
                  </div>

                  <div
                    className={`text-3xl text-red-700 ${
                      spinningState.isSpinning ? 'animate-pulse' : ''
                    }`}
                  >
                    ({spinningState.receiverVillage || '???'})
                  </div>
                </div>
              </div>

              {/* 스피닝 효과 */}
              {spinningState.isSpinning && (
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='absolute inset-0 border-4 border-red-500 rounded-2xl animate-ping opacity-20'></div>
                  <div className='absolute inset-0 border-4 border-yellow-400 rounded-2xl animate-ping opacity-30 animation-delay-150'></div>
                  <div className='absolute inset-0 border-4 border-green-400 rounded-2xl animate-ping opacity-20 animation-delay-300'></div>
                </div>
              )}
            </div>

            {!spinningState.isSpinning && (
              <div className='space-y-6'>
                <div className='text-5xl font-bold text-green-600 animate-bounce'>
                  🎉 매칭 완료! 🎉
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {step === 'waiting' && renderWaitingStep()}
      {step === 'giver-revealed' && renderGiverRevealedStep()}
      {step === 'spinning' && renderSpinningStep()}
    </>
  );
}
