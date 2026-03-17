import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    const images = await db.generatedImage.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      select: {
        id: true,
        prompt: true,
        size: true,
        createdAt: true,
        userIP: true,
        browser: true,
        os: true,
        device: true
      }
    });
    
    const total = await db.generatedImage.count();
    
    return NextResponse.json({
      success: true,
      data: {
        images: images.map(img => ({
          ...img,
          createdAt: img.createdAt.toISOString()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch images'
    }, { status: 500 });
  }
}
