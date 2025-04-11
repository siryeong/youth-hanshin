'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Member } from '@/model/model';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MoreHorizontal, ArrowUpDown, Search } from 'lucide-react';

type SortConfig = {
  key: keyof Member;
  direction: 'asc' | 'desc';
};

export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [newMember, setNewMember] = useState({ name: '', phone: '', birthDate: '', extra: '' });
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 멤버 목록 불러오기
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/members');
      if (!response.ok) throw new Error('멤버 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setMembers(data);
      setFilteredMembers(data);
    } catch (error) {
      console.error('멤버 목록 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchMembers();
  }, []);

  // 검색 및 정렬 적용
  useEffect(() => {
    let result = [...members];

    // 검색 적용
    if (searchQuery) {
      result = result.filter(
        (member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (member.phone && member.phone.includes(searchQuery)),
      );
    }

    // 정렬 적용
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredMembers(result);
  }, [members, searchQuery, sortConfig]);

  // 정렬 함수
  const handleSort = (key: keyof Member) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // 멤버 추가
  const addMember = async () => {
    if (!newMember.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMember.name,
          phone: newMember.phone,
          birthDate: newMember.birthDate,
        }),
      });

      if (!response.ok) throw new Error('멤버 추가에 실패했습니다.');

      await fetchMembers();
      setNewMember({ name: '', phone: '', birthDate: '', extra: '' });
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
      const response = await fetch(`/api/admin/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingMember.name,
          phone: editingMember.phone,
          birthDate: editingMember.birthDate,
          extra: editingMember.extra,
        }),
      });

      if (!response.ok) throw new Error('멤버 수정에 실패했습니다.');

      await fetchMembers();
      setEditingMember(null);
      setIsEditDialogOpen(false);
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
      const response = await fetch(`/api/admin/members/${id}`, {
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

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row gap-4 items-end'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow'>
          <Input
            placeholder='이름'
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            disabled={isLoading}
          />
          <Input
            placeholder='전화번호'
            value={newMember.phone}
            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
            disabled={isLoading}
          />
          <Input
            placeholder='생년월일'
            value={newMember.birthDate}
            onChange={(e) => setNewMember({ ...newMember, birthDate: e.target.value })}
            disabled={isLoading}
          />
          <Input
            placeholder='추가 정보'
            value={newMember.extra}
            onChange={(e) => setNewMember({ ...newMember, extra: e.target.value })}
            disabled={isLoading}
          />
          <Button onClick={addMember} disabled={isLoading || !newMember.name.trim()}>
            추가
          </Button>
        </div>
      </div>

      <Separator />
      <div className='relative flex-grow md:max-w-xs'>
        <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='이름 또는 전화번호 검색'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-8'
        />
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='cursor-pointer' onClick={() => handleSort('name')}>
                <div className='flex items-center'>
                  이름
                  <ArrowUpDown className='ml-2 h-4 w-4' />
                </div>
              </TableHead>
              <TableHead className='cursor-pointer' onClick={() => handleSort('phone')}>
                <div className='flex items-center'>
                  전화번호
                  <ArrowUpDown className='ml-2 h-4 w-4' />
                </div>
              </TableHead>
              <TableHead className='cursor-pointer' onClick={() => handleSort('birthDate')}>
                <div className='flex items-center'>
                  생년월일
                  <ArrowUpDown className='ml-2 h-4 w-4' />
                </div>
              </TableHead>
              <TableHead className='cursor-pointer' onClick={() => handleSort('extra')}>
                <div className='flex items-center'>
                  추가 정보
                  <ArrowUpDown className='ml-2 h-4 w-4' />
                </div>
              </TableHead>
              <TableHead className='text-right'>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center'>
                  등록된 멤버가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.phone || '-'}</TableCell>
                  <TableCell>{member.birthDate || '-'}</TableCell>
                  <TableCell>{member.extra || '-'}</TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' className='h-8 w-8 p-0'>
                          <span className='sr-only'>메뉴 열기</span>
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingMember(member);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className='text-red-600'
                          onClick={() => deleteMember(member.id)}
                        >
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 멤버 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 정보 수정</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-4 items-center gap-4'>
                <label htmlFor='name' className='text-right'>
                  이름
                </label>
                <Input
                  id='name'
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className='col-span-3'
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <label htmlFor='phone' className='text-right'>
                  전화번호
                </label>
                <Input
                  id='phone'
                  value={editingMember.phone || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, phone: e.target.value || null })
                  }
                  className='col-span-3'
                  placeholder='010-0000-0000'
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <label htmlFor='birthDate' className='text-right'>
                  생년월일
                </label>
                <Input
                  id='birthDate'
                  value={editingMember.birthDate || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, birthDate: e.target.value || null })
                  }
                  className='col-span-3'
                  placeholder='YYYY-MM-DD'
                />
              </div>
              <div className='grid grid-cols-4 items-center gap-4'>
                <label htmlFor='extra' className='text-right'>
                  추가 정보
                </label>
                <Input
                  id='extra'
                  value={editingMember.extra || ''}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, extra: e.target.value || null })
                  }
                  className='col-span-3'
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={updateMember} disabled={!editingMember?.name.trim()}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
