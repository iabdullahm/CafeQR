
import { NextResponse } from 'next/server';

export const successResponse = (message: string, data: any = {}, statusCode: number = 200) => {
  return NextResponse.json({
    success: true,
    message,
    data
  }, { status: statusCode });
};

export const errorResponse = (message: string, statusCode: number = 500, errors: any = null) => {
  return NextResponse.json({
    success: false,
    message,
    errors
  }, { status: statusCode });
};
