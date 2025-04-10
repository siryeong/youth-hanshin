'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Member, Village } from '@/model/model';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function VillageManagement() {
  // 마을 관련 상태
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [newVillageName, setNewVillageName] = useState('');
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);

  // 멤버 관련 상태
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 마을 목록 불러오기 (멤버 포함)
  const fetchVillages = useCallback(() => {
    setIsLoading(true);
    fetch('/api/admin/villages?members=true')
      .then((response) => response.json())
      .then((data) => {
        setVillages(data);

        // 선택된 마을이 있으면 해당 마을 정보 업데이트
        setSelectedVillage((currentSelectedVillage) => {
          if (!currentSelectedVillage) return null;

          const updatedVillage = data.find((v: Village) => v.id === currentSelectedVillage.id);
          if (updatedVillage) {
            setSelectedMembers(updatedVillage.members?.map((m: Member) => m.id) || []);
            return updatedVillage;
          }
          return currentSelectedVillage;
        });
      })
      .catch((error) => {
        console.error('마을 목록을 불러오는데 실패했습니다.', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 멤버 목록 불러오기
  const fetchMembers = useCallback(() => {
    setIsLoading(true);
    fetch('/api/admin/members')
      .then((response) => response.json())
      .then((data) => {
        const sortedMembers = [...data].sort((a: Member, b: Member) =>
          a.name.localeCompare(b.name),
        );
        setMembers(sortedMembers);
        setFilteredMembers(sortedMembers);
      })
      .catch((error) => {
        console.error('멤버 목록을 불러오는데 실패했습니다.', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchVillages();
    fetchMembers();
  }, [fetchVillages, fetchMembers]);

  // 검색어에 따른 멤버 필터링
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(
          (member) =>
            member.name.toLowerCase().includes(query) ||
            (member.phone && member.phone.toLowerCase().includes(query)),
        ),
      );
    }
  }, [searchQuery, members]);

  // 마을 선택 시 해당 마을의 멤버 ID 목록 설정
  const handleVillageSelect = (village: Village) => {
    setSelectedVillage(village);
    setSelectedMembers(village.members?.map((member) => member.id) || []);
  };

  // 마을 추가
  const addVillage = () => {
    if (!newVillageName.trim()) return;

    setIsLoading(true);
    fetch('/api/admin/villages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newVillageName }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('마을 추가에 실패했습니다.');
        return response.json();
      })
      .then((village) => {
        setVillages((prev) => [...prev, village]);
        setNewVillageName('');
      })
      .catch((error) => {
        console.error('마을 추가 오류:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // 마을 수정
  const updateVillage = () => {
    if (!editingVillage || !editingVillage.name.trim()) return;

    setIsLoading(true);
    fetch(`/api/admin/villages/${editingVillage.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingVillage.name }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('마을 수정에 실패했습니다.');
        return response.json();
      })
      .then((village) => {
        setVillages((prev) => prev.map((v) => (v.id === editingVillage.id ? village : v)));
        setEditingVillage(null);
      })
      .catch((error) => {
        console.error('마을 수정 오류:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // 마을 삭제
  const deleteVillage = (id: number) => {
    if (!confirm('정말로 이 마을을 삭제하시겠습니까?')) return;

    setIsLoading(true);
    fetch(`/api/admin/villages/${id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) throw new Error('마을 삭제에 실패했습니다.');
        return response.json();
      })
      .then(() => {
        if (selectedVillage?.id === id) {
          setSelectedVillage(null);
          setSelectedMembers([]);
        }
        setVillages((prev) => prev.filter((v) => v.id !== id));
      })
      .catch((error) => {
        console.error('마을 삭제 오류:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // 멤버 선택 토글
  const toggleMember = (memberId: number) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // 마을 멤버 일괄 업데이트
  const updateVillageMembers = () => {
    if (!selectedVillage) return;

    setIsSaving(true);
    fetch(`/api/admin/villages/${selectedVillage.id}/members`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds: selectedMembers }),
    })
      .then((response) => {
        if (!response.ok) throw new Error('마을 멤버 업데이트에 실패했습니다.');
        return response.json();
      })
      .then((updatedVillage) => {
        // 마을 목록 업데이트
        setVillages(
          villages.map((v) =>
            v.id === selectedVillage.id ? { ...v, members: updatedVillage.members } : v,
          ),
        );

        // 선택된 마을 업데이트
        setSelectedVillage({ ...selectedVillage, members: updatedVillage.members });

        // 멤버 다이얼로그 닫기
        setIsMemberDialogOpen(false);

        alert('마을 멤버가 성공적으로 업데이트되었습니다.');
      })
      .catch((error) => {
        console.error('마을 멤버 업데이트 오류:', error);
        alert('마을 멤버 업데이트 오류가 발생했습니다.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* 마을 관리 영역 */}
        <Card>
          <CardHeader>
            <CardTitle>마을 관리</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
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

            <div className='space-y-2 max-h-[500px] overflow-y-auto'>
              {villages.length === 0 && !isLoading ? (
                <div className='text-center py-4 text-muted-foreground'>
                  등록된 마을이 없습니다.
                </div>
              ) : (
                villages.map((village) => (
                  <div
                    key={village.id}
                    className={`flex items-center justify-between p-3 border rounded-md ${
                      selectedVillage?.id === village.id ? 'bg-muted' : ''
                    } hover:bg-muted/50 cursor-pointer`}
                    onClick={() => !editingVillage && handleVillageSelect(village)}
                  >
                    {editingVillage?.id === village.id ? (
                      <div className='flex items-center space-x-2 flex-1'>
                        <Input
                          value={editingVillage.name}
                          onChange={(e) =>
                            setEditingVillage({ ...editingVillage, name: e.target.value })
                          }
                          disabled={isLoading}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateVillage();
                          }}
                          disabled={isLoading || !editingVillage.name.trim()}
                          size='sm'
                        >
                          저장
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVillage(null);
                          }}
                          variant='outline'
                          size='sm'
                          disabled={isLoading}
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className='flex items-center space-x-2'>
                          <span className='text-lg font-medium'>{village.name}</span>
                          <span className='text-sm text-muted-foreground'>
                            (멤버 {village.members?.length || 0}명)
                          </span>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVillage(village);
                            }}
                            variant='outline'
                            size='sm'
                            disabled={isLoading}
                          >
                            수정
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteVillage(village.id);
                            }}
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
          </CardContent>
        </Card>

        {/* 마을 멤버 목록 영역 */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>
              {selectedVillage ? `${selectedVillage.name} 마을 멤버` : '마을 멤버'}
            </CardTitle>
            {selectedVillage && (
              <Button
                onClick={() => {
                  setIsMemberDialogOpen(true);
                  setSearchQuery('');
                  setFilteredMembers(members);
                }}
                size='sm'
              >
                <Plus className='h-4 w-4 mr-1' /> 멤버 관리
              </Button>
            )}
          </CardHeader>
          <CardContent className='space-y-4'>
            {!selectedVillage ? (
              <div className='text-center py-8 text-muted-foreground'>
                왼쪽에서 마을을 선택해주세요.
              </div>
            ) : (
              <>
                <div className='relative'>
                  <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='멤버 검색...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-8'
                  />
                </div>

                <div className='border rounded-md p-4 max-h-[400px] overflow-y-auto'>
                  <div className='space-y-2'>
                    {selectedVillage.members?.length === 0 ? (
                      <div className='text-center py-4 text-muted-foreground'>
                        등록된 멤버가 없습니다. &apos;멤버 관리&apos; 버튼을 클릭하여 멤버를
                        추가해주세요.
                      </div>
                    ) : (
                      selectedVillage.members
                        ?.filter(
                          (member) =>
                            searchQuery.trim() === '' ||
                            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (member.phone &&
                              member.phone.toLowerCase().includes(searchQuery.toLowerCase())),
                        )
                        .map((member) => (
                          <div
                            key={member.id}
                            className='flex items-center justify-between rounded-md'
                          >
                            <span>{member.name}</span>
                            <span className='text-muted-foreground text-sm'>
                              {member.phone || '-'}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 멤버 관리 다이얼로그 */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className='flex flex-col md:min-h-[60vh] md:min-w-[40vw]'>
          <DialogHeader>
            <DialogTitle>{selectedVillage?.name} 마을 멤버 관리</DialogTitle>
          </DialogHeader>

          <div className='space-y-4 flex-1 flex-col my-4'>
            <div className='relative rounded-md'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='멤버 검색...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>
            <div className='flex justify-between items-center'>
              <div className='text-sm text-muted-foreground'>
                선택된 멤버: {selectedMembers.length}명
              </div>
              <div className='flex space-x-1'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedMembers([])}
                  disabled={selectedMembers.length === 0}
                >
                  전체 해제
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setSelectedMembers(filteredMembers.map((m) => m.id))}
                >
                  전체 선택
                </Button>
              </div>
            </div>

            <div className='border rounded-md p-4 flex-1 overflow-y-auto max-h-[400px]'>
              <div className='space-y-2'>
                {filteredMembers.length === 0 ? (
                  <div className='text-center py-4 text-muted-foreground'>멤버가 없습니다.</div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className='flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md'
                    >
                      <Checkbox
                        id={`dialog-member-${member.id}`}
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <Label
                        htmlFor={`dialog-member-${member.id}`}
                        className='flex flex-1 justify-between cursor-pointer'
                      >
                        <span>{member.name}</span>
                        <span className='text-muted-foreground text-sm'>{member.phone || '-'}</span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsMemberDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={updateVillageMembers} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
