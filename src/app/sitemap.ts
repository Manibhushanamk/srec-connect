import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // 1. Core static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/departments`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/achievements`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/faculty`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/students`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  try {
    // 2. Dynamic event detail routes
    const events = await prisma.event.findMany({
      where: { deletedAt: null },
      select: { id: true, updatedAt: true },
      take: 100,
    });

    const eventRoutes: MetadataRoute.Sitemap = events.map((ev) => ({
      url: `${baseUrl}/events/${ev.id}`,
      lastModified: ev.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 3. Dynamic student portfolio routes
    const students = await prisma.student.findMany({
      where: { isActive: true, deletedAt: null },
      select: { rollNumber: true, updatedAt: true },
      take: 100,
    });

    const studentRoutes: MetadataRoute.Sitemap = students.map((s) => ({
      url: `${baseUrl}/students/${s.rollNumber}`,
      lastModified: s.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...eventRoutes, ...studentRoutes];
  } catch (error) {
    console.error('[Sitemap] Failed to fetch dynamic entities:', error);
    return staticRoutes;
  }
}
