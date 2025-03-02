import { Metadata } from 'next';
import CafeMenuPage from '@/components/cafe/CafeMenuPage';

export const metadata: Metadata = {
  title: '카페 메뉴 | 주문하기',
  description: '다양한 카페 메뉴를 확인하고 주문하세요.',
};

export default function CafeMenu() {
  return <CafeMenuPage />;
}
