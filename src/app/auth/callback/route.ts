import { NextResponse } from 'next/server';
import { handleAuthCodeCallback } from '@/lib/auth';

export async function GET(request: Request) {
  return NextResponse.redirect(await handleAuthCodeCallback(request));
}
