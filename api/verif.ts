export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const email = (req.query?.email as string || req.body?.email || '').trim();
  const link = (req.query?.link as string || req.body?.link || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email tidak valid. Silakan ulangi langkah 1.',
    });
  }

  if (!link) {
    return res.status(400).json({
      success: false,
      message: 'Link verifikasi tidak boleh kosong. Salin dan tempelkan link dari email Anda.',
    });
  }

  // Validate link domain
  try {
    const parsedUrl = new URL(link);
    const isAlightDomain =
      parsedUrl.protocol === 'https:' &&
      (parsedUrl.hostname === 'alight-creative.firebaseapp.com' ||
        parsedUrl.hostname === 'alightcreative.com' ||
        parsedUrl.hostname.endsWith('.firebaseapp.com') ||
        parsedUrl.hostname.includes('mitzy') ||
        parsedUrl.hostname === 'localhost');

    if (!isAlightDomain) {
      return res.status(400).json({
        success: false,
        message:
          'Link verifikasi harus berasal dari domain resmi Alight Motion (alight-creative.firebaseapp.com atau alightcreative.com).',
      });
    }
  } catch {
    return res.status(400).json({
      success: false,
      message: 'Format link tidak valid. Pastikan menyalin seluruh URL diawali dengan https://.',
    });
  }

  try {
    const targetUrl = `https://cloudvipnetwork.biz.id/api/amprem?action=verif&email=${encodeURIComponent(email)}&link=${encodeURIComponent(link)}`;
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    const data: any = await upstreamRes.json().catch(() => null);

    if (data && data.status === true) {
      return res.status(200).json({
        success: true,
        message: data.result?.message || `Akun ${email} berhasil di-verifikasi! Status Alight Motion Premium kini aktif.`,
      });
    } else {
      let rawMessage = data?.result?.message || '';

      if (typeof rawMessage === 'string' && rawMessage.includes('INVALID_OOB_CODE')) {
        rawMessage = 'Kode verifikasi (oobCode) tidak valid atau salah salin. Pastikan menyalin link lengkap dari email.';
      } else if (typeof rawMessage === 'string' && rawMessage.includes('EXPIRED_OOB_CODE')) {
        rawMessage = 'Link verifikasi telah kadaluarsa. Silakan kirim ulang link baru di Langkah 1.';
      } else if (typeof rawMessage === 'string' && rawMessage.includes('EMAIL_MISMATCH')) {
        rawMessage = 'Email yang dimasukkan tidak cocok dengan link verifikasi yang diterima.';
      } else if (!rawMessage) {
        rawMessage = 'Gagal memproses link verifikasi. Pastikan link masih baru dan belum pernah diklik di browser.';
      }

      return res.status(400).json({
        success: false,
        message: rawMessage,
      });
    }
  } catch (err: any) {
    console.error('Error forwarding /api/verif:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memverifikasi akun ke server Alight Motion. Silakan coba kembali.',
    });
  }
}
