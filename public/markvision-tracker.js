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
            utm_source: utmTags.utm_source || null,
            utm_medium: utmTags.utm_medium || null,
            utm_campaign: utmTags.utm_campaign || null,
            utm_content: utmTags.utm_content || null,
            utm_term: utmTags.utm_term || null,
            // Additional data to be processed by CRM (leads_crm table)
            metadata: {
                ...getMetadata(),
                utm_tags: utmTags,
                additional_fields: formData
            }
        };

        try {
            // Direct insertion to Supabase via REST API
            // Note: This requires the "anon" role to have INSERT permissions on leads_crm
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5d21qZHJnaGNic2ljZHdvaG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDk0NzcsImV4cCI6MjA4ODM4NTQ3N30.Km1K3eBIDfSPLWJ42yeKIEQihe3vhKJ0Z-GrCc7AoQI';
            const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/leads_crm`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ 
                    name: payload.name,
                    phone: payload.phone,
                    source: payload.source,
                    project_id: payload.project_id,
                    utm_source: payload.utm_source,
                    utm_medium: payload.utm_medium,
                    utm_campaign: payload.utm_campaign,
                    utm_content: payload.utm_content,
                    utm_term: payload.utm_term
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[MarkVision] Supabase DB Error:', errorData);
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            console.log('[MarkVision] Lead sent successfully to Supabase');
            return { success: true };
        } catch (error) {
            console.error('[MarkVision] Failed to send lead:', error);
            return { success: false, error: error.message };
        }
    };

    // Initialize
    getUTMs();
    console.log('[MarkVision] Tracker initialized for project:', CONFIG.projectId);
})();
