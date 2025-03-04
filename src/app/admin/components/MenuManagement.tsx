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

interface MenuCategory {
  id: number;
  name: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  imagePath: string;
  isTemperatureRequired: boolean;
}

export default function MenuManagement() {
  // 상태 관리
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 카테고리 관련 상태
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  // 메뉴 아이템 관련 상태
  const [newMenuItem, setNewMenuItem] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    description: '',
    categoryId: 0,
    imagePath: '',
    isTemperatureRequired: false,
  });
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // 카테고리 목록 불러오기
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/menu/categories');
      if (!response.ok) throw new Error('카테고리 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 목록 불러오기 오류:', error);
    }
  };

  // 메뉴 아이템 목록 불러오기
  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/items');
      if (!response.ok) throw new Error('메뉴 아이템 목록을 불러오는데 실패했습니다.');
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('메뉴 아이템 목록 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  // 카테고리 추가
  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!response.ok) throw new Error('카테고리 추가에 실패했습니다.');

      await fetchCategories();
      setNewCategoryName('');
    } catch (error) {
      console.error('카테고리 추가 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 수정
  const updateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/menu/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategory.name }),
      });

      if (!response.ok) throw new Error('카테고리 수정에 실패했습니다.');

      await fetchCategories();
      setEditingCategory(null);
    } catch (error) {
      console.error('카테고리 수정 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 삭제
  const deleteCategory = async (id: number) => {
    // 해당 카테고리에 메뉴 아이템이 있는지 확인
    const hasItems = menuItems.some((item) => item.categoryId === id);
    if (hasItems) {
      alert(
        '이 카테고리에 메뉴 아이템이 있어 삭제할 수 없습니다. 먼저 메뉴 아이템을 삭제해주세요.',
      );
      return;
    }

    if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/menu/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('카테고리 삭제에 실패했습니다.');

      await fetchCategories();
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 메뉴 아이템 추가
  const addMenuItem = async () => {
    if (!newMenuItem.name.trim() || !newMenuItem.description.trim() || !newMenuItem.categoryId)
      return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMenuItem),
      });

      if (!response.ok) throw new Error('메뉴 아이템 추가에 실패했습니다.');

      await fetchMenuItems();
      setNewMenuItem({
        name: '',
        description: '',
        categoryId: 0,
        imagePath: '',
        isTemperatureRequired: false,
      });
    } catch (error) {
      console.error('메뉴 아이템 추가 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 메뉴 아이템 수정
  const updateMenuItem = async () => {
    if (!editingMenuItem || !editingMenuItem.name.trim() || !editingMenuItem.description.trim())
      return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/menu/items/${editingMenuItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMenuItem),
      });

      if (!response.ok) throw new Error('메뉴 아이템 수정에 실패했습니다.');

      await fetchMenuItems();
      setEditingMenuItem(null);
    } catch (error) {
      console.error('메뉴 아이템 수정 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 메뉴 아이템 삭제
  const deleteMenuItem = async (id: number) => {
    if (!confirm('정말로 이 메뉴 아이템을 삭제하시겠습니까?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/menu/items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('메뉴 아이템 삭제에 실패했습니다.');

      await fetchMenuItems();
    } catch (error) {
      console.error('메뉴 아이템 삭제 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : '알 수 없음';
  };

  // 필터링된 메뉴 아이템 목록
  const filteredMenuItems =
    selectedCategoryId === 'all'
      ? menuItems
      : menuItems.filter((item) => item.categoryId === parseInt(selectedCategoryId));

  return (
    <div className='space-y-6'>
      <div className='flex space-x-2'>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'outline'}
          onClick={() => setActiveTab('categories')}
        >
          카테고리 관리
        </Button>
        <Button
          variant={activeTab === 'items' ? 'default' : 'outline'}
          onClick={() => setActiveTab('items')}
        >
          메뉴 아이템 관리
        </Button>
      </div>

      <Separator />

      {activeTab === 'categories' ? (
        <div className='space-y-6'>
          <div className='flex items-center space-x-2'>
            <Input
              placeholder='새 카테고리 이름'
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={addCategory} disabled={isLoading || !newCategoryName.trim()}>
              추가
            </Button>
          </div>

          {isLoading && <div className='text-center py-4'>로딩 중...</div>}

          <div className='space-y-4'>
            {categories.length === 0 && !isLoading ? (
              <div className='text-center py-4 text-muted-foreground'>
                등록된 카테고리가 없습니다.
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className='flex items-center justify-between p-3 border rounded-md'
                >
                  {editingCategory?.id === category.id ? (
                    <div className='flex items-center space-x-2 flex-1'>
                      <Input
                        value={editingCategory.name}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, name: e.target.value })
                        }
                        disabled={isLoading}
                      />
                      <Button
                        onClick={updateCategory}
                        disabled={isLoading || !editingCategory.name.trim()}
                        size='sm'
                      >
                        저장
                      </Button>
                      <Button
                        onClick={() => setEditingCategory(null)}
                        variant='outline'
                        size='sm'
                        disabled={isLoading}
                      >
                        취소
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className='text-lg'>{category.name}</span>
                      <div className='flex items-center space-x-2'>
                        <Button
                          onClick={() => setEditingCategory(category)}
                          variant='outline'
                          size='sm'
                          disabled={isLoading}
                        >
                          수정
                        </Button>
                        <Button
                          onClick={() => deleteCategory(category.id)}
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
      ) : (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-4'>
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
              <Input
                placeholder='이미지 경로'
                value={newMenuItem.imagePath}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, imagePath: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className='space-y-4'>
              <Select
                value={newMenuItem.categoryId ? newMenuItem.categoryId.toString() : ''}
                onValueChange={(value) =>
                  setNewMenuItem({
                    ...newMenuItem,
                    categoryId: parseInt(value),
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder='카테고리 선택' />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='isTemperatureRequired'
                  checked={newMenuItem.isTemperatureRequired}
                  onChange={(e) =>
                    setNewMenuItem({
                      ...newMenuItem,
                      isTemperatureRequired: e.target.checked,
                    })
                  }
                  disabled={isLoading}
                  className='mr-2'
                />
                <label htmlFor='isTemperatureRequired'>온도 선택 필요</label>
              </div>
              <Button
                onClick={addMenuItem}
                disabled={
                  isLoading ||
                  !newMenuItem.name.trim() ||
                  !newMenuItem.description.trim() ||
                  !newMenuItem.categoryId
                }
                className='w-full'
              >
                메뉴 추가
              </Button>
            </div>
          </div>

          <Separator />

          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-medium'>메뉴 목록</h3>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='카테고리 필터' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>모든 카테고리</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
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
                          value={editingMenuItem.categoryId.toString()}
                          onValueChange={(value) =>
                            setEditingMenuItem({
                              ...editingMenuItem,
                              categoryId: parseInt(value),
                            })
                          }
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='카테고리 선택' />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder='메뉴 설명'
                        value={editingMenuItem.description}
                        onChange={(e) =>
                          setEditingMenuItem({ ...editingMenuItem, description: e.target.value })
                        }
                        disabled={isLoading}
                      />
                      <Input
                        placeholder='이미지 경로'
                        value={editingMenuItem.imagePath}
                        onChange={(e) =>
                          setEditingMenuItem({ ...editingMenuItem, imagePath: e.target.value })
                        }
                        disabled={isLoading}
                      />
                      <div className='flex items-center space-x-2'>
                        <input
                          type='checkbox'
                          id={`isTemperatureRequired-${item.id}`}
                          checked={editingMenuItem.isTemperatureRequired}
                          onChange={(e) =>
                            setEditingMenuItem({
                              ...editingMenuItem,
                              isTemperatureRequired: e.target.checked,
                            })
                          }
                          disabled={isLoading}
                          className='mr-2'
                        />
                        <label htmlFor={`isTemperatureRequired-${item.id}`}>온도 선택 필요</label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Button
                          onClick={updateMenuItem}
                          disabled={
                            isLoading ||
                            !editingMenuItem.name.trim() ||
                            !editingMenuItem.description.trim()
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
                            {getCategoryName(item.categoryId)}
                            {item.isTemperatureRequired && ' • 온도 선택 필요'}
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
                      {item.imagePath && (
                        <div className='mt-2'>
                          <p className='text-xs text-muted-foreground'>
                            이미지 경로: {item.imagePath}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
