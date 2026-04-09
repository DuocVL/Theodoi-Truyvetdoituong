import { CreaterUserDto } from "../dtos/user.dto";
import * as userReposity from '../repositories/users.repository'

export const createUser = async (data: CreaterUserDto) => {
    const user = userReposity.create(data)
}