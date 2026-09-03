'use server';

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const updateProfile = async (userId: number, fullName: string | null, pseudo: string | null, avatarUrl: string | null) => {
    try {
        const [user] = await db
            .update(users)
            .set({
                fullName,
                pseudo,
                avatarUrl
            })
            .where(eq(users.id, userId))
            .returning();
        return user;
    } catch (err) {
        console.log(err);
    }
};

export const changePassword = async (userId: number, newPassword: string) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [user] = await db
            .update(users)
            .set({
                password: hashedPassword
            })
            .where(eq(users.id, userId))
            .returning();
        return user;
    } catch (err) {
        console.log(err);
    }
};

export const getMe = async () => {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return null;

        const user = await db.query.users.findFirst({
            where: eq(users.id, Number((session.user as any).id))
        });
        return user || null;
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const getSessionId = async () => {
    try {
        const user = await getMe();
        return user?.sessionId || null;
    } catch (err) {
        console.log(err);
        return null;
    }
};

export const getAvailableAvatars = async () => {
    try {
        const avatarsDir = path.resolve(process.cwd(), 'public/images/avatars');
        console.log('Fetching avatars from:', avatarsDir);
        if (!fs.existsSync(avatarsDir)) {
            console.error('Avatars directory not found:', avatarsDir);
            return [];
        }
        
        const files = fs.readdirSync(avatarsDir);
        return files
            .filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
            .map(file => `/images/avatars/${file}`);
    } catch (err) {
        console.log(err);
        return [];
    }
};

export const getAllUsers = async () => {
    try {
        const allUsers = await db.query.users.findMany({
            orderBy: [desc(users.createdAt)]
        });
        return allUsers;
    } catch (err) {
        console.log(err);
        return [];
    }
};

export const createUser = async (data: { email: string; password: string; fullName?: string; role?: any; avatarUrl?: string; pseudo?: string }) => {
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const [user] = await db.insert(users).values({
            email: data.email,
            password: hashedPassword,
            fullName: data.fullName,
            role: data.role || 'USER',
            avatarUrl: data.avatarUrl,
            pseudo: data.pseudo || data.email.split('@')[0],
            isActive: true
        }).returning();
        return user;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const deleteUser = async (userId: number) => {
    try {
        await db.delete(users).where(eq(users.id, userId));
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};