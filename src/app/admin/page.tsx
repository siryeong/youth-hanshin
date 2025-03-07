'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import VillageManagement from './components/VillageManagement';
import MemberManagement from './components/MemberManagement';
import MenuManagement from './components/MenuManagement';
import OrderManagement from './components/OrderManagement';
import CafeSettings from './components/CafeSettings';

export default function AdminPage() {
  return (
    <div className='container mx-auto py-10'>
      <h1 className='text-3xl font-bold mb-6'>관리자 페이지</h1>

      <Tabs defaultValue='villages' className='w-full'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='villages'>마을 관리</TabsTrigger>
          <TabsTrigger value='members'>마을 멤버 관리</TabsTrigger>
          <TabsTrigger value='menu'>메뉴 관리</TabsTrigger>
          <TabsTrigger value='orders'>주문 관리</TabsTrigger>
          <TabsTrigger value='cafe-settings'>카페 설정</TabsTrigger>
        </TabsList>

        <TabsContent value='villages'>
          <Card>
            <CardHeader>
              <CardTitle>마을 관리</CardTitle>
              <CardDescription>마을을 추가, 수정, 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <VillageManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='members'>
          <Card>
            <CardHeader>
              <CardTitle>마을 멤버 관리</CardTitle>
              <CardDescription>마을 멤버를 추가, 수정, 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='menu'>
          <Card>
            <CardHeader>
              <CardTitle>메뉴 관리</CardTitle>
              <CardDescription>카페 메뉴를 추가, 수정, 삭제할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <MenuManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='orders'>
          <Card>
            <CardHeader>
              <CardTitle>주문 관리</CardTitle>
              <CardDescription>주문 상태를 변경하고 관리할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='cafe-settings'>
          <Card>
            <CardHeader>
              <CardTitle>카페 설정</CardTitle>
              <CardDescription>카페 설정을 관리할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <CafeSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
