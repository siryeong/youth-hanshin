'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface Village {
  id: number;
  name: string;
}

export default function VillageManagement() {
  const [villages, setVillages] = useState<Village[]>([]);
  const [newVillageName, setNewVillageName] = useState('');
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 마을 목록 불러오기
  const fetchVillages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/villages');
      if (!response.ok) throw new Error('마을 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setVillages(data);
    } catch (error) {
      console.error('마을 목록 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 마을 목록 불러오기
  useEffect(() => {
    fetchVillages();
  }, []);

  // 마을 추가
  const addVillage = async () => {
    if (!newVillageName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/villages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVillageName }),
      });

      if (!response.ok) throw new Error('마을 추가에 실패했습니다.');

      await fetchVillages();
      setNewVillageName('');
    } catch (error) {
      console.error('마을 추가 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 마을 수정
  const updateVillage = async () => {
    if (!editingVillage || !editingVillage.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/villages/${editingVillage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingVillage.name }),
      });

      if (!response.ok) throw new Error('마을 수정에 실패했습니다.');

      await fetchVillages();
      setEditingVillage(null);
    } catch (error) {
      console.error('마을 수정 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 마을 삭제
  const deleteVillage = async (id: number) => {
    if (!confirm('정말로 이 마을을 삭제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/villages/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('마을 삭제에 실패했습니다.');

      await fetchVillages();
    } catch (error) {
      console.error('마을 삭제 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-2'>
        <Input
          placeholder='새 마을 이름'
          value={newVillageName}
          onChange={(e) => setNewVillageName(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={addVillage} disabled={isLoading || !newVillageName.trim()}>
          추가
        </Button>
      </div>

      <Separator />

      {isLoading && <div className='text-center py-4'>로딩 중...</div>}

      <div className='space-y-4'>
        {villages.length === 0 && !isLoading ? (
          <div className='text-center py-4 text-muted-foreground'>등록된 마을이 없습니다.</div>
        ) : (
          villages.map((village) => (
            <div
              key={village.id}
              className='flex items-center justify-between p-3 border rounded-md'
            >
              {editingVillage?.id === village.id ? (
                <div className='flex items-center space-x-2 flex-1'>
                  <Input
                    value={editingVillage.name}
                    onChange={(e) => setEditingVillage({ ...editingVillage, name: e.target.value })}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={updateVillage}
                    disabled={isLoading || !editingVillage.name.trim()}
                    size='sm'
                  >
                    저장
                  </Button>
                  <Button
                    onClick={() => setEditingVillage(null)}
                    variant='outline'
                    size='sm'
                    disabled={isLoading}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <>
                  <span className='text-lg'>{village.name}</span>
                  <div className='flex items-center space-x-2'>
                    <Button
                      onClick={() => setEditingVillage(village)}
                      variant='outline'
                      size='sm'
                      disabled={isLoading}
                    >
                      수정
                    </Button>
                    <Button
                      onClick={() => deleteVillage(village.id)}
                      variant='destructive'
                      size='sm'
                      disabled={isLoading}
                    >
                      삭제
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
