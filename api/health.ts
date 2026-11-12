export default function handler(_req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  return res.status(200).json({
    status: 'online',
    service: 'Alight Motion Mitzy Verification',
    timestamp: Date.now(),
  });
}
