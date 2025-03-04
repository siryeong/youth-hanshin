import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, secretKey } = await req.json();

    // 관리자 시크릿 키 확인
    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    if (!adminSecretKey || secretKey !== adminSecretKey) {
      return NextResponse.json({ error: '관리자 시크릿 키가 올바르지 않습니다.' }, { status: 401 });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 });
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10);

    // 관리자 계정 생성
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isAdmin: true,
      },
    });

    // 비밀번호를 제외한 사용자 정보 추출
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    return NextResponse.json(
      { message: '관리자 계정이 생성되었습니다.', user: userWithoutPassword },
      { status: 201 },
    );
  } catch (error) {
    console.error('관리자 계정 생성 오류:', error);
    return NextResponse.json(
      { error: '관리자 계정 생성 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
