import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'ar',
  localeDetection: false
});

export const config = {
  // Match all pathnames except for
  // - API routes (/api)
  // - Next.js internals (/ _next)
  // - Static files like images, icons (favicon.ico, etc.)
  matcher: ['/((?!api|_next/static|_next/image|images|logo.png|favicon.ico|robots.txt|sitemap.xml).*)']
};
