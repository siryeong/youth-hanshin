export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'coffee' | 'tea' | 'dessert' | 'smoothie';
  image: string;
}

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: '아메리카노',
    description: '깊고 풍부한 에스프레소에 물을 더한 클래식한 커피',
    price: 4500,
    category: 'coffee',
    image: '/images/americano.jpg',
  },
  {
    id: '2',
    name: '카페 라떼',
    description: '에스프레소와 부드러운 스팀 밀크의 완벽한 조화',
    price: 5000,
    category: 'coffee',
    image: '/images/latte.jpg',
  },
  {
    id: '3',
    name: '카푸치노',
    description: '에스프레소, 스팀 밀크, 그리고 풍성한 우유 거품의 클래식한 조합',
    price: 5000,
    category: 'coffee',
    image: '/images/cappuccino.jpg',
  },
  {
    id: '4',
    name: '녹차',
    description: '부드럽고 상쾌한 향의 전통 녹차',
    price: 4000,
    category: 'tea',
    image: '/images/green-tea.jpg',
  },
  {
    id: '5',
    name: '얼그레이 티',
    description: '베르가못 오일의 향긋한 향이 특징인 홍차',
    price: 4000,
    category: 'tea',
    image: '/images/earl-grey.jpg',
  },
  {
    id: '6',
    name: '치즈케이크',
    description: '부드럽고 크리미한 뉴욕 스타일 치즈케이크',
    price: 6500,
    category: 'dessert',
    image: '/images/cheesecake.jpg',
  },
  {
    id: '7',
    name: '초콜릿 브라우니',
    description: '진한 초콜릿 풍미가 가득한 촉촉한 브라우니',
    price: 5500,
    category: 'dessert',
    image: '/images/brownie.jpg',
  },
  {
    id: '8',
    name: '딸기 스무디',
    description: '신선한 딸기와 요거트로 만든 상큼한 스무디',
    price: 6000,
    category: 'smoothie',
    image: '/images/strawberry-smoothie.jpg',
  },
  {
    id: '9',
    name: '망고 스무디',
    description: '달콤한 망고의 풍미가 가득한 트로피컬 스무디',
    price: 6000,
    category: 'smoothie',
    image: '/images/mango-smoothie.jpg',
  },
];
