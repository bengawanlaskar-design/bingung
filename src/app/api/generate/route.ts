import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import ZAI from 'z-ai-web-dev-sdk';

interface BrowserInfo {
  browser: string;
  os: string;
  device: string;
}

function parseUserAgent(userAgent: string): BrowserInfo {
  const ua = userAgent.toLowerCase();
  
  let browser = 'Unknown';
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Google Chrome';
  else if (ua.includes('firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Apple Safari';
  else if (ua.includes('msie') || ua.includes('trident/')) browser = 'Internet Explorer';
  else if (ua.includes('brave/')) browser = 'Brave';
  
  let os = 'Unknown';
  if (ua.includes('windows nt 10')) os = 'Windows 10/11';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';
  
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('iphone')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  
  return { browser, os, device };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, size = '1024x1024', count = 1 } = body;
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 });
    }
    
    // Validate count (max 20)
    const imageCount = Math.min(Math.max(1, parseInt(String(count)) || 1), 20);
    
    // Validate size
    const validSizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440'];
    const imageSize = validSizes.includes(size) ? size : '1024x1024';
    
    // Get user info
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'Unknown';
    let userIP = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 headersList.get('x-real-ip') ||
                 headersList.get('cf-connecting-ip') ||
                 'Unknown';
    
    if (userIP.startsWith('::ffff:')) {
      userIP = userIP.substring(7);
    }
    
    const { browser, os, device } = parseUserAgent(userAgent);
    
    // Initialize ZAI
    const zai = await ZAI.create();
    
    const generatedImages = [];
    
    // Generate images one by one
    for (let i = 0; i < imageCount; i++) {
      try {
        const response = await zai.images.generations.create({
          prompt: prompt.trim(),
          size: imageSize as '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440'
        });
        
        const imageBase64 = response.data[0]?.base64;
        
        if (imageBase64) {
          // Save to database
          const savedImage = await db.generatedImage.create({
            data: {
              prompt: prompt.trim(),
              imageData: imageBase64,
              size: imageSize,
              userIP,
              userAgent,
              browser,
              os,
              device
            }
          });
          
          generatedImages.push({
            id: savedImage.id,
            prompt: savedImage.prompt,
            size: savedImage.size,
            createdAt: savedImage.createdAt.toISOString(),
            index: i + 1,
            total: imageCount
          });
        }
      } catch (imgError) {
        console.error(`Error generating image ${i + 1}:`, imgError);
        // Continue with next image even if one fails
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        images: generatedImages,
        total: generatedImages.length,
        requested: imageCount
      }
    });
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate images'
    }, { status: 500 });
  }
}
