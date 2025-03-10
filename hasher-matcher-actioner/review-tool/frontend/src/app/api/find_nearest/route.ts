import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Forward the request to the backend
    const response = await fetch('http://localhost:8000/find_nearest', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to find nearest matches: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error finding nearest matches:', error);
    return NextResponse.json(
      { error: 'Failed to find nearest matches' },
      { status: 500 }
    );
  }
} 