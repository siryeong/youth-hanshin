import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { findByEmail } from '@/db/repository/accountRepository';

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
          const account = await findByEmail({ email: credentials.email });

          if (!account) {
            console.error('사용자를 찾을 수 없습니다');
            return null;
          }

          const { id, email, name, isAdmin, password } = account;
          if (!email || !name || !password) {
            return null;
          }

          const isPasswordValid = await compare(credentials.password, password);

          if (!isPasswordValid) {
            return null;
          }

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
