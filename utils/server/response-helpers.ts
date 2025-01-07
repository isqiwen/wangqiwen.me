import { NextResponse } from "next/server";

/**
 * 为响应添加多个自定义头部
 * @param response - NextResponse 实例
 * @param headers - 自定义头部的键值对
 * @returns 修改后的响应
 */
export function setCustomHeaders(response: NextResponse, headers: Record<string, string>): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
