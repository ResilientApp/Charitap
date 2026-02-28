// Geo-blocking middleware - US only
const geoBlock = (req, res, next) => {
  // Get country from headers (set by reverse proxy/CDN like Cloudflare)
  const country = req.headers['cf-ipcountry'] || 
                  req.headers['x-country-code'] || 
                  req.headers['cloudfront-viewer-country'];
  
  // In non-production environments, allow access without a country header
  // (Use NODE_ENV, not hostname, to avoid spoofing via Host header)
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // Fail-closed in production: if country header is missing or not 'US', block
  if (!country || country !== 'US') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Charitap is currently only available in the United States.',
      code: 'GEO_RESTRICTED'
    });
  }
  
  next();
};

module.exports = geoBlock;
