(function($) {
    $(function() {
        var $deactivateLink = $('#the-list').find('[data-slug="wp-synapse-ai"] .deactivate a');
        
        if (!$deactivateLink.length) return;

        var modalHtml = `
            <div id="synapse-deactivation-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.85); z-index:999999; align-items:center; justify-content:center; backdrop-filter: blur(4px);">
                <div style="background:#1e293b; color:#f8fafc; padding:32px; border-radius:16px; width:480px; border:1px solid #334155; box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.5); font-family: 'Inter', sans-serif;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
                        <div style="background:rgba(99, 102, 241, 0.1); color:#6366f1; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </div>
                        <h2 style="margin:0; color:#fff; font-size:1.5rem; font-weight:700;">Wait! Why are you leaving?</h2>
                    </div>
                    
                    <p style="color:#94a3b8; line-height:1.6; margin-bottom:24px; font-size:0.95rem;">We're sorry to see you go. Could you please let us know why you're deactivating WP Synapse AI Builder? Your feedback helps us improve.</p>
                    
                    <div style="margin-bottom:24px; display:flex; flexDirection:column; gap:12px;">
                        <label style="display:flex; align-items:center; gap:10px; padding:12px; background:#0f172a; border:1px solid #334155; border-radius:8px; cursor:pointer; transition:all 0.2s;">
                            <input type="radio" name="deactivate_reason" value="temporary" checked style="margin:0;"> 
                            <span style="font-size:0.9rem; font-weight:500;">I'm just deactivating temporarily.</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; padding:12px; background:#0f172a; border:1px solid #334155; border-radius:8px; cursor:pointer; transition:all 0.2s;">
                            <input type="radio" name="deactivate_reason" value="difficult" style="margin:0;"> 
                            <span style="font-size:0.9rem; font-weight:500;">It's too difficult to use.</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; padding:12px; background:#0f172a; border:1px solid #334155; border-radius:8px; cursor:pointer; transition:all 0.2s;">
                            <input type="radio" name="deactivate_reason" value="broken" style="margin:0;"> 
                            <span style="font-size:0.9rem; font-weight:500;">The plugin is broken / has bugs.</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; padding:12px; background:#0f172a; border:1px solid #334155; border-radius:8px; cursor:pointer; transition:all 0.2s;">
                            <input type="radio" name="deactivate_reason" value="other" style="margin:0;"> 
                            <span style="font-size:0.9rem; font-weight:500;">Other reason</span>
                        </label>
                        <textarea id="synapse-deactivate-other-text" style="width:100%; background:#0c1222; border:1px solid #334155; color:#fff; padding:12px; border-radius:8px; margin-top:8px; display:none; font-family:inherit; font-size:0.9rem; resize:vertical;" placeholder="Please describe the issue..." rows="3"></textarea>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:12px;">
                        <button id="synapse-cancel-deactivation" style="background:transparent; color:#94a3b8; border:1px solid #334155; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem; transition:all 0.2s;">Cancel</button>
                        <button id="synapse-confirm-deactivation" style="background:#6366f1; color:#fff; border:none; padding:10px 24px; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem; transition:all 0.2s; box-shadow:0 4px 12px rgba(99, 102, 241, 0.3);">Submit & Deactivate</button>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHtml);

        var $modal = $('#synapse-deactivation-modal');
        var $otherText = $('#synapse-deactivate-other-text');

        $('input[name="deactivate_reason"]').on('change', function() {
            // Reset styles for all labels
            $('input[name="deactivate_reason"]').parent().css('border-color', '#334155').css('background', '#0f172a');
            // Highlight selected
            $(this).parent().css('border-color', '#6366f1').css('background', 'rgba(99, 102, 241, 0.05)');

            if ($(this).val() === 'other') {
                $otherText.show().focus();
            } else {
                $otherText.hide();
            }
        });

        $deactivateLink.on('click', function(e) {
            e.preventDefault();
            $modal.css('display', 'flex');
        });

        $('#synapse-cancel-deactivation').on('click', function() {
            $modal.hide();
        });

        $('#synapse-confirm-deactivation').on('click', function() {
            $(this).text('Processing...').prop('disabled', true);
            
            var reason = $('input[name="deactivate_reason"]:checked').val();
            var details = $otherText.val();
            
            // In a real app, you might send this to a feedback endpoint via AJAX
            // For now, we'll just delay slightly for effect and then proceed
            setTimeout(function() {
                window.location.href = $deactivateLink.attr('href');
            }, 600);
        });

        // Close on background click
        $modal.on('click', function(e) {
            if (e.target === this) {
                $modal.hide();
            }
        });
    });
})(jQuery);
