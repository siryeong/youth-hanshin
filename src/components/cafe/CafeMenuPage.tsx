"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// 메뉴 아이템 타입 정의
type MenuItem = {
  id: number;
  name: string;
  description: string;
  category: "coffee" | "tea" | "dessert";
  image: string;
};

// 카트 아이템 타입 정의
type CartItem = MenuItem;

// 마을 목록
const villages = [
  "한신 1마을",
  "한신 2마을",
  "한신 3마을",
  "한신 4마을",
  "한신 5마을",
  "한신 6마을",
  "한신 7마을",
  "한신 8마을",
  "한신 9마을",
  "한신 10마을",
];

// 사전 등록된 이름 목록
const registeredNames = [
  "김영희",
  "이철수",
  "박지민",
  "정민준",
  "최서연",
  "강도현",
  "윤지우",
  "장하은",
];

// 샘플 메뉴 데이터
const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "아메리카노",
    description: "깊고 풍부한 에스프레소에 물을 더한 클래식한 커피",
    category: "coffee",
    image: "/images/americano.jpg",
  },
  {
    id: 2,
    name: "카페 라떼",
    description: "에스프레소와 스팀 밀크의 완벽한 조화",
    category: "coffee",
    image: "/images/latte.jpg",
  },
  {
    id: 3,
    name: "카푸치노",
    description: "에스프레소, 스팀 밀크, 그리고 풍성한 우유 거품의 조화",
    category: "coffee",
    image: "/images/cappuccino.jpg",
  },
  {
    id: 4,
    name: "녹차",
    description: "향긋한 녹차의 풍미를 느낄 수 있는 차",
    category: "tea",
    image: "/images/green-tea.jpg",
  },
  {
    id: 5,
    name: "얼그레이 티",
    description: "베르가못 오일의 향이 특징인 홍차",
    category: "tea",
    image: "/images/earl-grey.jpg",
  },
  {
    id: 6,
    name: "치즈케이크",
    description: "부드럽고 크리미한 뉴욕 스타일 치즈케이크",
    category: "dessert",
    image: "/images/cheesecake.jpg",
  },
  {
    id: 7,
    name: "초코 브라우니",
    description: "진한 초콜릿의 맛이 일품인 브라우니",
    category: "dessert",
    image: "/images/brownie.jpg",
  },
];

export default function CafeMenuPage() {
  const [cart, setCart] = useState<CartItem | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [village, setVillage] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isCustomName, setIsCustomName] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [orderStep, setOrderStep] = useState<"info" | "menu" | "cart">("info");

  // 카트에 아이템 추가 (한 개만 가능하도록 수정)
  const addToCart = (item: MenuItem) => {
    // 이미 선택된 메뉴가 있으면 교체
    setCart(item);
    toast.success(`${item.name}이(가) 선택되었습니다.`);
  };

  // 카트 비우기
  const clearCart = () => {
    setCart(null);
  };

  // 카테고리별 메뉴 필터링
  const filteredMenu = category === "all"
    ? menuItems
    : menuItems.filter((item) => item.category === category);

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  // 마을 선택 처리
  const selectVillage = (selectedVillage: string) => {
    setVillage(selectedVillage);
    toast.success(`${selectedVillage}이(가) 선택되었습니다.`);
  };

  // 이름 선택 처리
  const selectName = (selectedName: string) => {
    if (selectedName === "직접 입력") {
      setIsCustomName(true);
      setName("");
    } else {
      setIsCustomName(false);
      setName(selectedName);
      toast.success(`${selectedName}님으로 선택되었습니다.`);
    }
  };

  // 직접 입력한 이름 처리
  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
  };

  // 직접 입력한 이름 적용
  const applyCustomName = () => {
    if (customName.trim()) {
      setName(customName.trim());
      toast.success(`${customName.trim()}님으로 입력되었습니다.`);
    } else {
      toast.error("이름을 입력해주세요.");
    }
  };

  // 주문 정보 유효성 검사
  const isOrderInfoValid = () => {
    return village !== "" && name !== "";
  };

  // 주문 처리
  const handleOrder = () => {
    if (!isOrderInfoValid()) {
      toast.error("마을과 이름을 입력해주세요.");
      setOrderStep("info");
      return;
    }

    if (!cart) {
      toast.error("메뉴를 선택해주세요.");
      setOrderStep("menu");
      return;
    }

    // 주문 정보 출력
    const orderDetails = {
      village,
      name,
      isCustomName,
      item: cart.name
    };

    console.log("주문 정보:", orderDetails);
    toast.success(`${village} ${name}님의 주문이 완료되었습니다!`);
    
    // 주문 후 초기화
    setCart(null);
    setName("");
    setVillage("");
    setIsCustomName(false);
    setCustomName("");
    setOrderStep("info");
  };

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (orderStep === "info") {
      if (isOrderInfoValid()) {
        setOrderStep("menu");
      } else {
        toast.error("마을과 이름을 입력해주세요.");
      }
    } else if (orderStep === "menu") {
      if (cart) {
        setOrderStep("cart");
      } else {
        toast.error("메뉴를 선택해주세요.");
      }
    }
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (orderStep === "menu") {
      setOrderStep("info");
    } else if (orderStep === "cart") {
      setOrderStep("menu");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">카페 메뉴</h1>
      
      <div className="flex flex-col gap-8">
        {/* 주문 단계 표시 */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orderStep === "info" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              1
            </div>
            <div className="w-16 h-1 bg-muted"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orderStep === "menu" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2
            </div>
            <div className="w-16 h-1 bg-muted"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${orderStep === "cart" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              3
            </div>
          </div>
        </div>
        
        {/* 주문 정보 입력 */}
        {orderStep === "info" && (
          <Card>
            <CardHeader>
              <CardTitle>주문 정보</CardTitle>
              <CardDescription>주문을 위한 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>마을 선택</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {villages.map((v) => (
                    <Card 
                      key={v} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${village === v ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectVillage(v)}
                    >
                      <CardHeader className="p-3 text-center">
                        <CardTitle className="text-sm">{v}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                {village && (
                  <p className="text-sm text-muted-foreground">선택된 마을: {village}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label>이름 선택</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {registeredNames.map((n) => (
                    <Card 
                      key={n} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${!isCustomName && name === n ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => selectName(n)}
                    >
                      <CardHeader className="p-3 text-center">
                        <CardTitle className="text-sm">{n}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                  <Card 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${isCustomName ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => selectName("직접 입력")}
                  >
                    <CardHeader className="p-3 text-center">
                      <CardTitle className="text-sm">직접 입력</CardTitle>
                    </CardHeader>
                  </Card>
                </div>
                
                {isCustomName && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="이름을 입력해주세요"
                      value={customName}
                      onChange={handleCustomNameChange}
                      className="flex-1"
                    />
                    <Button onClick={applyCustomName}>
                      적용
                    </Button>
                  </div>
                )}
                
                {name && !isCustomName && (
                  <p className="text-sm text-muted-foreground">선택된 이름: {name}</p>
                )}
                {name && isCustomName && (
                  <p className="text-sm text-muted-foreground">입력된 이름: {name}</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={goToNextStep} className="w-full">
                다음 단계
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* 메뉴 선택 */}
        {orderStep === "menu" && (
          <div className="flex flex-col md:flex-row gap-8">
            {/* 메뉴 섹션 */}
            <div className="w-full md:w-2/3">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">메뉴</h2>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 메뉴</SelectItem>
                    <SelectItem value="coffee">커피</SelectItem>
                    <SelectItem value="tea">차</SelectItem>
                    <SelectItem value="dessert">디저트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredMenu.map((item) => (
                  <Card 
                    key={item.id} 
                    className={`overflow-hidden hover:shadow-md transition-shadow ${cart?.id === item.id ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="h-36 bg-gray-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        이미지 준비 중
                      </div>
                    </div>
                    <CardHeader className="p-3 text-center">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                    </CardHeader>
                    <CardFooter className="p-3 pt-0">
                      <Button 
                        onClick={() => addToCart(item)} 
                        className="w-full"
                        variant={cart?.id === item.id ? "secondary" : "default"}
                        size="sm"
                      >
                        {cart?.id === item.id ? "선택됨" : "선택하기"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* 장바구니 섹션 */}
            <div className="w-full md:w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>선택한 메뉴</CardTitle>
                  <CardDescription>선택한 메뉴를 확인하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  {!cart ? (
                    <p className="text-center text-gray-500 my-8">선택한 메뉴가 없습니다</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{cart.name}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" onClick={goToPrevStep} className="flex-1">
                      이전 단계
                    </Button>
                    <Button onClick={goToNextStep} className="flex-1" disabled={!cart}>
                      다음 단계
                    </Button>
                  </div>
                  {cart && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={clearCart}
                    >
                      선택 취소
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
        
        {/* 주문 확인 */}
        {orderStep === "cart" && (
          <Card>
            <CardHeader>
              <CardTitle>주문 확인</CardTitle>
              <CardDescription>주문 내용을 확인해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold">주문 정보</h3>
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">마을</span>
                    <span>{village}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-3">
                    <span className="font-medium">이름</span>
                    <div className="flex items-center gap-2">
                      <span>{name}</span>
                      {isCustomName && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">직접 입력</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="font-semibold">주문 메뉴</h3>
                {cart && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <span>{cart.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={goToPrevStep} className="flex-1">
                이전 단계
              </Button>
              <Button onClick={handleOrder} className="flex-1">
                주문 완료
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      
      <Toaster />
    </div>
  );
} 