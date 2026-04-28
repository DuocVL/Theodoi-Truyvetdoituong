import { LoginDto } from "../dtos/auth.dto";
import * as accountReposity from '../repositories/account.reposity';
import * as refreshTokenReposity from '../repositories/refreshtoken.reposity';
import { generateAccessToken, generateRefreshToken } from "../utils/token";
import { compareData } from '../utils/hash'
import { AccountPayload } from "../types/data";
import { RefreshTokenCreateInput } from "../../generated/prisma/models";

export const login = async (data: LoginDto) => {
  //Kiểm tra tồn tại
  const account = await accountReposity.findByUsername(data.username);

  if(!account){
    //TODO log 
    throw new Error ("Invalid username or password");
  }

  if(account.status !== "ACTIVE"){
    // TODO: log blocked account login attempt
      throw new Error("Account is not active");
  }

  const isMatch = await compareData(account.password, data.password);

  if(!isMatch){
    // TODO: log failed login attempt (wrong password)
      throw new Error("Invalid username or password")
  }

  
  const payload : AccountPayload = {
    id: account.id,
    type: account.type,
    device_id: "" // Xử lý thêm
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();

  //Ghi token mới
  const token: RefreshTokenCreateInput = {
    token_hash: refreshToken.hashedToken,
    device_id: "11111",
    account
  };
  const newToken = refreshTokenReposity.create();
}