import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('raw') === 'true';
    
    const image = await db.generatedImage.findUnique({
      where: { id },
      select: {
        id: true,
        prompt: true,
        imageData: true,
        size: true,
        createdAt: true,
        userIP: true,
        browser: true,
        os: true,
        device: true
      }
    });
    
    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'Image not found'
      }, { status: 404 });
    }
    
    // If raw=true, return the image directly as PNG
    if (raw && image.imageData) {
      const buffer = Buffer.from(image.imageData, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    
    // Otherwise return JSON with image data
    return NextResponse.json({
      success: true,
      data: {
        ...image,
        createdAt: image.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch image'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const existingImage = await db.generatedImage.findUnique({
      where: { id }
    });
    
    if (!existingImage) {
      return NextResponse.json({
        success: false,
        error: 'Image not found'
      }, { status: 404 });
    }
    
    await db.generatedImage.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete image'
    }, { status: 500 });
  }
}
