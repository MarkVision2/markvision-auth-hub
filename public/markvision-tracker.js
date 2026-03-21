/**
 * MarkVision CRM Lead Tracker & Analytics Script
 * Project ID: bf3a691d-2856-43b6-930c-eb346f287c25
 */

(function() {
    window.MV_CONFIG = {
        projectId: 'bf3a691d-2856-43b6-930c-eb346f287c25',
        webhookUrl: 'https://n8n.markvision.kz/webhook/client-leads-XYZ', // Replace XYZ with your actual webhook path if different
    };

    const getUTM = () => {
        const params = new URLSearchParams(window.location.search);
        const utm = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
            const val = params.get(key);
            if (val) utm[key] = val;
        });
        return utm;
    };

    // Store UTMs in session to persist across pages
    const utms = getUTM();
    if (Object.keys(utms).length > 0) {
        sessionStorage.setItem('mv_utms', JSON.stringify({
            ...JSON.parse(sessionStorage.getItem('mv_utms') || '{}'),
            ...utms,
            timestamp: new Date().toISOString()
        }));
    }

    window.mvSendLead = async function(data) {
        const storedUtms = JSON.parse(sessionStorage.getItem('mv_utms') || '{}');
        const payload = {
            ...data,
            ...storedUtms,
            project_id: window.MV_CONFIG.projectId,
            metadata: {
                url: window.location.href,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };

        console.log('[MarkVision] Sending lead:', payload);

        try {
            const response = await fetch(window.MV_CONFIG.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            console.log('[MarkVision] Success:', await response.json());
            return { success: true };
        } catch (error) {
            console.error('[MarkVision] Error sending lead:', error);
            return { success: false, error: error.message };
        }
    };
})();
