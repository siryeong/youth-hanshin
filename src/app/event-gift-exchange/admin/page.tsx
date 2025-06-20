'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventParticipant, GiftExchangeMatch } from '@/model/model';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AdminPage() {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [matches, setMatches] = useState<GiftExchangeMatch[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [displayWindow, setDisplayWindow] = useState<Window | null>(null);
  const [giverRevealed, setGiverRevealed] = useState(false);

  useEffect(() => {
    fetchParticipants();
    fetchMatches();
  }, []);

  // 매칭 데이터가 로드되면 진행 상황 복원
  useEffect(() => {
    if (Array.isArray(matches) && matches.length > 0) {
      // 완료되지 않은 첫 번째 매칭의 인덱스를 찾기
      const firstIncompleteIndex = matches.findIndex((match) => !match.isRevealed);

      if (firstIncompleteIndex === -1) {
        // 모든 매칭이 완료된 경우
        setCurrentRevealIndex(matches.length);
        setGiverRevealed(false);
        localStorage.removeItem('currentGiverRevealed');
      } else {
        setCurrentRevealIndex(firstIncompleteIndex);

        // localStorage에서 현재 매칭의 giver 공개 상태 복원
        const savedGiverState = localStorage.getItem('currentGiverRevealed');
        const savedMatchIndex = localStorage.getItem('currentMatchIndex');

        if (savedGiverState === 'true' && savedMatchIndex === firstIncompleteIndex.toString()) {
          setGiverRevealed(true);
        } else {
          setGiverRevealed(false);
          localStorage.removeItem('currentGiverRevealed');
          localStorage.removeItem('currentMatchIndex');
        }
      }
    }
  }, [matches]);

  // display 창 상태 확인
  useEffect(() => {
    const interval = setInterval(() => {
      if (displayWindow && displayWindow.closed) {
        setDisplayWindow(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [displayWindow]);

  const fetchParticipants = async () => {
    try {
      const response = await fetch('/api/event/gift-exchange/participants');
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('참가자 목록 조회 오류:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/event/gift-exchange/matches');
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('매칭 결과 조회 오류:', error);
    }
  };

  // 전체 매칭 생성
  const generateAllMatches = async () => {
    if (participants.length < 2) {
      alert('참가자가 최소 2명 이상이어야 합니다.');
      return;
    }

    const confirmed = confirm(
      `${participants.length}명의 참가자로 랜덤 매칭을 생성하시겠습니까?\n이미 생성된 매칭이 있다면 삭제됩니다.`,
    );

    if (!confirmed) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/event/gift-exchange/generate-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      if (response.ok) {
        await fetchMatches();
        setCurrentRevealIndex(0);
        setGiverRevealed(false);

        // localStorage 상태 정리
        localStorage.removeItem('currentGiverRevealed');
        localStorage.removeItem('currentMatchIndex');

        alert(data.message);
      } else {
        alert(data.error || '매칭 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('매칭 생성 오류:', error);
      alert('매칭 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 공개 화면 열기
  const openDisplayWindow = () => {
    if (displayWindow && !displayWindow.closed) {
      displayWindow.focus();
      return;
    }

    const newWindow = window.open('/event-gift-exchange/display', '_blank', 'fullscreen=yes');
    setDisplayWindow(newWindow);
  };

  // 선물 주는 사람 공개
  const showGiver = () => {
    if (!Array.isArray(matches) || currentRevealIndex >= matches.length) {
      alert('모든 매칭 결과가 공개되었습니다!');
      return;
    }

    // 공개 화면이 열려있지 않으면 경고
    if (!displayWindow || displayWindow.closed) {
      alert('먼저 공개 화면을 열어주세요!');
      return;
    }

    // 선물 주는 사람만 먼저 공개
    displayWindow.postMessage(
      {
        type: 'SHOW_GIVER',
        match: matches[currentRevealIndex],
      },
      '*',
    );

    setGiverRevealed(true);

    // localStorage에 현재 상태 저장
    localStorage.setItem('currentGiverRevealed', 'true');
    localStorage.setItem('currentMatchIndex', currentRevealIndex.toString());
  };

  // 받는 사람 공개 (파칭코 효과)
  const revealReceiver = () => {
    if (!giverRevealed) {
      alert('먼저 선물 주는 사람을 공개해주세요!');
      return;
    }

    // 공개 화면이 열려있지 않으면 경고
    if (!displayWindow || displayWindow.closed) {
      alert('먼저 공개 화면을 열어주세요!');
      return;
    }

    // 받는 사람 공개 (파칭코 효과)
    displayWindow.postMessage(
      {
        type: 'START_REVEAL',
        match: matches[currentRevealIndex],
        allMatches: matches,
        matchIndex: currentRevealIndex,
      },
      '*',
    );

    setCurrentRevealIndex((prev) => prev + 1);
    setGiverRevealed(false);

    // localStorage 상태 정리
    localStorage.removeItem('currentGiverRevealed');
    localStorage.removeItem('currentMatchIndex');
  };

  // 선물 교환 완료
  const completeExchange = async () => {
    if (currentRevealIndex === 0) {
      alert('아직 공개된 매칭이 없습니다.');
      return;
    }

    const completedMatch = matches[currentRevealIndex - 1];

    try {
      const response = await fetch('/api/event/gift-exchange/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: completedMatch.id,
          isCompleted: true,
        }),
      });

      if (response.ok) {
        // 대기 화면으로 돌아가기
        if (displayWindow && !displayWindow.closed) {
          displayWindow.postMessage({ type: 'BACK_TO_WAITING' }, '*');
        }

        await fetchMatches();

        // localStorage 상태 정리
        localStorage.removeItem('currentGiverRevealed');
        localStorage.removeItem('currentMatchIndex');

        alert('선물 교환이 완료되었습니다!');
      } else {
        alert('완료 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('완료 처리 오류:', error);
      alert('완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 매칭 초기화
  const resetMatches = async () => {
    const confirmed = confirm('모든 매칭을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/event/gift-exchange/reset-matches', {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMatches();
        setCurrentRevealIndex(0);
        setGiverRevealed(false);

        // localStorage 상태 정리
        localStorage.removeItem('currentGiverRevealed');
        localStorage.removeItem('currentMatchIndex');

        alert('매칭이 초기화되었습니다.');
      }
    } catch (error) {
      console.error('매칭 초기화 오류:', error);
      alert('매칭 초기화 중 오류가 발생했습니다.');
    }
  };

  const hasMatches = Array.isArray(matches) && matches.length > 0;
  const allRevealed = Array.isArray(matches) && currentRevealIndex >= matches.length;
  const completedCount = Array.isArray(matches)
    ? matches.filter((match) => match.isRevealed).length
    : 0;

  return (
    <AuthGuard>
      <div className='min-h-screen bg-gray-50 p-4'>
        <div className='max-w-6xl mx-auto space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>🎪 선물교환 이벤트 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-6'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>{participants.length}</div>
                  <div className='text-sm text-blue-800'>총 참가자</div>
                </div>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='text-2xl font-bold text-green-600'>
                    {Array.isArray(matches) ? matches.length : 0}
                  </div>
                  <div className='text-sm text-green-800'>생성된 매칭</div>
                </div>
                <div className='text-center p-4 bg-orange-50 rounded-lg'>
                  <div className='text-2xl font-bold text-orange-600'>{currentRevealIndex}</div>
                  <div className='text-sm text-orange-800'>공개된 매칭</div>
                </div>
                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {Array.isArray(matches) ? matches.length - currentRevealIndex : 0}
                  </div>
                  <div className='text-sm text-purple-800'>대기 중</div>
                </div>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>{completedCount}</div>
                  <div className='text-sm text-blue-800'>교환 완료</div>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='flex gap-2 flex-wrap'>
                  <Button
                    onClick={generateAllMatches}
                    disabled={isGenerating || participants.length < 2}
                    className='flex-1 min-w-40'
                  >
                    {isGenerating ? '생성 중...' : '🎲 전체 매칭 생성'}
                  </Button>

                  <Button onClick={openDisplayWindow} variant='outline'>
                    🖥️ 공개 화면 {displayWindow && !displayWindow.closed ? '(열림)' : '(닫힘)'}
                  </Button>

                  {hasMatches && (
                    <Button onClick={resetMatches} variant='destructive'>
                      🗑️ 매칭 초기화
                    </Button>
                  )}
                </div>

                {hasMatches && !allRevealed && (
                  <div className='space-y-2'>
                    {(!displayWindow || displayWindow.closed) && (
                      <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800'>
                        ⚠️ 공개 화면을 먼저 열어주세요!
                      </div>
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                      <Button
                        onClick={showGiver}
                        variant='secondary'
                        disabled={!displayWindow || displayWindow.closed || giverRevealed}
                      >
                        👤 선물 주는 사람 공개 ({currentRevealIndex + 1}/
                        {Array.isArray(matches) ? matches.length : 0})
                      </Button>

                      <Button
                        onClick={revealReceiver}
                        variant='default'
                        disabled={!displayWindow || displayWindow.closed || !giverRevealed}
                      >
                        🎰 받는 사람 공개 (파칭코)
                      </Button>
                    </div>

                    {giverRevealed && (
                      <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center'>
                        ✅ 선물 주는 사람이 공개되었습니다! 이제 받는 사람을 공개하세요.
                      </div>
                    )}

                    {currentRevealIndex > 0 && !giverRevealed && (
                      <Button
                        onClick={completeExchange}
                        variant='outline'
                        className='w-full border-green-300 text-green-700 hover:bg-green-50'
                      >
                        ✅ 선물 교환 완료 (대기 화면으로)
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {allRevealed && hasMatches && (
                <div className='mt-4 p-4 bg-green-50 rounded-lg text-center'>
                  <p className='text-green-800 font-medium'>🎉 모든 매칭 결과가 공개되었습니다!</p>
                </div>
              )}

              {hasMatches && Array.isArray(matches) && currentRevealIndex < matches.length && (
                <div className='mt-4 p-3 bg-indigo-50 rounded-lg text-center'>
                  <p className='text-indigo-800 font-medium'>
                    📍 현재 진행: {currentRevealIndex + 1}번째 매칭
                    {giverRevealed && ' (선물 주는 사람 공개됨)'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* 참가자 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>👥 참가자 목록 ({participants.length}명)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 max-h-96 overflow-y-auto'>
                  {participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className='flex items-center justify-between p-3 bg-white rounded-lg border'
                    >
                      <div>
                        <div className='font-medium'>
                          {index + 1}. {participant.name}
                        </div>
                        <div className='text-sm text-gray-600'>{participant.village.name}</div>
                      </div>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <div className='text-center py-8 text-gray-500'>
                      아직 등록된 참가자가 없습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 매칭 결과 */}
            <Card>
              <CardHeader>
                <CardTitle>
                  🎯 매칭 결과 ({Array.isArray(matches) ? matches.length : 0}쌍)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 max-h-96 overflow-y-auto'>
                  {Array.isArray(matches) &&
                    matches.map((match, index) => (
                      <div
                        key={match.id}
                        className={`p-3 rounded-lg border ${
                          match.isRevealed
                            ? 'bg-blue-50 border-blue-200'
                            : index < currentRevealIndex
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <div
                              className={`font-medium ${
                                match.isRevealed
                                  ? 'text-blue-800'
                                  : index < currentRevealIndex
                                    ? 'text-green-800'
                                    : 'text-gray-600'
                              }`}
                            >
                              {match.giver.name} ({match.giver.village.name})
                            </div>
                            <div
                              className={`text-sm ${
                                match.isRevealed
                                  ? 'text-blue-600'
                                  : index < currentRevealIndex
                                    ? 'text-green-600'
                                    : 'text-gray-500'
                              }`}
                            >
                              → {match.receiver.name} ({match.receiver.village.name})
                            </div>
                          </div>
                          <div className='text-xs'>
                            {match.isRevealed ? (
                              <span className='text-blue-600'>🎁 완료</span>
                            ) : index < currentRevealIndex ? (
                              <span className='text-green-600'>✅ 공개됨</span>
                            ) : index === currentRevealIndex ? (
                              <span className='text-orange-600'>👆 다음</span>
                            ) : (
                              <span className='text-gray-400'>⏳ 대기</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {(!Array.isArray(matches) || matches.length === 0) && (
                    <div className='text-center py-8 text-gray-500'>
                      아직 생성된 매칭이 없습니다.
                      <br />
                      &apos;전체 매칭 생성&apos; 버튼을 클릭하세요.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
