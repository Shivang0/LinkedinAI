import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { prisma } from '@linkedin-ai/database';
import { getSession } from '@/lib/auth';
import { nanoid } from 'nanoid';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
const MAX_PDF_SIZE = 100 * 1024 * 1024; // 100MB for PDFs
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const mimeType = file.type;
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isPdf = ALLOWED_PDF_TYPES.includes(mimeType);

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.' },
        { status: 400 }
      );
    }

    // Check file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSizeMB}MB.` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'bin';
    const filename = `${nanoid()}.${fileExtension}`;
    const storagePath = `media/${session.userId}/${filename}`;

    // Upload to Vercel Blob
    const blob = await put(storagePath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Create MediaAsset record in database
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        userId: session.userId,
        filename,
        originalName: file.name,
        mimeType,
        size: file.size,
        storagePath,
        publicUrl: blob.url,
      },
    });

    return NextResponse.json({
      id: mediaAsset.id,
      url: blob.url,
      filename: mediaAsset.originalName,
      mimeType: mediaAsset.mimeType,
      size: mediaAsset.size,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('id');

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    // Find the asset and verify ownership
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete from Vercel Blob
    if (asset.publicUrl) {
      await del(asset.publicUrl);
    }

    // Delete from database
    await prisma.mediaAsset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
