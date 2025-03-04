import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { hash } from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, secretKey } = await req.json();

    // 관리자 시크릿 키 확인
    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    if (!adminSecretKey || secretKey !== adminSecretKey) {
      return NextResponse.json({ error: '관리자 시크릿 키가 올바르지 않습니다.' }, { status: 401 });
    }

    const client = getSupabaseClient();

    // 이메일 중복 확인
    const { data: existingUser, error: findError } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116는 결과가 없을 때 발생하는 에러 코드
      throw findError;
    }

    if (existingUser) {
      return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 400 });
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 10);

    // 관리자 계정 생성
    const { data: user, error: createError } = await client
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        is_admin: true,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // 비밀번호를 제외한 사용자 정보 추출
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
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
