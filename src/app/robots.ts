import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/departments',
          '/departments/*',
          '/events',
          '/events/*',
          '/achievements',
          '/faculty',
          '/faculty/*',
          '/students',
          '/students/*',
        ],
        disallow: [
          '/admin/',
          '/admin/*',
          '/api/',
          '/api/*',
          '/profile',
          '/profile/*',
          '/student/dashboard',
          '/faculty/dashboard',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
