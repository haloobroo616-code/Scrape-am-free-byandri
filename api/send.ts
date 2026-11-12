export default async function handler(req: any, res: any) {
  // Set CORS headers so that client can communicate smoothly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const email = (req.query?.email as string || req.body?.email || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Format email tidak valid. Masukkan alamat email yang benar.',
    });
  }

  try {
    const targetUrl = `https://cloudvipnetwork.biz.id/api/amprem?action=send&email=${encodeURIComponent(email)}`;
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });

    const data: any = await upstreamRes.json().catch(() => null);

    if (data && data.status === true) {
      return res.status(200).json({
        success: true,
        message: data.result?.message || `Link verifikasi berhasil dikirim ke ${email}. Silakan periksa kotak masuk atau spam email Anda!`,
      });
    } else {
      const errorMsg = data?.result?.message || 'Server pengirim sedang sibuk atau limit tercapai. Silakan coba beberapa saat lagi.';
      return res.status(400).json({
        success: false,
        message: errorMsg,
      });
    }
  } catch (err: any) {
    console.error('Error forwarding /api/send:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghubungi server verifikasi Alight Motion. Silakan coba kembali.',
    });
  }
}
