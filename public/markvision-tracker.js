/**
 * MarkVision Tracker & Lead Capture Script
 * Project ID: bf3a691d-2856-43b6-930c-eb346f287c25
 * 
 * This script captures UTM parameters and provides a window.mvSendLead() function.
 * It sends leads directly to MarkVision CRM (Supabase) via the provided Webhook.
 */

(function() {
    // Configuration - ADJUST THESE IF NEEDED
    const CONFIG = {
        projectId: 'bf3a691d-2856-43b6-930c-eb346f287c25',
        // Default Webhook URL (n8n or Edge Function)
        // If you have a real n8n webhook, paste it here.
        // If not, we use the CRM Dispatcher.
        webhookUrl: 'https://n8n.zapoinov.com/webhook/execute-any-flow-new',
        supabaseUrl: 'https://iywmjdrghcbsicdwohmb.supabase.co',
        // Note: For security, use an anonymized endpoint or n8n proxy for production
    };

    // 1. UTM Capture logic
    function getUTMs() {
        const params = new URLSearchParams(window.location.search);
        const utms = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
            if (params.get(key)) utms[key] = params.get(key);
        });
        
        // Persist UTMs in sessionStorage so they survive navigation
        if (Object.keys(utms).length > 0) {
            sessionStorage.setItem('mv_utms', JSON.stringify(utms));
        }
        
        return utms;
    }

    // 2. Metadata collection
    function getMetadata() {
        return {
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            resolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // 3. Lead Sending Function
    window.mvSendLead = async function(formData) {
        console.log('[MarkVision] Sending lead...', formData);
        
        const storedUtms = JSON.parse(sessionStorage.getItem('mv_utms') || '{}');
        const currentUtms = getUTMs();
        const utmTags = { ...storedUtms, ...currentUtms };
        
        const payload = {
            name: formData.name || 'Site Lead',
            phone: formData.phone || '',
            source: formData.source || window.location.hostname,
            project_id: CONFIG.projectId,
            utm_campaign: utmTags.utm_campaign || null,
            // Additional data to be processed by CRM
            metadata: {
                ...getMetadata(),
                utm_tags: utmTags,
                additional_fields: formData
            }
        };

        try {
            // We use the Dispatcher or a direct insert if configured
            // Since n8n is preferred for analytics, we hit the dispatcher
            const response = await fetch(CONFIG.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'create_lead',
                    ...payload 
                })
            });

            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            
            console.log('[MarkVision] Lead sent successfully');
            return { success: true };
        } catch (error) {
            console.error('[MarkVision] Failed to send lead:', error);
            
            // Backup: Try direct Supabase insert if Webhook fails (requires RLS to be open)
            /*
            try {
                // ... backup logic ...
            } catch (e) {}
            */
            
            return { success: false, error: error.message };
        }
    };

    // Initialize
    getUTMs();
    console.log('[MarkVision] Tracker initialized for project:', CONFIG.projectId);
})();
