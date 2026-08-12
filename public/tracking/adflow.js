/**
 * ============================================
 * AD FLOW - FIRST-PARTY TRACKING SCRIPT
 * ============================================
 * Captura UTMs, fbclid, gclid, gera um adflow_id 
 * e persiste no localStorage/cookie para não perder a origem.
 */

(function() {
  const SCRIPT_VERSION = '1.0.0';
  const STORAGE_KEY = 'adflow_tracking_data';

  // Helper to get query parameters
  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Helper to generate a unique ID
  function generateUUID() {
    let dt = new Date().getTime();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // Collect data
  function collectData() {
    // 1. Get existing data from localStorage
    let storedData = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) storedData = JSON.parse(raw);
    } catch (e) {
      console.warn('[AdFlow] Could not read from localStorage', e);
    }

    // 2. Extract current URL parameters
    const currentParams = {
      utm_source: getQueryParam('utm_source'),
      utm_medium: getQueryParam('utm_medium'),
      utm_campaign: getQueryParam('utm_campaign'),
      utm_term: getQueryParam('utm_term'),
      utm_content: getQueryParam('utm_content'),
      fbclid: getQueryParam('fbclid'),
      gclid: getQueryParam('gclid'),
    };

    // 3. Determine if we have new traffic source data
    // We only overwrite the source if it's a new paid/tagged click (not just navigating around the site)
    const hasNewSource = Object.values(currentParams).some(val => val !== null && val !== '');

    const trackingData = {
      adflow_id: storedData?.adflow_id || generateUUID(),
      first_visit_at: storedData?.first_visit_at || new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
      // If there's a new source in URL, use it, otherwise keep the old one (First-touch attribution approach)
      // Alternatively, we could do Last-touch. For B2B, First-touch or keeping a history is common.
      // We will do a simple Last-Touch for now if a new tagged URL is present.
      source_data: hasNewSource ? currentParams : (storedData?.source_data || currentParams),
      url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent
    };

    // 4. Save back to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trackingData));
    } catch (e) {
      console.warn('[AdFlow] Could not save to localStorage', e);
    }

    return trackingData;
  }

  // Execute collection on load
  const data = collectData();

  // Make it available globally so CRM forms (like Kommo or Elementor) can grab it and inject it into hidden fields
  window.AdFlow = {
    getData: function() {
      return data;
    },
    getAdFlowId: function() {
      return data.adflow_id;
    },
    getSourceData: function() {
      return data.source_data;
    }
  };

  console.log(`[AdFlow Tracking v${SCRIPT_VERSION}] Initialized. ID: ${data.adflow_id}`);

})();
