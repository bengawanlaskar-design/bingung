import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

interface BrowserInfo {
  browser: string;
  os: string;
  device: string;
}

function parseUserAgent(userAgent: string): BrowserInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect Browser
  let browser = 'Unknown';
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Google Chrome';
  else if (ua.includes('firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Apple Safari';
  else if (ua.includes('msie') || ua.includes('trident/')) browser = 'Internet Explorer';
  else if (ua.includes('brave/')) browser = 'Brave';
  else if (ua.includes('vivaldi')) browser = 'Vivaldi';
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows nt 10')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.2')) os = 'Windows 8';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('ubuntu')) os = 'Ubuntu';
  else if (ua.includes('fedora')) os = 'Fedora';
  
  // Detect Device
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('iphone')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  else if (ua.includes('smart-tv') || ua.includes('smarttv')) device = 'Smart TV';
  else if (ua.includes('xbox')) device = 'Xbox';
  else if (ua.includes('playstation')) device = 'PlayStation';
  
  return { browser, os, device };
}

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'Unknown';
    
    // Get IP - try various headers
    let userIP = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 headersList.get('x-real-ip') ||
                 headersList.get('cf-connecting-ip') ||
                 headersList.get('true-client-ip') ||
                 headersList.get('x-client-ip') ||
                 'Unknown';
    
    // Clean up IP
    if (userIP.startsWith('::ffff:')) {
      userIP = userIP.substring(7);
    }
    
    const { browser, os, device } = parseUserAgent(userAgent);
    
    // Save session to database
    await db.userSession.create({
      data: {
        userIP,
        userAgent,
        browser,
        os,
        device,
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ip: userIP,
        userAgent,
        browser,
        os,
        device,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get user info'
    }, { status: 500 });
  }
}
