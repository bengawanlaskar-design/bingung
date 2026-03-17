import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const result = await db.generatedImage.deleteMany();
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} images`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error deleting all images:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete all images'
    }, { status: 500 });
  }
}
