import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Village, Member } from '@/model/model';

interface OrderInfoStepProps {
  villages: Village[];
  orderInfo: {
    village: Village | null;
    member: Member | null;
    customName: string | null;
  };
  isCustomName: boolean;
  selectVillage: (village: Village) => void;
  selectMember: (member: Member | null) => void;
  handleCustomNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  applyCustomName: () => void;
}

export function OrderInfoStep({
  villages,
  orderInfo,
  isCustomName,
  selectVillage,
  selectMember,
  handleCustomNameChange,
  applyCustomName,
}: OrderInfoStepProps) {
  return (
    <Card>
      <CardHeader className='p-4 sm:p-6'>
        <CardTitle>주문 정보</CardTitle>
        <CardDescription>주문을 위한 정보를 입력해주세요</CardDescription>
      </CardHeader>
      <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
        <div className='space-y-3'>
          <Label>마을 선택</Label>
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3'>
            {villages.map((v) => (
              <Card
                key={v.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${orderInfo.village?.id === v.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => selectVillage(v)}
              >
                <CardHeader className='p-2 sm:p-3 text-center'>
                  <CardTitle className='text-xs sm:text-sm'>{v.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
          {orderInfo.village && (
            <p className='text-xs sm:text-sm text-muted-foreground'>
              선택된 마을: {orderInfo.village.name}
            </p>
          )}
        </div>

        {orderInfo.village && (
          <div className='space-y-3'>
            <Label>이름 선택</Label>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3'>
              {orderInfo.village.members.map((member) => (
                <Card
                  key={member.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${!isCustomName && orderInfo.member?.name === member.name ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => selectMember(member)}
                >
                  <CardHeader className='p-2 sm:p-3 text-center'>
                    <CardTitle className='text-xs sm:text-sm'>{member.name}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
              <Card
                className={`bg-gray-50 cursor-pointer hover:shadow-md transition-shadow ${isCustomName ? 'ring-2 ring-primary' : ''}`}
                onClick={() => selectMember(null)}
              >
                <CardHeader className='p-2 sm:p-3 text-center'>
                  <CardTitle className='text-xs sm:text-sm'>직접 입력</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {isCustomName && (
              <div className='flex gap-2 mt-2'>
                <Input
                  placeholder='이름을 입력해주세요'
                  value={orderInfo.customName || ''}
                  onChange={handleCustomNameChange}
                  className='flex-1'
                />
                <Button onClick={applyCustomName}>적용</Button>
              </div>
            )}

            {orderInfo.member && !isCustomName && (
              <p className='text-xs sm:text-sm text-muted-foreground'>
                선택된 이름: {orderInfo.member.name}
              </p>
            )}
            {orderInfo.customName && isCustomName && (
              <p className='text-xs sm:text-sm text-muted-foreground'>
                입력된 이름: {orderInfo.customName}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
