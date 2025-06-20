'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventParticipant } from '@/model/model';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/event/gift-exchange/participants');
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('참가자 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 마을별로 참가자 그룹화
  const participantsByVillage = participants.reduce(
    (acc, participant) => {
      const villageName = participant.village.name;
      if (!acc[villageName]) {
        acc[villageName] = [];
      }
      acc[villageName].push(participant);
      return acc;
    },
    {} as Record<string, EventParticipant[]>,
  );

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center'>
        <Card className='w-96'>
          <CardContent className='text-center py-16'>
            <div className='animate-spin text-4xl mb-4'>🎁</div>
            <p className='text-gray-600'>참가자 목록을 불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-100'>
      <div className='container mx-auto p-6 space-y-6'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-800 mb-2'>🎁 선물교환 참가자 목록</h1>
          <p className='text-gray-600'>현재 등록된 참가자들을 확인해보세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>📊 참가 현황</span>
              <span className='text-2xl font-bold text-blue-600'>{participants.length}명</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-blue-50 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600'>{participants.length}</div>
                <div className='text-sm text-blue-800'>총 참가자</div>
              </div>
              <div className='text-center p-4 bg-green-50 rounded-lg'>
                <div className='text-2xl font-bold text-green-600'>
                  {Object.keys(participantsByVillage).length}
                </div>
                <div className='text-sm text-green-800'>참여 마을</div>
              </div>
              <div className='text-center p-4 bg-purple-50 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600'>
                  {participants.length >= 2 ? '준비완료' : '대기중'}
                </div>
                <div className='text-sm text-purple-800'>이벤트 상태</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {Object.keys(participantsByVillage).length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Object.entries(participantsByVillage)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([villageName, villageParticipants]) => (
                <Card key={villageName}>
                  <CardHeader>
                    <CardTitle className='flex items-center justify-between'>
                      <span>🏘️ {villageName}</span>
                      <span className='text-lg font-bold text-gray-600'>
                        {villageParticipants.length}명
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      {villageParticipants
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((participant, index) => (
                          <div
                            key={participant.id}
                            className='flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow'
                          >
                            <div className='flex items-center space-x-3'>
                              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600'>
                                {index + 1}
                              </div>
                              <div className='font-medium text-gray-800'>{participant.name}</div>
                            </div>
                            <div className='text-xs text-gray-500'>
                              {new Date(participant.createdAt).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className='text-center py-16'>
              <div className='text-6xl mb-4'>🎭</div>
              <h3 className='text-2xl font-bold text-gray-800 mb-2'>아직 참가자가 없습니다</h3>
              <p className='text-gray-600 mb-6'>
                선물교환 이벤트에 참여하려면 등록 페이지에서 신청해주세요!
              </p>
              <a
                href='/event-gift-exchange/register'
                className='inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium'
              >
                🎁 참가 신청하기
              </a>
            </CardContent>
          </Card>
        )}

        {participants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>💡 이벤트 안내</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <h4 className='font-medium text-gray-800'>📋 참가 방법</h4>
                  <ul className='text-sm text-gray-600 space-y-1'>
                    <li>• 등록 페이지에서 이름과 마을을 선택하여 신청</li>
                    <li>• 한 마을에서 같은 이름으로는 중복 신청 불가</li>
                  </ul>
                </div>
                <div className='space-y-3'>
                  <h4 className='font-medium text-gray-800'>🎯 이벤트 진행</h4>
                  <ul className='text-sm text-gray-600 space-y-1'>
                    <li>• 관리자가 랜덤 매칭을 생성</li>
                    <li>• 공개 화면에서 실시간으로 결과 발표</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className='text-center'>
          <a
            href='/event-gift-exchange/register'
            className='inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-lg shadow-lg hover:shadow-xl'
          >
            🎁 나도 참가하기
          </a>
        </div>
      </div>
    </div>
  );
}
