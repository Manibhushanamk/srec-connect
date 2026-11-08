import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processPostImage, MAX_POST_IMAGES } from '@/lib/image-processor';
import { uploadToR2, generateR2Key } from '@/lib/r2';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserEmail = session?.user?.email?.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter'); // 'ALL' | 'STUDENT' | 'FACULTY'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const where: any = {};
    if (filter === 'STUDENT') {
      where.author = { role: 'STUDENT' };
    } else if (filter === 'FACULTY') {
      where.author = { role: { in: ['FACULTY', 'HOD'] } };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
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
        },
        likes: true,
        bookmarks: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
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
          include: {
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

    const currentUserId = currentUserEmail
      ? (await prisma.user.findUnique({ where: { email: currentUserEmail }, select: { id: true } }))?.id
      : null;

    const formattedPosts = posts.map((post) => {
      const isLiked = currentUserId ? post.likes.some((l) => l.userId === currentUserId) : false;
      const isBookmarked = currentUserId ? post.bookmarks.some((b) => b.userId === currentUserId) : false;

      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        visibility: post.visibility,
        author: {
          id: post.author.id,
          name: post.author.name || 'Campus Member',
          role: post.author.role,
          avatarUrl: post.author.avatarUrl,
          rollNumber: post.author.student?.rollNumber,
          designation: post.author.faculty?.designation,
          department: post.author.department?.name || post.author.student?.departmentName || post.author.faculty?.departmentName || 'CSE (AI & ML)',
          isVerified: post.author.student?.isActive || post.author.faculty?.isActive || true,
        },
        images: post.media.map((m) => m.url),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
        isLiked,
        isBookmarked,
        comments: post.comments.slice(-5),
        collaborators: post.collaborators.map((c) => ({
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

    return NextResponse.json({ posts: formattedPosts });
  } catch (error: any) {
    console.error('[API Posts GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch community posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required to post' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json({ error: 'Post content cannot be empty' }, { status: 400 });
    }

    if (content.length > 2500) {
      return NextResponse.json({ error: 'Post exceeds maximum length of 2500 characters' }, { status: 400 });
    }

    const rawImages: string[] = Array.isArray(body.images) ? body.images : [];

    // STRICT SPECIFICATION CHECK (Task 5.1): Max 2 images allowed per post
    if (rawImages.length > MAX_POST_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_POST_IMAGES} images allowed per post. Received ${rawImages.length}.` },
        { status: 400 }
      );
    }

    // Process and upload attached images to Cloudflare R2
    const processedMedia: { url: string; width: number; height: number; order: number }[] = [];

    for (let i = 0; i < rawImages.length; i++) {
      const raw = rawImages[i];
      let imgBuffer: Buffer;

      if (raw.startsWith('data:image/')) {
        const base64Data = raw.split(',')[1];
        imgBuffer = Buffer.from(base64Data, 'base64');
      } else if (raw.startsWith('http://') || raw.startsWith('https://')) {
        // Already hosted image URL
        processedMedia.push({ url: raw, width: 800, height: 600, order: i });
        continue;
      } else {
        imgBuffer = Buffer.from(raw, 'base64');
      }

      // Sharp WebP processing & compression
      const processed = await processPostImage(imgBuffer);
      const r2Key = generateR2Key('posts', `img-${Date.now()}-${i}.webp`);

      let publicUrl = '';
      try {
        publicUrl = await uploadToR2(r2Key, processed.buffer, processed.contentType);
      } catch (uploadErr) {
        console.warn('[R2 Upload Warning] Could not push to remote R2 bucket; saving fallback URL:', uploadErr);
        publicUrl = `data:image/webp;base64,${processed.buffer.toString('base64')}`;
      }

      processedMedia.push({
        url: publicUrl,
        width: processed.width,
        height: processed.height,
        order: i,
      });
    }

    // Persist to Neon DB in transaction
    const newPost = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorId: user.id,
          content,
          visibility: body.visibility === 'COLLEGE_ONLY' ? 'COLLEGE_ONLY' : 'PUBLIC',
          media: {
            create: processedMedia.map((m) => ({
              url: m.url,
              width: m.width,
              height: m.height,
              order: m.order,
            })),
          },
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
              student: { select: { rollNumber: true, departmentName: true } },
              faculty: { select: { designation: true, departmentName: true } },
            },
          },
          media: true,
          likes: true,
          bookmarks: true,
          comments: true,
        },
      });

      // Handle Instagram-style Collaboration Invites
      const rawCollabIds: string[] = Array.isArray(body.collaboratorIds) ? body.collaboratorIds : [];
      for (const collabId of rawCollabIds) {
        if (collabId && collabId !== user.id) {
          try {
            await tx.postCollaborator.create({
              data: {
                postId: post.id,
                userId: collabId,
                status: 'PENDING',
              },
            });

            // Dispatch in-app notification to invited collaborator
            await tx.notification.create({
              data: {
                userId: collabId,
                title: '🤝 Post Collaboration Request',
                message: `${user.name || 'A scholar'} invited you to co-author a post: "${content.substring(0, 60)}..."`,
                link: `/?post=${post.id}`,
              },
            });
          } catch (collabErr) {
            console.warn('[Post Collab Warning] Could not link collaborator:', collabErr);
          }
        }
      }

      return post;
    });

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error: any) {
    console.error('[API Posts POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: 500 });
  }
}
