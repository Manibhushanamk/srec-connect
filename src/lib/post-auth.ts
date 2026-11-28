export interface PostAuthUser {
  id: string;
  role: string;
  departmentId?: string | null;
}

export interface PostAuthTarget {
  id: string;
  authorId: string;
  visibility?: string;
  authorDepartmentId?: string | null;
}

export function canEditPost(
  currentUser: PostAuthUser | null | undefined,
  post: Pick<PostAuthTarget, 'authorId'>
): { allowed: boolean; reason?: string } {
  if (!currentUser) {
    return { allowed: false, reason: 'Unauthorized' };
  }
  if (post.authorId !== currentUser.id) {
    return { allowed: false, reason: 'Forbidden: Only the post author can edit post content' };
  }
  return { allowed: true };
}

export function canDeletePost(
  currentUser: PostAuthUser | null | undefined,
  post: PostAuthTarget
): { allowed: boolean; isModeratorDelete: boolean; reason?: string } {
  if (!currentUser) {
    return { allowed: false, isModeratorDelete: false, reason: 'Unauthorized' };
  }

  if (post.authorId === currentUser.id) {
    return { allowed: true, isModeratorDelete: false };
  }

  if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
    return { allowed: true, isModeratorDelete: true };
  }

  if (currentUser.role === 'WEB_MANAGER') {
    if (post.visibility === 'PRIVATE') {
      return {
        allowed: false,
        isModeratorDelete: false,
        reason: 'Forbidden: Private user posts cannot be moderated by Web Manager',
      };
    }
    return { allowed: true, isModeratorDelete: true };
  }

  if (currentUser.role === 'HOD') {
    if (!currentUser.departmentId) {
      return {
        allowed: false,
        isModeratorDelete: false,
        reason: 'Forbidden: HOD department binding required',
      };
    }
    if (post.authorDepartmentId !== currentUser.departmentId) {
      return {
        allowed: false,
        isModeratorDelete: false,
        reason: 'Forbidden: Cross-department moderation not permitted',
      };
    }
    return { allowed: true, isModeratorDelete: true };
  }

  return { allowed: false, isModeratorDelete: false, reason: 'Forbidden' };
}

const VALID_VISIBILITIES = new Set(['PUBLIC', 'COLLEGE_ONLY', 'PRIVATE']);
const VIDEO_EXT_RE = /\.(mp4|mov|webm|avi|mkv|m4v)(?:$|\?)/i;

export function validatePostUpdatePayload(body: {
  content?: unknown;
  visibility?: unknown;
  images?: unknown;
}): {
  valid: boolean;
  error?: string;
  content?: string;
  visibility?: 'PUBLIC' | 'COLLEGE_ONLY' | 'PRIVATE';
  images?: string[];
} {
  if (typeof body.content !== 'string' || !body.content.trim()) {
    return { valid: false, error: 'Post content cannot be empty' };
  }

  const trimmed = body.content.trim();
  if (trimmed.length > 3000) {
    return { valid: false, error: 'Post content exceeds 3000 characters' };
  }

  let visibility: 'PUBLIC' | 'COLLEGE_ONLY' | 'PRIVATE' | undefined;
  if (body.visibility !== undefined) {
    const vis = String(body.visibility).toUpperCase().trim();
    if (!VALID_VISIBILITIES.has(vis)) {
      return { valid: false, error: 'Invalid post visibility option' };
    }
    visibility = vis as 'PUBLIC' | 'COLLEGE_ONLY' | 'PRIVATE';
  }

  let images: string[] | undefined;
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      return { valid: false, error: 'Images payload must be an array' };
    }
    if (body.images.length > 2) {
      return { valid: false, error: 'Maximum 2 images allowed per campus post' };
    }
    images = [];
    for (const rawImg of body.images) {
      if (typeof rawImg !== 'string' || !rawImg.trim()) {
        return { valid: false, error: 'Invalid image entry in media list' };
      }
      const imgUrl = rawImg.trim();
      if (imgUrl.startsWith('data:video/') || VIDEO_EXT_RE.test(imgUrl)) {
        return { valid: false, error: 'Campus posts allow images only (videos are prohibited)' };
      }
      if (
        !imgUrl.startsWith('/api/drive/file/') &&
        !imgUrl.startsWith('/uploads/') &&
        !imgUrl.startsWith('https://') &&
        !imgUrl.startsWith('http://localhost') &&
        !imgUrl.startsWith('data:image/')
      ) {
        return { valid: false, error: 'Unsupported media URL format' };
      }
      images.push(imgUrl);
    }
  }

  return { valid: true, content: trimmed, visibility, images };
}
