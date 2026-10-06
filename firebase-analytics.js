/**
 * Firebase Analytics Tracking Module für MagicWrite PWA
 * Loggt relevante Nutzerinteraktionen für App-Analyse
 */

// Firebase Analytics Event Tracker
class MagicWriteAnalytics {
  constructor() {
    this.db = null;
    this.analytics = null;
    this.isInitialized = false;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialisiert Firebase Analytics
   * @param {object} firebaseConfig - Firebase Konfigurationsobjekt
   */
  init(firebaseConfig) {
    try {
      if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK nicht geladen');
        return;
      }

      firebase.initializeApp(firebaseConfig);
      this.analytics = firebase.analytics();
      this.db = firebase.firestore();
      this.isInitialized = true;

      // Set user properties
      this.setUserProperties();
      
      // Log app start
      this.logEvent('app_start', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      });

      console.log('Firebase Analytics initialisiert');
    } catch (error) {
      console.error('Firebase Analytics Initialisierung fehlgeschlagen:', error);
    }
  }

  /**
   * Generiert eindeutige Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setzt Nutzereigenschaften für bessere Segmentierung
   */
  setUserProperties() {
    if (!this.isInitialized) return;

    const userProps = {
      'app_version': '1.0.0',
      'pwa_installed': this.isPwaInstalled() ? 'yes' : 'no',
      'theme_preference': document.documentElement.getAttribute('data-theme') || 'auto',
      'device_type': this.getDeviceType()
    };

    Object.entries(userProps).forEach(([key, value]) => {
      this.analytics.setUserProperties({ [key]: value });
    });
  }

  /**
   * Loggt Nutzerinteraktionen als Events
   * @param {string} eventName - Name des Events
   * @param {object} params - Event Parameter
   */
  logEvent(eventName, params = {}) {
    if (!this.isInitialized) {
      console.log(`[Analytics] ${eventName}:`, params);
      return;
    }

    const enrichedParams = {
      ...params,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    };

    this.analytics.logEvent(eventName, enrichedParams);
    console.log(`[Analytics] ${eventName}:`, enrichedParams);
  }

  /**
   * Loggt Character-Auswahl
   */
  logCharacterSelect(character) {
    this.logEvent('character_selected', {
      character: character,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Canvas Drawing (Handschrift)
   */
  logCanvasDraw(strokeCount, duration) {
    this.logEvent('canvas_draw', {
      stroke_count: strokeCount,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Text Export
   */
  logExport(format, pageCount) {
    this.logEvent('content_exported', {
      export_format: format,
      page_count: pageCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Format-Wechsel
   */
  logFormatChange(newFormat, oldFormat) {
    this.logEvent('format_changed', {
      new_format: newFormat,
      old_format: oldFormat,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Einstellungsänderungen
   */
  logSettingChange(setting, newValue, oldValue) {
    this.logEvent('setting_changed', {
      setting_name: setting,
      new_value: newValue,
      old_value: oldValue,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Modal Öffnen/Schließen
   */
  logModalInteraction(modalName, action) {
    this.logEvent('modal_interaction', {
      modal_name: modalName,
      action: action, // 'open' oder 'close'
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Text-Input Aktivität
   */
  logTextInput(textLength, language) {
    this.logEvent('text_input', {
      text_length: textLength,
      language: language,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Theme-Wechsel
   */
  logThemeChange(newTheme) {
    this.logEvent('theme_changed', {
      new_theme: newTheme,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Seitenwechsel (bei mehreren Seiten)
   */
  logPageNavigation(currentPage, totalPages) {
    this.logEvent('page_navigation', {
      current_page: currentPage,
      total_pages: totalPages,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Feature-Nutzung (z.B. Symbole, Varianten)
   */
  logFeatureUsage(featureName, details = {}) {
    this.logEvent('feature_used', {
      feature_name: featureName,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Fehler für Debugging
   */
  logError(errorName, errorMessage, errorContext = {}) {
    this.logEvent('app_error', {
      error_name: errorName,
      error_message: errorMessage,
      error_context: JSON.stringify(errorContext),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Loggt Session-Ende
   */
  logSessionEnd(sessionDuration) {
    this.logEvent('session_end', {
      session_id: this.sessionId,
      session_duration_ms: sessionDuration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Speichert benutzerdefinierte Daten in Firestore
   */
  async logCustomData(collection, data) {
    if (!this.isInitialized || !this.db) return;

    try {
      await this.db.collection(collection).add({
        ...data,
        session_id: this.sessionId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Fehler beim Speichern von Custom Data:', error);
    }
  }

  /**
   * Erkennt Gerätetyp
   */
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile|android|iphone|ipad|phone/i.test(ua.toLowerCase())) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Prüft ob PWA installiert ist
   */
  isPwaInstalled() {
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches ||
           localStorage.getItem('mw-install-shown') === '1';
  }
}

// Global Instance
const mwAnalytics = new MagicWriteAnalytics();
