import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ServiceRegistry } from '@/lib/service-registry';

/**
 * 관리자 인증을 위한 NextAuth 설정
 */
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
          const userService = ServiceRegistry.getUserService();

          // 관리자 인증 시도
          const user = await userService.authenticateAdmin(credentials.email, credentials.password);

          // 인증 실패
          if (!user) {
            return null;
          }

          // 인증 성공 - 사용자 정보 반환
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
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
