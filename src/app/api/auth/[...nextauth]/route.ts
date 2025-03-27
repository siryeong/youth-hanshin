import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { 사용자저장소가져오기 } from '@/repositories';

// 관리자 인증을 위한 NextAuth 설정
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const 사용자저장소 = 사용자저장소가져오기();

          // 사용자 조회
          const 사용자 = await 사용자저장소.이메일로사용자찾기(credentials.email);

          if (!사용자) {
            console.error('사용자를 찾을 수 없습니다');
            return null;
          }

          // 비밀번호 가져오기
          const 저장된비밀번호 = await 사용자저장소.사용자비밀번호가져오기(credentials.email);

          if (!저장된비밀번호) {
            console.error('비밀번호를 찾을 수 없습니다');
            return null;
          }

          // 타입 안전하게 접근
          const { id, email, name, isAdmin } = 사용자;

          if (!email || !name || !저장된비밀번호) {
            return null;
          }

          // 비밀번호 확인
          const isPasswordValid = await compare(credentials.password, 저장된비밀번호);

          if (!isPasswordValid) {
            return null;
          }

          // 관리자 권한 확인
          if (!isAdmin) {
            throw new Error('관리자 권한이 없습니다.');
          }

          return {
            id,
            email,
            name,
            isAdmin,
          };
        } catch (error) {
          console.error('인증 오류:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});

export { handler as GET, handler as POST };
