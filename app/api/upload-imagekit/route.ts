import { NextRequest, NextResponse } from 'next/server';
import ImageKit from 'imagekit';

let imagekit: ImageKit | null = null;

function getImageKit(): ImageKit | null {
  if (imagekit) return imagekit;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!publicKey || !privateKey || !urlEndpoint) return null;
  imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
  return imagekit;
}

export async function POST(request: NextRequest) {
  try {
    const ik = getImageKit();
    if (!ik) {
      return NextResponse.json(
        { error: 'ImageKit belum dikonfigurasi (cek IMAGEKIT_* di env).' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await ik.upload({
      file: buffer,
      fileName: fileName || `upload_${Date.now()}.jpg`,
      folder: '/profiles',
    });

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
    });
  } catch (error) {
    console.error('ImageKit upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
