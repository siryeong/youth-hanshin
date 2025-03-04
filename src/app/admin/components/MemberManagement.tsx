'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Village {
  id: number;
  name: string;
}

interface Member {
  id: number;
  name: string;
  villageId: number;
  villageName?: string;
}

export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterVillageId, setFilterVillageId] = useState<string>('all');

  // 마을 목록 불러오기
  const fetchVillages = async () => {
    try {
      const response = await fetch('/api/villages');
      if (!response.ok) throw new Error('마을 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setVillages(data);
    } catch (error) {
      console.error('마을 목록 불러오기 오류:', error);
    }
  };

  // 멤버 목록 불러오기
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/members');
      if (!response.ok) throw new Error('멤버 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('멤버 목록 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchVillages();
    fetchMembers();
  }, []);

  // 멤버 추가
  const addMember = async () => {
    if (!newMemberName.trim() || !selectedVillageId) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemberName,
          villageId: parseInt(selectedVillageId),
        }),
      });

      if (!response.ok) throw new Error('멤버 추가에 실패했습니다.');

      await fetchMembers();
      setNewMemberName('');
      setSelectedVillageId('');
    } catch (error) {
      console.error('멤버 추가 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 멤버 수정
  const updateMember = async () => {
    if (!editingMember || !editingMember.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingMember.name,
          villageId: editingMember.villageId,
        }),
      });

      if (!response.ok) throw new Error('멤버 수정에 실패했습니다.');

      await fetchMembers();
      setEditingMember(null);
    } catch (error) {
      console.error('멤버 수정 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 멤버 삭제
  const deleteMember = async (id: number) => {
    if (!confirm('정말로 이 멤버를 삭제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('멤버 삭제에 실패했습니다.');

      await fetchMembers();
    } catch (error) {
      console.error('멤버 삭제 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 멤버 목록
  const filteredMembers =
    filterVillageId === 'all'
      ? members
      : members.filter((member) => member.villageId === parseInt(filterVillageId));

  // 마을 이름 가져오기
  const getVillageName = (villageId: number) => {
    const village = villages.find((v) => v.id === villageId);
    return village ? village.name : '알 수 없음';
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Input
          placeholder='새 멤버 이름'
          value={newMemberName}
          onChange={(e) => setNewMemberName(e.target.value)}
          disabled={isLoading}
        />
        <Select value={selectedVillageId} onValueChange={setSelectedVillageId} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder='마을 선택' />
          </SelectTrigger>
          <SelectContent>
            {villages.map((village) => (
              <SelectItem key={village.id} value={village.id.toString()}>
                {village.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={addMember}
          disabled={isLoading || !newMemberName.trim() || !selectedVillageId}
        >
          추가
        </Button>
      </div>

      <Separator />

      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-medium'>멤버 목록</h3>
        <Select value={filterVillageId} onValueChange={setFilterVillageId}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='마을 필터' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>모든 마을</SelectItem>
            {villages.map((village) => (
              <SelectItem key={village.id} value={village.id.toString()}>
                {village.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className='text-center py-4'>로딩 중...</div>}

      <div className='space-y-4'>
        {filteredMembers.length === 0 && !isLoading ? (
          <div className='text-center py-4 text-muted-foreground'>등록된 멤버가 없습니다.</div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className='flex items-center justify-between p-3 border rounded-md'
            >
              {editingMember?.id === member.id ? (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-2 w-full'>
                  <Input
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    disabled={isLoading}
                  />
                  <Select
                    value={editingMember.villageId.toString()}
                    onValueChange={(value) =>
                      setEditingMember({
                        ...editingMember,
                        villageId: parseInt(value),
                      })
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='마을 선택' />
                    </SelectTrigger>
                    <SelectContent>
                      {villages.map((village) => (
                        <SelectItem key={village.id} value={village.id.toString()}>
                          {village.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className='flex items-center space-x-2'>
                    <Button
                      onClick={updateMember}
                      disabled={isLoading || !editingMember.name.trim()}
                      size='sm'
                      className='flex-1'
                    >
                      저장
                    </Button>
                    <Button
                      onClick={() => setEditingMember(null)}
                      variant='outline'
                      size='sm'
                      disabled={isLoading}
                      className='flex-1'
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className='text-lg'>{member.name}</span>
                    <p className='text-sm text-muted-foreground'>
                      {getVillageName(member.villageId)}
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Button
                      onClick={() => setEditingMember(member)}
                      variant='outline'
                      size='sm'
                      disabled={isLoading}
                    >
                      수정
                    </Button>
                    <Button
                      onClick={() => deleteMember(member.id)}
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
