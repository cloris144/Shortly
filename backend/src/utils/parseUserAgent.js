function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', browserVersion: '', os: 'Unknown', deviceType: 'Unknown' };

  // Device type
  let deviceType = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = 'Tablet';
  else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini/i.test(ua)) deviceType = 'Mobile';
  else if (/bot|crawler|spider|scraper|curl|wget/i.test(ua)) deviceType = 'Bot';

  // OS
  let os = 'Unknown';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone os ([\d_]+)/i.test(ua)) os = `iOS ${ua.match(/iphone os ([\d_]+)/i)[1].replace(/_/g, '.')}`;
  else if (/ipad.*os ([\d_]+)/i.test(ua)) os = `iPadOS ${ua.match(/ipad.*os ([\d_]+)/i)[1].replace(/_/g, '.')}`;
  else if (/android ([\d.]+)/i.test(ua)) os = `Android ${ua.match(/android ([\d.]+)/i)[1]}`;
  else if (/mac os x ([\d_]+)/i.test(ua)) os = `macOS ${ua.match(/mac os x ([\d_]+)/i)[1].replace(/_/g, '.')}`;
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'ChromeOS';

  // Browser (order matters — check specific ones before generic)
  let browser = 'Unknown';
  let browserVersion = '';

  const matchers = [
    [/edg\/([\d.]+)/i, 'Edge'],
    [/opr\/([\d.]+)/i, 'Opera'],
    [/opera\/([\d.]+)/i, 'Opera'],
    [/samsungbrowser\/([\d.]+)/i, 'Samsung Browser'],
    [/ucbrowser\/([\d.]+)/i, 'UC Browser'],
    [/firefox\/([\d.]+)/i, 'Firefox'],
    [/fxios\/([\d.]+)/i, 'Firefox'],
    [/chrome\/([\d.]+)/i, 'Chrome'],
    [/crios\/([\d.]+)/i, 'Chrome'],
    [/version\/([\d.]+).*safari/i, 'Safari'],
    [/safari\/([\d.]+)/i, 'Safari'],
  ];

  for (const [re, name] of matchers) {
    const m = ua.match(re);
    if (m) {
      browser = name;
      browserVersion = m[1].split('.')[0]; // major version only
      break;
    }
  }

  return { browser, browserVersion, os, deviceType };
}

module.exports = { parseUserAgent };
