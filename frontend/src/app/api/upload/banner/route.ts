import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        console.error("EROR KONFIGURASI SUPABASE (BANNER):", { 
            hasUrl: !!supabaseUrl, 
            hasKey: !!supabaseKey,
            env: process.env.NODE_ENV
        });
        return NextResponse.json({ error: 'Konfigurasi Cloud Storage belum lengkap (URL/KEY missing)' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const oldUrl = formData.get('old_url') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File gambar banner tidak terdeteksi' }, { status: 400 });
    }

    if (oldUrl) {
      try {
        const urlParts = oldUrl.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        if (oldFileName) {
          await supabase.storage.from('sippeto_upload').remove([oldFileName]);
        }
      } catch (err) {
        console.error("Gagal menghapus file banner lama:", err);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now().toString();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `banner-${uniqueSuffix}-${originalName}`;
    
    // Upload eksklusif ke bucket sippeto_upload
    const { data, error } = await supabase.storage
      .from('sippeto_upload')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('SUPABASE BANNER UPLOAD ERROR:', error);
      return NextResponse.json({ error: 'Gagal mengunggah banner/iklan ke Cloud' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('sippeto_upload')
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 200 });
  } catch (error) {
    console.error('SYSTEM BANNER UPLOAD ERROR:', error);
    return NextResponse.json({ error: 'Terjadi kegagalan sistem saat mengunggah banner' }, { status: 500 });
  }
}
