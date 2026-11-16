import { NextRequest, NextResponse } from 'next/server';
import { handleAuthConfirmCallback } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return NextResponse.redirect(await handleAuthConfirmCallback(request));
}

