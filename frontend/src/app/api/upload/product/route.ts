import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        console.error("EROR KONFIGURASI SUPABASE:", { 
            hasUrl: !!supabaseUrl, 
            hasKey: !!supabaseKey
        });
        return NextResponse.json({ error: 'Konfigurasi Cloud Storage belum lengkap (URL/KEY missing)' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const oldUrl = formData.get('old_url') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File gambar produk tidak terdeteksi' }, { status: 400 });
    }

    // 1. Jika ada URL gambar lama, hapus dari storage Supabase agar menghemat ruang
    if (oldUrl) {
      try {
        const urlParts = oldUrl.split('/');
        const oldFileName = urlParts[urlParts.length - 1];
        if (oldFileName) {
          await supabase.storage.from('product_sippeto').remove([oldFileName]);
        }
      } catch (err) {
        console.error("Gagal menghapus file produk lama:", err);
      }
    }

    // 2. Baca file menjadi Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Format nama file agar unik dan bersih dari spasi
    const uniqueSuffix = Date.now().toString();
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `product-${uniqueSuffix}-${originalName}`;
    
    // 4. Unggah ke bucket 'product_sippeto'
    const { data, error } = await supabase.storage
      .from('product_sippeto')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('SUPABASE PRODUCT UPLOAD ERROR:', error);
      return NextResponse.json({ error: 'Gagal mengunggah gambar produk ke Cloud Storage Supabase' }, { status: 500 });
    }

    // 5. Ambil URL Publik gambar yang telah diunggah
    const { data: publicUrlData } = supabase.storage
      .from('product_sippeto')
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 200 });
  } catch (error) {
    console.error('SYSTEM PRODUCT UPLOAD ERROR:', error);
    return NextResponse.json({ error: 'Terjadi kegagalan sistem saat mengunggah gambar produk' }, { status: 500 });
  }
}
