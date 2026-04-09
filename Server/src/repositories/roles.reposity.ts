import { prismaClient } from '../configs/prisma.js'


// TODO Chưa viết xong

export async function createRole(data: CreateRoleDTO) {
    
}

export async function updateRole() {
    
}

export async function findRoleByName(name: string): Promise<Role | null> {
    return null;
}

export async function findRoleById(id: String): Promise<Role | null> {
    return null;
}

export async function deleteRole(id: string): Promise<void> {
    
}

export async function getAllRule(): Promise<Role[]>{
    return [];
}

export async function existsByName(name: string): Promise<boolean> {
    return <boolean>(true);
}