import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getSupabaseClient } from '@/lib/supabase';
import { compare } from 'bcrypt';

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
          const client = getSupabaseClient();

          // 사용자 조회
          const { data, error } = await client
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !data) {
            console.error('사용자 조회 오류:', error);
            return null;
          }

          // 타입 안전하게 접근
          const email = data.email as string;
          const name = data.name as string;
          const password = data.password as string;
          const isAdmin = data.is_admin as boolean;
          const id = data.id as string;

          if (!email || !name || !password) {
            return null;
          }

          // 비밀번호 확인
          const isPasswordValid = await compare(credentials.password, password);

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
