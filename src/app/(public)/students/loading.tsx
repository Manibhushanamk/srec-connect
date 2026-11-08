import React from 'react';
import { DirectoryPageSkeleton } from '@/components/ui/Skeleton';

export default function StudentsLoading() {
  return <DirectoryPageSkeleton count={6} />;
}
