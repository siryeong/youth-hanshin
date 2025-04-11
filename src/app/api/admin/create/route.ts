import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { create, findByEmail } from '@/db/repository/accountRepository';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, secretKey } = await req.json();

    // 관리자 시크릿 키 확인
    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    if (!adminSecretKey || secretKey !== adminSecretKey) {
      return NextResponse.json({ error: '관리자 시크릿 키가 올바르지 않습니다.' }, { status: 401 });
    }

    // 이메일 중복 확인
    const existingUser = await findByEmail({ email });

    if (existingUser) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 });
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10);

    // 관리자 계정 생성
    const adminAccount = await create({ name, email, password: hashedPassword, isAdmin: true });

    if (!adminAccount) {
      return NextResponse.json(
        { error: '관리자 계정 생성 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }

    // 비밀번호를 제외한 사용자 정보 추출
    const adminAccountWithoutPassword = {
      id: adminAccount.id,
      name: adminAccount.name,
      email: adminAccount.email,
      isAdmin: adminAccount.isAdmin,
    };

    return NextResponse.json(
      { message: '관리자 계정이 생성되었습니다.', user: adminAccountWithoutPassword },
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
