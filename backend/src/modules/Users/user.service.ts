import{
    createUserRepository,
    getUserByIdRepository,
    upadateUserRepository,
    deleteUserRepository,
    type User,
    type CreateUserInput,
    type UpdateUser
} from "./user.repository";

export class UserError extends Error {
    constructor(message: string, public readonly statusCode: number) {
        super(message);
        this.name = "UserError";
    }
}

function validateUserId(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new UserError("ID do usuário inválido", 400);
    }
}

function validateUserInput(user: CreateUserInput): CreateUserInput {
    if (!user.name_user || !user.name_user.trim() || Array.from(user.name_user.trim()).length>50) {
        throw new UserError("Todos os campos são obrigatórios", 400);
    }
    if (!user.email_user || !user.email_user.trim() || Array.from(user.email_user.trim()).length>50) {
        throw new UserError("Email inválido", 400);
    }
    if (!user.password_user || !user.password_user.trim() || Array.from(user.password_user.trim()).length>25){
        throw new UserError("Senha inválida", 400);
    } 
    return user;  
}

function handleRepositoryError(error: unknown): never {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
        throw new UserError("Já existe um usuário com esse nome.", 409);
    }
    throw error;
}

export async function createUserService(user: CreateUserInput): Promise<User> {
    const data = validateUserInput(user);
    try {
        return await createUserRepository(data);
    } catch (error) {
        handleRepositoryError(error);
    } 
}

export async function getUserByIdService(id: number): Promise<User | null> {
    validateUserId(id);
    const user = await getUserByIdRepository(id);
    if (!user) {
        throw new UserError("Usuário não encontrado", 404);
    }
    return user;
}

export async function updateUserService(user: UpdateUser): Promise<User> {
    validateUserId(user.id_user);
    const { id_user, ...input } = user;
    const data = validateUserInput(input);
    try{
        const updatedUser = await upadateUserRepository({id_user, ...data});
        if (!updatedUser) {
            throw new UserError("Usuário não encontrado", 404);
        }
        return updatedUser;   
    }catch (error) {
        handleRepositoryError(error);
    }
}

export async function deleteUserService(id: number): Promise<User | null> {
    validateUserId(id);
    const user = await deleteUserRepository(id);
    try {
        if (!user) {
            throw new UserError("Usuário não encontrado", 404);
        }
        return user;
    } catch (error) {
        handleRepositoryError(error);
    }
}