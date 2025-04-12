'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { CafeMenuItem, CafeMenuItemCategoryType, CAFE_MENU_ITEM_CATEGORY } from '@/model/model';

export default function MenuManagement() {
  // 상태 관리
  const [menuItems, setMenuItems] = useState<CafeMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CafeMenuItemCategoryType | 'all'>('all');

  // 메뉴 아이템 관련 상태
  const [newMenuItem, setNewMenuItem] = useState<Omit<CafeMenuItem, 'id'>>({
    name: '',
    description: '',
    category: 'coffee',
    price: 0,
    requiredOptions: { temperature: false, strength: false },
    createdAt: '',
    updatedAt: '',
  });
  const [editingMenuItem, setEditingMenuItem] = useState<CafeMenuItem | null>(null);

  // 메뉴 아이템 목록 불러오기
  const fetchMenuItems = useCallback(() => {
    setIsLoading(true);
    fetch('/api/admin/cafe-menu/items')
      .then((response) => {
        if (!response.ok) throw new Error('메뉴 아이템 목록을 불러오는데 실패했습니다.');
        return response.json();
      })
      .then((data) => setMenuItems(data))
      .catch((error) => console.error('메뉴 아이템 목록 불러오기 오류:', error))
      .finally(() => setIsLoading(false));
  }, []);

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // 메뉴 아이템 추가
  const addMenuItem = useCallback(() => {
    if (!newMenuItem.name.trim() || !newMenuItem.category) return;

    setIsLoading(true);
    fetch('/api/admin/cafe-menu/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMenuItem),
    })
      .then((response) => {
        if (!response.ok) throw new Error('메뉴 아이템 추가에 실패했습니다.');
        return response.json();
      })
      .then(() => {
        fetchMenuItems();
        setNewMenuItem({
          name: '',
          description: '',
          category: 'coffee',
          price: 0,
          requiredOptions: { temperature: false, strength: false },
          createdAt: '',
          updatedAt: '',
        });
      })
      .catch((error) => console.error('메뉴 아이템 추가 오류:', error))
      .finally(() => setIsLoading(false));
  }, [newMenuItem, fetchMenuItems]);

  // 메뉴 아이템 수정
  const updateMenuItem = useCallback(() => {
    if (!editingMenuItem || !editingMenuItem.name.trim() || !editingMenuItem.category) return;

    setIsLoading(true);
    fetch(`/api/admin/cafe-menu/items/${editingMenuItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingMenuItem),
    })
      .then((response) => {
        if (!response.ok) throw new Error('메뉴 아이템 수정에 실패했습니다.');
        return response.json();
      })
      .then(() => {
        fetchMenuItems();
        setEditingMenuItem(null);
      })
      .catch((error) => console.error('메뉴 아이템 수정 오류:', error))
      .finally(() => setIsLoading(false));
  }, [editingMenuItem, fetchMenuItems]);

  // 메뉴 아이템 삭제
  const deleteMenuItem = useCallback(
    (id: number) => {
      if (!confirm('정말로 이 메뉴 아이템을 삭제하시겠습니까?')) return;

      setIsLoading(true);
      fetch(`/api/admin/cafe-menu/items/${id}`, {
        method: 'DELETE',
      })
        .then((response) => {
          if (!response.ok) throw new Error('메뉴 아이템 삭제에 실패했습니다.');
        })
        .then(() => fetchMenuItems())
        .catch((error) => console.error('메뉴 아이템 삭제 오류:', error))
        .finally(() => setIsLoading(false));
    },
    [fetchMenuItems],
  );

  // 필터링된 메뉴 아이템 목록
  const filteredMenuItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div className='space-y-6'>
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            placeholder='메뉴 이름'
            value={newMenuItem.name}
            onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
            disabled={isLoading}
          />
          <Input
            placeholder='메뉴 설명'
            value={newMenuItem.description}
            onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
            disabled={isLoading}
          />
          <Select
            value={newMenuItem.category ? newMenuItem.category.toString() : ''}
            onValueChange={(value) =>
              setNewMenuItem({
                ...newMenuItem,
                category: value as CafeMenuItemCategoryType,
              })
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder='카테고리 선택' />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CAFE_MENU_ITEM_CATEGORY).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='isTemperatureRequired'
              checked={newMenuItem.requiredOptions.temperature}
              onChange={(e) =>
                setNewMenuItem({
                  ...newMenuItem,
                  requiredOptions: {
                    ...newMenuItem.requiredOptions,
                    temperature: e.target.checked,
                  },
                })
              }
              disabled={isLoading}
              className='mr-2'
            />
            <label htmlFor='isTemperatureRequired'>온도 선택 필요</label>
            <input
              type='checkbox'
              id='isStrengthRequired'
              checked={newMenuItem.requiredOptions['strength']}
              onChange={(e) =>
                setNewMenuItem({
                  ...newMenuItem,
                  requiredOptions: {
                    ...newMenuItem.requiredOptions,
                    strength: e.target.checked,
                  },
                })
              }
              disabled={isLoading}
              className='mr-2'
            />
            <label htmlFor='isStrengthRequired'>샷 농도 선택 필요</label>
          </div>
          <Button
            onClick={addMenuItem}
            disabled={isLoading || !newMenuItem.name.trim() || !newMenuItem.category}
            className='w-full'
          >
            메뉴 추가
          </Button>
        </div>

        <Separator />

        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-medium'>메뉴 목록</h3>
          <Select
            value={selectedCategory}
            onValueChange={(value) =>
              setSelectedCategory(value as CafeMenuItemCategoryType | 'all')
            }
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='카테고리 필터' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>모든 카테고리</SelectItem>
              {Object.values(CAFE_MENU_ITEM_CATEGORY).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && <div className='text-center py-4'>로딩 중...</div>}

        <div className='space-y-4'>
          {filteredMenuItems.length === 0 && !isLoading ? (
            <div className='text-center py-4 text-muted-foreground'>등록된 메뉴가 없습니다.</div>
          ) : (
            filteredMenuItems.map((item) => (
              <div key={item.id} className='p-4 border rounded-md'>
                {editingMenuItem?.id === item.id ? (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <Input
                        placeholder='메뉴 이름'
                        value={editingMenuItem.name}
                        onChange={(e) =>
                          setEditingMenuItem({ ...editingMenuItem, name: e.target.value })
                        }
                        disabled={isLoading}
                      />
                      <Select
                        value={editingMenuItem.category.toString()}
                        onValueChange={(value) =>
                          setEditingMenuItem({
                            ...editingMenuItem,
                            category: value as CafeMenuItemCategoryType,
                          })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='카테고리 선택' />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(CAFE_MENU_ITEM_CATEGORY).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder='메뉴 설명'
                      value={editingMenuItem.description || ''}
                      onChange={(e) =>
                        setEditingMenuItem({ ...editingMenuItem, description: e.target.value })
                      }
                      disabled={isLoading}
                    />
                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id={`isTemperatureRequired-${item.id}`}
                        checked={editingMenuItem.requiredOptions['temperature']}
                        onChange={(e) =>
                          setEditingMenuItem({
                            ...editingMenuItem,
                            requiredOptions: {
                              ...editingMenuItem.requiredOptions,
                              temperature: e.target.checked,
                            },
                          })
                        }
                        disabled={isLoading}
                        className='mr-2'
                      />
                      <label htmlFor={`isTemperatureRequired-${item.id}`}>온도 선택 필요</label>
                      <input
                        type='checkbox'
                        id={`isStrengthRequired-${item.id}`}
                        checked={editingMenuItem.requiredOptions['strength']}
                        onChange={(e) =>
                          setEditingMenuItem({
                            ...editingMenuItem,
                            requiredOptions: {
                              ...editingMenuItem.requiredOptions,
                              strength: e.target.checked,
                            },
                          })
                        }
                        disabled={isLoading}
                        className='mr-2'
                      />
                      <label htmlFor={`isStrengthRequired-${item.id}`}>샷 농도 선택 필요</label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Button
                        onClick={updateMenuItem}
                        disabled={
                          isLoading || !editingMenuItem.name.trim() || !editingMenuItem.category
                        }
                        className='flex-1'
                      >
                        저장
                      </Button>
                      <Button
                        onClick={() => setEditingMenuItem(null)}
                        variant='outline'
                        className='flex-1'
                        disabled={isLoading}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className='flex justify-between items-start mb-2'>
                      <div>
                        <h3 className='text-lg font-medium'>{item.name}</h3>
                        <p className='text-sm text-muted-foreground'>
                          {item.category}
                          {item.requiredOptions['temperature'] && ' • 온도 선택 필요'}
                          {item.requiredOptions['strength'] && ' • 샷 농도 선택 필요'}
                        </p>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Button
                          onClick={() => setEditingMenuItem(item)}
                          variant='outline'
                          size='sm'
                          disabled={isLoading}
                        >
                          수정
                        </Button>
                        <Button
                          onClick={() => deleteMenuItem(item.id)}
                          variant='destructive'
                          size='sm'
                          disabled={isLoading}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                    <p className='text-sm mb-2'>{item.description}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
