// This is an empty middleware file
// It's created to ensure Next.js correctly generates the middleware manifest

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Just pass through all requests
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [], // Empty array means no paths are matched
}; 