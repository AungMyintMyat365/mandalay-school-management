
import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { fetchGAS } from "@/lib/api";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            assignedClass?: string;
        } & DefaultSession["user"];
    }

    interface User {
        role: string;
        assignedClass?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string;
        assignedClass?: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    // Call GAS to verify
                    // Note: fetchGAS throws on error
                    const res = await fetchGAS<any>('login', {
                        email: credentials.email,
                        password: credentials.password
                    });

                    if (res.status === 'success' && res.user) {
                        return {
                            id: res.user.email || credentials.email, // using email as ID
                            name: res.user.name,
                            email: credentials.email,
                            role: res.user.role,
                            assignedClass: res.user.assignedClass
                        };
                    }
                    return null;
                } catch (e) {
                    console.error("Auth error:", e);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.assignedClass = user.assignedClass;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role as string;
                session.user.assignedClass = token.assignedClass as string;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
