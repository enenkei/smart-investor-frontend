"use server"

import { prisma } from "@/lib/prisma";
import { SystemSetting } from "@/generated/prisma/client";


// XOR-Hex Encryption Logic
const XOR_KEY = process.env.SETTINGS_ENCRYPTION_KEY || "invest-smarter-fc986e2b75df6f4ec5b2ef67296ec20e";

function encrypt(text: string): string {
    return text.split('').map((char, i) => {
        const charCode = char.charCodeAt(0) ^ XOR_KEY.charCodeAt(i % XOR_KEY.length);
        return charCode.toString(16).padStart(2, '0');
    }).join('');
}

function decrypt(hex: string): string {
    if (!hex) return "";
    const bytes = hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
    return bytes.map((byte, i) => {
        return String.fromCharCode(byte ^ XOR_KEY.charCodeAt(i % XOR_KEY.length));
    }).join('');
}

export const getSystemSettings = async (): Promise<SystemSetting[]> => {
    try {
        const settings = await prisma.systemSetting.findMany({
            orderBy: { key: 'asc' }
        });

        return settings.map(s => ({
            ...s,
            value: decrypt(s.value)
        }));
    } catch (err) {
        console.error("Failed to load settings", err);
        return [];
    }
}

export const updateSystemSettings = async (settings: SystemSetting[]) => {
    try {
        const results = [];
        for (const setting of settings) {
            const encrypted = encrypt(setting.value);
            const updated = await prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: {
                    name: setting.name,
                    description: setting.description,
                    value: encrypted,
                    updatedAt: new Date()
                },
                create: {
                    key: setting.key,
                    name: setting.name,
                    description: setting.description,
                    value: encrypted
                },
            });
            results.push(updated);
        }
        return results;
    } catch (err) {
        console.error("Failed to update settings", err);
        throw err;
    }
}

export const deleteSystemSetting = async (key: string) => {
    try {
        return await prisma.systemSetting.delete({
            where: { key }
        });
    } catch (err) {
        console.error("Failed to delete setting", err);
        throw err;
    }
}

export const getSystemSetting = async (key: string) => {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key }
        });
        return setting ? { ...setting, value: decrypt(setting.value) } : null;
    } catch (err) {
        console.error("Failed to get setting", err);
        throw err;
    }
}