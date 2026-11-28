import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { resolveFeedMediaUrl } from '@/lib/feed-media';

export interface PaginatedFeedResult {
  posts: any[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function fetchPaginatedPostsUncached({
  filter = 'ALL',
  cursor = null,
  take = 10,
  currentUserId = null,
}: {
  filter?: string | null;
  cursor?: string | null;
  take?: number;
  currentUserId?: string | null;
}): Promise<PaginatedFeedResult> {
  const safeTake = Math.min(Math.max(take, 1), 20);

  const where: any = {
    deletedAt: null,
    author: {
      deletedAt: null,
      status: 'ACTIVE',
      ...(filter === 'STUDENT' ? { role: 'STUDENT' } : {}),
      ...(filter === 'FACULTY' ? { role: { in: ['FACULTY', 'HOD'] } } : {}),
    },
  };

  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: safeTake + 1,
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      visibility: true,
      author: {
        select: {
          id: true,
          name: true,
          role: true,
          departmentId: true,
          avatarUrl: true,
          student: {
            select: {
              id: true,
              rollNumber: true,
              departmentName: true,
              isActive: true,
            },
          },
          faculty: {
            select: {
              id: true,
              designation: true,
              departmentName: true,
              isActive: true,
            },
          },
          department: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      media: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          url: true,
          thumbnailUrl: true,
          width: true,
          height: true,
          order: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      ...(currentUserId
        ? {
            likes: {
              where: { userId: currentUserId },
              select: { id: true },
              take: 1,
            },
            bookmarks: {
              where: { userId: currentUserId },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
      comments: {
        where: {
          author: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      },
      achievement: {
        select: {
          id: true,
          title: true,
          organizationEventName: true,
          category: { select: { name: true } },
        },
      },
      collaborators: {
        where: {
          user: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
        select: {
          id: true,
          userId: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
              student: { select: { rollNumber: true, departmentName: true } },
              faculty: { select: { designation: true, departmentName: true } },
            },
          },
        },
      },
    },
  });

  const hasMore = posts.length > safeTake;
  const pagePosts = hasMore ? posts.slice(0, safeTake) : posts;
  const nextCursor = hasMore ? pagePosts[pagePosts.length - 1].id : null;

  const formattedPosts = pagePosts.map((post: any) => {
    const isLiked = Array.isArray(post.likes) && post.likes.length > 0;
    const isBookmarked = Array.isArray(post.bookmarks) && post.bookmarks.length > 0;
    const resolvedImages = (post.media || [])
      .map((m: any) => resolveFeedMediaUrl(m))
      .filter((url: string | null): url is string => Boolean(url));

    return {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
      updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt,
      visibility: post.visibility,
      author: {
        id: post.author.id,
        name: post.author.name || 'Campus Member',
        role: post.author.role,
        departmentId: post.author.departmentId,
        avatarUrl: post.author.avatarUrl,
        rollNumber: post.author.student?.rollNumber,
        studentId: post.author.student?.id,
        facultyId: post.author.faculty?.id,
        designation: post.author.faculty?.designation,
        department:
          post.author.department?.name ||
          post.author.student?.departmentName ||
          post.author.faculty?.departmentName ||
          'CSE (AI & ML)',
        isVerified: post.author.student?.isActive || post.author.faculty?.isActive || true,
      },
      images: resolvedImages,
      likesCount: post._count?.likes ?? 0,
      commentsCount: post._count?.comments ?? 0,
      isLiked,
      isBookmarked,
      comments: [...(post.comments || [])].reverse().map((c: any) => ({
        ...c,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      })),
      collaborators: (post.collaborators || []).map((c: any) => ({
        id: c.id,
        userId: c.userId,
        name: c.user.name || 'Collaborator',
        rollNumber: c.user.student?.rollNumber,
        designation: c.user.faculty?.designation,
        role: c.user.role,
        avatarUrl: c.user.avatarUrl,
        status: c.status,
      })),
      achievement: post.achievement
        ? {
            id: post.achievement.id,
            title: post.achievement.title,
            category: post.achievement.category?.name || 'Achievement',
            issuer: post.achievement.organizationEventName,
            isVerified: true,
          }
        : undefined,
    };
  });

  return {
    posts: formattedPosts,
    nextCursor,
    hasMore,
  };
}

const getCachedPublicFeed = unstable_cache(
  async () => fetchPaginatedPostsUncached({ filter: 'ALL', cursor: null, take: 10, currentUserId: null }),
  ['public-feed-page-1'],
  { revalidate: 15, tags: ['public-feed'] }
);

export async function getInitialPublicFeed(): Promise<PaginatedFeedResult> {
  try {
    return await getCachedPublicFeed();
  } catch {
    return fetchPaginatedPostsUncached({ filter: 'ALL', cursor: null, take: 10, currentUserId: null });
  }
}
