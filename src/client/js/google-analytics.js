const { GOOGLE_ANALYTICS_ID } = require('../../config');
const GOOGLE_ANALYTICS_URL = 'https://www.googletagmanager.com/gtag/js';

module.exports = () => {
  const DEBUG = process.env.NODE_ENV !== 'production';
  if (DEBUG) {
    return;
  }

  let script = document.createElement('script');
  script.src = `${GOOGLE_ANALYTICS_URL}?id=${GOOGLE_ANALYTICS_ID}`;

  document.head.insertBefore(script, document.head.firstChild);

  window.dataLayer = window.dataLayer || [];
  /* global dataLayer */
  function gtag() {
    dataLayer.push(arguments);
  }
  gtag('js', new Date());

  gtag('config', 'GA_TRACKING_ID');
};
