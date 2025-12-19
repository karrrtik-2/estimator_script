(function(window) {
    // --- CONFIGURATION ---
    // Default Backend URL (Change this to your deployed Python Server URL, not localhost, when going live)
    let TOKEN_ENDPOINT = "http://127.0.0.1:5001/getToken"; 
    const LIVEKIT_WS_URL = "wss://medomvp-5xrf7qzx.livekit.cloud";
    const LIVEKIT_CDN = "https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.umd.min.js";

    // --- HTML TEMPLATE ---
    const WIDGET_HTML = `
        <div class="heavyhaul-wrapper">
            <div class="heavyhaul-btn" id="hh-launcher">
                <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
            </div>
            <div class="heavyhaul-popup" id="hh-popup">
                <div class="heavyhaul-popup-header">
                    <h3 class="heavyhaul-popup-title">HeavyHaul Dispatch</h3>
                    <button class="heavyhaul-header-btn" id="hh-close-btn" title="Close">
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                </div>
                <div class="heavyhaul-popup-body">
                    <!-- LOGIN VIEW -->
                    <div class="view-section active login-container" id="view-login">
                        <div class="form-group"><label class="form-label">Your Name</label><input type="text" id="hh-name-input" class="heavyhaul-input" placeholder="Enter name" value="Dispatcher" /></div>
                        <div class="form-group"><label class="form-label">States (Comma separated)</label><input type="text" id="hh-states-input" class="heavyhaul-input" placeholder="AZ, TX, CA" value="AZ, TX" /></div>
                        <div class="dims-grid">
                            <div class="form-group"><label class="form-label">Length</label><input type="text" id="hh-length" class="heavyhaul-input" placeholder="75ft" value="75ft 10in" /></div>
                            <div class="form-group"><label class="form-label">Width</label><input type="text" id="hh-width" class="heavyhaul-input" placeholder="10ft" value="10ft" /></div>
                            <div class="form-group"><label class="form-label">Height</label><input type="text" id="hh-height" class="heavyhaul-input" placeholder="14ft" value="14ft" /></div>
                            <div class="form-group"><label class="form-label">Weight</label><input type="text" id="hh-weight" class="heavyhaul-input" placeholder="80k lbs" value="80000lbs" /></div>
                        </div>
                        <div class="form-group"><label class="form-label">Overhang</label><input type="text" id="hh-overhang" class="heavyhaul-input" placeholder="0ft" value="0ft" /></div>
                        <div class="heavyhaul-controls" style="width:100%;"><button class="heavyhaul-main-btn" id="hh-connect-btn"><span>Start Session</span></button></div>
                    </div>
                    <!-- CHAT VIEW -->
                    <div class="view-section" id="view-chat">
                        <div class="heavyhaul-status" id="hh-status">Initializing...</div>
                        <div class="heavyhaul-conversation" id="hh-conversation"></div>
                        <div class="heavyhaul-controls"><button class="heavyhaul-main-btn disconnect" id="hh-disconnect-btn"><svg style="width:18px;height:18px;fill:currentColor;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg><span>End Call</span></button></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- CSS STYLES ---
    const WIDGET_CSS = `
        :root { --bg-dark: #1c2230; --bg-card: #2a3042; --text-light: #f0f2f5; --text-secondary: #a0aec0; --primary: #5466ff; --primary-hover: #4355ee; --red: #e74c3c; --green: #27ae60; --border-color: #3d4355; --input-bg: #202636; }
        .heavyhaul-wrapper { font-family: 'Segoe UI', Tahoma, sans-serif; }
        .heavyhaul-btn { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background-color: var(--primary); box-shadow: 0 4px 16px rgba(84, 102, 255, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; z-index: 99999; animation: hh-float 3s ease-in-out infinite; }
        .heavyhaul-btn:hover { transform: scale(1.1) translateY(-5px); background-color: var(--primary-hover); }
        .heavyhaul-btn svg { width: 24px; height: 24px; fill: white; }
        .heavyhaul-popup { position: fixed; bottom: 90px; right: 20px; width: 380px; height: 650px; max-height: 85vh; background-color: var(--bg-dark); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); display: flex; flex-direction: column; z-index: 99999; opacity: 0; transform: translateY(20px) scale(0.95); pointer-events: none; transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1); overflow: hidden; border: 1px solid rgba(84, 102, 255, 0.2); color: var(--text-light); box-sizing: border-box; }
        .heavyhaul-popup.active { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
        .heavyhaul-popup-header { background: linear-gradient(135deg, var(--primary) 0%, #4355ee 100%); padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        .heavyhaul-popup-title { color: white; font-weight: 600; font-size: 18px; margin: 0; }
        .heavyhaul-header-btn { background: rgba(255, 255, 255, 0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .heavyhaul-popup-body { padding: 15px; flex-grow: 1; display: flex; flex-direction: column; background-color: var(--bg-dark); }
        .view-section { display: none; flex-direction: column; height: 100%; overflow-y: auto; }
        .view-section.active { display: flex; }
        .form-group { margin-bottom: 5px; }
        .form-label { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; display: block; }
        .heavyhaul-input { width: 100%; padding: 10px; background-color: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; color: white; font-size: 14px; outline: none; box-sizing: border-box; }
        .dims-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .heavyhaul-status { padding: 10px; background: rgba(84, 102, 255, 0.1); border-left: 3px solid var(--primary); border-radius: 4px; margin-bottom: 10px; font-size: 13px; }
        .heavyhaul-status.error { border-color: var(--red); background: rgba(231, 76, 60, 0.1); }
        .heavyhaul-status.connected { border-color: var(--green); background: rgba(39, 174, 96, 0.1); }
        .heavyhaul-conversation { flex-grow: 1; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .heavyhaul-message { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; animation: hh-fade-in 0.2s; }
        .heavyhaul-user-message { align-self: flex-end; background: linear-gradient(135deg, var(--primary) 0%, #4355ee 100%); color: white; border-bottom-right-radius: 2px; }
        .heavyhaul-assistant-message { align-self: flex-start; background: var(--input-bg); border-left: 3px solid var(--primary); border-bottom-left-radius: 2px; }
        .heavyhaul-controls { margin-top: 15px; display: flex; justify-content: center; }
        .heavyhaul-main-btn { padding: 12px 24px; background: linear-gradient(135deg, var(--primary) 0%, #4355ee 100%); color: white; border: none; border-radius: 30px; cursor: pointer; font-size: 15px; font-weight: 500; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .heavyhaul-main-btn.disconnect { background: linear-gradient(135deg, var(--red) 0%, #c0392b 100%); }
        @keyframes hh-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes hh-fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    `;

    // --- MAIN CLASS ---
    class HeavyHaulWidget {
        constructor(config = {}) {
            this.room = null;
            this.config = config;
            
            // Allow overriding server URL via config
            if(config.serverUrl) {
                TOKEN_ENDPOINT = config.serverUrl;
            }

            this.injectStyles();
            this.injectHTML();
            this.loadDependencies().then(() => {
                this.initElements();
                this.prefillData();
                this.attachListeners();
            });
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = WIDGET_CSS;
            document.head.appendChild(style);
        }

        injectHTML() {
            const div = document.createElement('div');
            div.innerHTML = WIDGET_HTML;
            document.body.appendChild(div);
        }

        loadDependencies() {
            return new Promise((resolve, reject) => {
                if (window.LivekitClient) return resolve();
                const script = document.createElement('script');
                script.src = LIVEKIT_CDN;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        initElements() {
            this.launcher = document.getElementById('hh-launcher');
            this.popup = document.getElementById('hh-popup');
            this.closeBtn = document.getElementById('hh-close-btn');
            this.viewLogin = document.getElementById('view-login');
            this.viewChat = document.getElementById('view-chat');
            this.connectBtn = document.getElementById('hh-connect-btn');
            this.disconnectBtn = document.getElementById('hh-disconnect-btn');
            this.statusDiv = document.getElementById('hh-status');
            this.conversationDiv = document.getElementById('hh-conversation');
            
            // Inputs
            this.inputs = {
                name: document.getElementById('hh-name-input'),
                states: document.getElementById('hh-states-input'),
                length: document.getElementById('hh-length'),
                width: document.getElementById('hh-width'),
                height: document.getElementById('hh-height'),
                weight: document.getElementById('hh-weight'),
                overhang: document.getElementById('hh-overhang')
            };
        }

        prefillData() {
            // Fill inputs if data was passed in config
            if (this.config.name) this.inputs.name.value = this.config.name;
            if (this.config.states) this.inputs.states.value = this.config.states;
            
            if (this.config.dimensions) {
                const d = this.config.dimensions;
                if (d.length) this.inputs.length.value = d.length;
                if (d.width) this.inputs.width.value = d.width;
                if (d.height) this.inputs.height.value = d.height;
                if (d.weight) this.inputs.weight.value = d.weight;
                if (d.overhang) this.inputs.overhang.value = d.overhang;
            }
        }

        switchView(view) {
            this.viewLogin.classList.remove('active');
            this.viewChat.classList.remove('active');
            if (view === 'login') this.viewLogin.classList.add('active');
            if (view === 'chat') this.viewChat.classList.add('active');
        }

        addMessage(role, text) {
            const msg = document.createElement('div');
            const isAgent = role === 'agent';
            msg.className = `heavyhaul-message ${isAgent ? 'heavyhaul-assistant-message' : 'heavyhaul-user-message'}`;
            msg.innerHTML = `<div class="heavyhaul-msg-label">${isAgent ? 'Assistant' : 'You'}:</div>${text}`;
            this.conversationDiv.appendChild(msg);
            this.conversationDiv.scrollTop = this.conversationDiv.scrollHeight;
        }

        updateStatus(text, type) {
            this.statusDiv.textContent = text;
            this.statusDiv.className = 'heavyhaul-status';
            if (type) this.statusDiv.classList.add(type);
        }

        attachListeners() {
            this.launcher.addEventListener('click', () => {
                this.popup.classList.add('active');
                this.launcher.style.opacity = '0';
            });

            this.closeBtn.addEventListener('click', () => {
                this.popup.classList.remove('active');
                this.launcher.style.opacity = '1';
            });

            this.disconnectBtn.addEventListener('click', async () => {
                if (this.room) await this.room.disconnect();
            });

            this.connectBtn.addEventListener('click', async () => {
                await this.handleConnect();
            });
        }

        async handleConnect() {
            const name = this.inputs.name.value.trim();
            if (!name) { alert("Please enter your name"); return; }

            const requestData = {
                name: name,
                states: this.inputs.states.value,
                length: this.inputs.length.value,
                width: this.inputs.width.value,
                height: this.inputs.height.value,
                weight: this.inputs.weight.value,
                overhang: this.inputs.overhang.value
            };

            this.connectBtn.disabled = true;
            this.connectBtn.textContent = "Connecting...";

            try {
                // 1. Get Token
                const resp = await fetch(TOKEN_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData)
                });

                if (!resp.ok) throw new Error("Backend connection failed. Ensure server is running.");
                const data = await resp.json();

                // 2. Connect LiveKit
                const Room = window.LivekitClient.Room;
                const RoomEvent = window.LivekitClient.RoomEvent;
                
                this.room = new Room({ adaptiveStream: true, dynacast: true });

                this.room.on(RoomEvent.Connected, () => {
                    this.switchView('chat');
                    this.updateStatus('Connected to Dispatch', 'connected');
                    this.addMessage('agent', 'Hello! I am ready to help with your route.');
                    this.room.localParticipant.setMicrophoneEnabled(true);
                });

                this.room.on(RoomEvent.Disconnected, () => {
                    this.switchView('login');
                    this.connectBtn.disabled = false;
                    this.connectBtn.textContent = "Start Session";
                    this.updateStatus('Disconnected', 'error');
                    this.room = null;
                });

                this.room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
                    segments.forEach(segment => {
                        if (segment.final && segment.text.trim()) {
                            const isAgent = participant.identity.toLowerCase().includes("agent");
                            this.addMessage(isAgent ? 'agent' : 'user', segment.text);
                        }
                    });
                });

                this.room.on(RoomEvent.TrackSubscribed, (track) => {
                    if (track.kind === window.LivekitClient.Track.Kind.Audio) {
                        track.attach().play();
                    }
                });

                await this.room.connect(LIVEKIT_WS_URL, data.token);

            } catch (err) {
                console.error(err);
                alert("Error: " + err.message);
                this.connectBtn.disabled = false;
                this.connectBtn.textContent = "Start Session";
            }
        }
    }

    // Expose to window
    window.HeavyHaul = {
        init: (config) => new HeavyHaulWidget(config)
    };

})(window);
